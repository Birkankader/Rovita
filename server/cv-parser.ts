import OpenAI from "openai";
import { z } from "zod";

// Support both Replit AI Integrations (development) and direct OpenAI API (production)
function createOpenAIClient() {
  // First try Replit AI Integrations
  if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    return new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
    });
  }
  // Fall back to direct OpenAI API
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return null;
}

const openai = createOpenAIClient();

const parsedCVSchema = z.object({
  jobTitle: z.string().max(200).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  skills: z.array(z.string().max(100)).max(50).optional().default([]),
  experience: z.array(z.object({
    title: z.string().max(200),
    company: z.string().max(200),
    description: z.string().max(1000),
  })).max(20).optional().default([]),
  education: z.array(z.object({
    degree: z.string().max(200),
    school: z.string().max(200),
  })).max(10).optional().default([]),
});

function truncateString(str: string | null | undefined, maxLength: number): string | null {
  if (!str) return null;
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

interface SanitizeResult {
  data: ParsedCV;
  warnings: string[];
  droppedCounts: { skills: number; experience: number; education: number };
}

function sanitizeParsedCV(raw: any): SanitizeResult {
  const warnings: string[] = [];
  const droppedCounts = { skills: 0, experience: 0, education: 0 };

  const rawSkills = Array.isArray(raw?.skills) ? raw.skills : [];
  const skills = rawSkills
    .slice(0, 50)
    .map((s: any) => typeof s === "string" ? truncateString(s.trim(), 100) : null)
    .filter((s: string | null): s is string => {
      if (!s || s.length === 0) {
        droppedCounts.skills++;
        return false;
      }
      return true;
    });
  
  if (droppedCounts.skills > 0) {
    warnings.push(`${droppedCounts.skills} beceri geçersiz veya boş olduğu için çıkarıldı`);
  }
  if (rawSkills.length > 50) {
    warnings.push(`Beceri sayısı 50 ile sınırlandırıldı (${rawSkills.length} beceri bulundu)`);
  }

  const rawExperience = Array.isArray(raw?.experience) ? raw.experience : [];
  const experience = rawExperience
    .slice(0, 20)
    .filter((e: any) => {
      if (!e?.title || !e?.company) {
        droppedCounts.experience++;
        return false;
      }
      const title = String(e.title).trim();
      const company = String(e.company).trim();
      if (title.length === 0 || company.length === 0) {
        droppedCounts.experience++;
        return false;
      }
      return true;
    })
    .map((e: any) => ({
      title: truncateString(String(e.title).trim(), 200) || "",
      company: truncateString(String(e.company).trim(), 200) || "",
      description: truncateString(String(e.description || "").trim(), 1000) || "",
    }));
  
  if (droppedCounts.experience > 0) {
    warnings.push(`${droppedCounts.experience} deneyim eksik bilgi nedeniyle çıkarıldı`);
  }
  if (rawExperience.length > 20) {
    warnings.push(`Deneyim sayısı 20 ile sınırlandırıldı`);
  }

  const rawEducation = Array.isArray(raw?.education) ? raw.education : [];
  const education = rawEducation
    .slice(0, 10)
    .filter((e: any) => {
      if (!e?.degree || !e?.school) {
        droppedCounts.education++;
        return false;
      }
      const degree = String(e.degree).trim();
      const school = String(e.school).trim();
      if (degree.length === 0 || school.length === 0) {
        droppedCounts.education++;
        return false;
      }
      return true;
    })
    .map((e: any) => ({
      degree: truncateString(String(e.degree).trim(), 200) || "",
      school: truncateString(String(e.school).trim(), 200) || "",
    }));
  
  if (droppedCounts.education > 0) {
    warnings.push(`${droppedCounts.education} eğitim bilgisi eksik olduğu için çıkarıldı`);
  }
  if (rawEducation.length > 10) {
    warnings.push(`Eğitim sayısı 10 ile sınırlandırıldı`);
  }

  return {
    data: {
      jobTitle: truncateString(raw?.jobTitle?.trim?.() || null, 200),
      bio: truncateString(raw?.bio?.trim?.() || null, 2000),
      skills,
      experience,
      education,
    },
    warnings,
    droppedCounts,
  };
}

interface ParsedCV {
  jobTitle: string | null;
  bio: string | null;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
  }>;
}

export interface ParseCVResult {
  data: ParsedCV;
  warnings: string[];
  degraded: boolean;
}

export async function parseCVText(cvText: string): Promise<ParseCVResult> {
  if (!openai) {
    throw new Error("AI entegrasyonu yapılandırılmamış. Lütfen OPENAI_API_KEY ayarlayın.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a CV/Resume parser. Extract structured information from the provided CV text.
Return a JSON object with the following structure:
{
  "jobTitle": "Current or most recent job title",
  "bio": "A brief professional summary (2-3 sentences)",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {"title": "Job Title", "company": "Company Name", "description": "Brief description of role"}
  ],
  "education": [
    {"degree": "Degree Name", "school": "School Name"}
  ]
}

Extract as much relevant information as possible. If something is not found, use null for strings or empty arrays for lists.
Always respond with valid JSON only.`
        },
        {
          role: "user",
          content: cvText
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AI yanıt vermedi");
    }

    const rawParsed = JSON.parse(content);
    const sanitizeResult = sanitizeParsedCV(rawParsed);
    const validated = parsedCVSchema.safeParse(sanitizeResult.data);
    
    if (!validated.success) {
      console.error("CV validation failed:", validated.error);
      return {
        data: {
          jobTitle: null,
          bio: null,
          skills: [],
          experience: [],
          education: [],
        },
        warnings: [...sanitizeResult.warnings, "CV verisi doğrulanamadı"],
        degraded: true,
      };
    }
    
    const data: ParsedCV = {
      jobTitle: validated.data.jobTitle ?? null,
      bio: validated.data.bio ?? null,
      skills: validated.data.skills,
      experience: validated.data.experience,
      education: validated.data.education,
    };

    const hasData = !!(data.skills.length || data.experience.length || 
                       data.education.length || data.jobTitle || data.bio);
    
    return {
      data,
      warnings: sanitizeResult.warnings,
      degraded: !hasData,
    };
  } catch (error: any) {
    console.error("CV parsing error:", error);
    
    // Re-throw with specific error types for proper HTTP status mapping
    const message = error?.message || "";
    if (message.includes("rate") || message.includes("429") || message.includes("limit")) {
      const err = new Error("AI servisi yoğun. Lütfen birkaç dakika sonra tekrar deneyin.");
      (err as any).code = "RATE_LIMIT";
      throw err;
    }
    if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
      const err = new Error("AI servisi yanıt vermedi. Lütfen tekrar deneyin.");
      (err as any).code = "TIMEOUT";
      throw err;
    }
    if (error?.status >= 500 || message.includes("upstream") || message.includes("OpenAI")) {
      const err = new Error("AI servisi geçici olarak kullanılamıyor.");
      (err as any).code = "UPSTREAM_ERROR";
      throw err;
    }
    
    throw new Error(message || "CV işlenirken bir hata oluştu");
  }
}
