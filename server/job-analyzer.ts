import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const jobAnalysisSchema = z.object({
  requiredSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
  skillsMatch: z.array(z.string()).default([]),
  skillsGap: z.array(z.string()).default([]),
  matchScore: z.number().min(0).max(100).default(50),
  recommendations: z.string().default(""),
});

export interface JobAnalysisResult {
  matchScore: number;
  skillsMatch: string[];
  skillsGap: string[];
  recommendations: string;
}

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength) + "...";
}

function formatExperience(exp: Array<{ title: string; company: string; description: string }>): string {
  if (!exp || exp.length === 0) return "";
  const limited = exp.slice(0, 5);
  return limited.map(e => {
    const desc = truncateText(e.description, 100);
    return `- ${truncateText(e.title, 50)} @ ${truncateText(e.company, 50)}${desc ? `: ${desc}` : ""}`;
  }).join("\n");
}

export async function analyzeJobWithAI(
  userSkills: string[],
  userExperience: Array<{ title: string; company: string; description: string }>,
  jobTitle: string,
  jobDescription: string
): Promise<JobAnalysisResult> {
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    return fallbackAnalysis(userSkills, jobDescription);
  }

  try {
    const limitedSkills = userSkills.slice(0, 30);
    const userContext = limitedSkills.length > 0 
      ? `Kullanıcının Becerileri:\n${limitedSkills.join(", ")}`
      : "Kullanıcının profil becerileri henüz tanımlı değil.";
    
    const experienceFormatted = formatExperience(userExperience);
    const experienceContext = experienceFormatted
      ? `\n\nKullanıcının Deneyimleri:\n${experienceFormatted}`
      : "";

    const truncatedJobDesc = truncateText(jobDescription, 3000);

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Sen bir kariyer danışmanısın. Kullanıcının beceri ve deneyimlerini iş ilanıyla karşılaştırarak analiz yap.

Görevin:
1. İş ilanından gerekli becerileri ve nitelikleri çıkar (teknik beceriler, araçlar, diller, soft skills)
2. Kullanıcının mevcut becerilerini ve deneyimlerini iş gereksinimleriyle karşılaştır
3. Eşleşen ve eksik becerileri belirle
4. Eşleşme puanı hesapla (0-100)
5. Türkçe öneriler sun

ÖNEMLİ:
- Beceri eşleştirmesinde esnek ol: "React" ile "React.js", "JavaScript" ile "JS", "Python" ile "Python3" eşleşir
- Deneyimden çıkarılabilecek becerileri de dikkate al
- Sadece açıkça belirtilen becerileri değil, bağlamdan anlaşılanları da dahil et

JSON formatında yanıt ver:
{
  "requiredSkills": ["beceri1", "beceri2", ...],
  "niceToHaveSkills": ["beceri1", ...],
  "skillsMatch": ["eşleşen beceri1", "eşleşen beceri2", ...],
  "skillsGap": ["eksik beceri1", "eksik beceri2", ...],
  "matchScore": 75,
  "recommendations": "Türkçe öneriler ve tavsiyeler"
}`
        },
        {
          role: "user",
          content: `${userContext}${experienceContext}

İş Unvanı: ${jobTitle}

İş İlanı:
${truncatedJobDesc}`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("AI yanıt vermedi, fallback kullanılıyor");
      return fallbackAnalysis(userSkills, jobDescription);
    }

    const rawParsed = JSON.parse(content);
    const validated = jobAnalysisSchema.safeParse(rawParsed);
    
    if (!validated.success) {
      console.error("Job analysis validation failed:", validated.error);
      return fallbackAnalysis(userSkills, jobDescription);
    }

    return {
      matchScore: validated.data.matchScore,
      skillsMatch: validated.data.skillsMatch,
      skillsGap: validated.data.skillsGap,
      recommendations: validated.data.recommendations,
    };
  } catch (error: any) {
    console.error("Job analysis AI error:", error);
    return fallbackAnalysis(userSkills, jobDescription);
  }
}

function fallbackAnalysis(userSkills: string[], jobDescription: string): JobAnalysisResult {
  const jobDescLower = jobDescription.toLowerCase();
  const commonSkills = [
    "javascript", "typescript", "react", "node.js", "nodejs", "python", "java", "sql",
    "html", "css", "git", "docker", "aws", "mongodb", "postgresql", "redis", "mysql",
    "graphql", "rest", "api", "agile", "scrum", "testing", "ci/cd", "kubernetes",
    "machine learning", "data analysis", "figma", "ui", "ux", "communication",
    "leadership", "problem solving", "teamwork", "project management", "excel",
    "angular", "vue", "spring", "django", "flask", "express", "nextjs", "php",
    "c#", ".net", "azure", "gcp", "linux", "windows", "ios", "android", "swift",
    "kotlin", "flutter", "react native", "sass", "tailwind", "bootstrap"
  ];

  const requiredSkills = commonSkills.filter(skill => 
    jobDescLower.includes(skill.toLowerCase())
  );

  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());
  
  const skillsMatch = requiredSkills.filter(skill => 
    userSkillsLower.some(us => {
      const normalizedSkill = skill.replace(/[.\s-]/g, "").toLowerCase();
      const normalizedUser = us.replace(/[.\s-]/g, "").toLowerCase();
      return normalizedUser.includes(normalizedSkill) || 
             normalizedSkill.includes(normalizedUser) ||
             normalizedUser === normalizedSkill;
    })
  );
  
  const skillsGap = requiredSkills.filter(skill => 
    !userSkillsLower.some(us => {
      const normalizedSkill = skill.replace(/[.\s-]/g, "").toLowerCase();
      const normalizedUser = us.replace(/[.\s-]/g, "").toLowerCase();
      return normalizedUser.includes(normalizedSkill) || 
             normalizedSkill.includes(normalizedUser) ||
             normalizedUser === normalizedSkill;
    })
  );

  const matchScore = requiredSkills.length > 0 
    ? Math.round((skillsMatch.length / requiredSkills.length) * 100)
    : 50;

  let recommendations = "";
  if (skillsGap.length > 0) {
    recommendations = `Bu pozisyon için ${skillsGap.slice(0, 3).join(", ")} becerilerini geliştirmenizi öneriyoruz. `;
  }
  if (matchScore >= 70) {
    recommendations += "Profiliniz bu pozisyon için oldukça uygun görünüyor!";
  } else if (matchScore >= 40) {
    recommendations += "Bazı eksik becerileri tamamlayarak şansınızı artırabilirsiniz.";
  } else {
    recommendations += "Bu pozisyon için daha fazla hazırlık yapmanız gerekebilir.";
  }

  return { matchScore, skillsMatch, skillsGap, recommendations };
}
