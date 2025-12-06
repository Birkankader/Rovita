import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import {
  insertUserSchema,
  insertProfileSchema,
  insertJobAnalysisSchema,
  insertLearningQuestSchema,
  insertUserProgressSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { parseCVText } from "./cv-parser";

// Handle both ESM (dev) and CJS (prod) environments for pdf-parse
let pdfParse: any;
if (typeof import.meta.url !== "undefined") {
  // ESM mode (development with tsx)
  const requireModule = createRequire(import.meta.url);
  pdfParse = requireModule("pdf-parse");
} else {
  // CJS mode (production bundle) - use global require
  pdfParse = (globalThis as any).require?.("pdf-parse") || eval('require')("pdf-parse");
}

const scryptAsync = promisify(scrypt);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Sadece PDF dosyaları kabul edilir"));
    }
  },
});

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Giriş yapmanız gerekiyor" });
  }
  next();
}

function analyzeSkillMatch(userSkills: string[], jobDescription: string): {
  matchScore: number;
  skillsMatch: string[];
  skillsGap: string[];
  recommendations: string;
} {
  const jobDescLower = jobDescription.toLowerCase();
  const commonSkills = [
    "javascript", "typescript", "react", "node.js", "python", "java", "sql",
    "html", "css", "git", "docker", "aws", "mongodb", "postgresql", "redis",
    "graphql", "rest api", "agile", "scrum", "testing", "ci/cd", "kubernetes",
    "machine learning", "data analysis", "figma", "ui/ux", "communication",
    "leadership", "problem solving", "teamwork", "project management"
  ];

  const requiredSkills = commonSkills.filter(skill => 
    jobDescLower.includes(skill.toLowerCase())
  );

  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const skillsMatch = requiredSkills.filter(skill => 
    userSkillsLower.some(us => us.includes(skill) || skill.includes(us))
  );
  const skillsGap = requiredSkills.filter(skill => 
    !userSkillsLower.some(us => us.includes(skill) || skill.includes(us))
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ==================== AUTH ROUTES ====================

  // Strict CV data schema for validation with length limits and sanitization
  const experienceSchema = z.object({
    title: z.string().transform(s => s.trim()).pipe(z.string().min(1).max(200)),
    company: z.string().transform(s => s.trim()).pipe(z.string().min(1).max(200)),
    description: z.string().default("").transform(s => s.trim()).pipe(z.string().max(1000)),
  });

  const educationSchema = z.object({
    degree: z.string().transform(s => s.trim()).pipe(z.string().min(1).max(200)),
    school: z.string().transform(s => s.trim()).pipe(z.string().min(1).max(200)),
  });

  const cvDataSchema = z.object({
    jobTitle: z.string().nullable().optional().transform(s => {
      const trimmed = s?.trim();
      return trimmed && trimmed.length > 0 ? trimmed.slice(0, 200) : null;
    }),
    bio: z.string().nullable().optional().transform(s => {
      const trimmed = s?.trim();
      return trimmed && trimmed.length > 0 ? trimmed.slice(0, 2000) : null;
    }),
    skills: z.array(
      z.string().transform(s => s.trim()).pipe(z.string().min(1).max(100))
    ).max(50).optional().transform(arr => arr?.filter(s => s.length > 0) ?? []),
    experience: z.array(experienceSchema).max(20).optional().transform(arr => arr ?? []),
    education: z.array(educationSchema).max(10).optional().transform(arr => arr ?? []),
  }).optional();

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const registerSchema = z.object({
        email: z.string().email("Geçerli bir email adresi girin"),
        password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        cvData: cvDataSchema,
      });

      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Bu email adresi zaten kayıtlı" });
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
      });

      let profileData = {};
      if (data.cvData) {
        profileData = {
          jobTitle: data.cvData.jobTitle ?? null,
          bio: data.cvData.bio ?? null,
          skills: data.cvData.skills ?? [],
          experience: data.cvData.experience ?? [],
          education: data.cvData.education ?? [],
        };
      }

      await storage.createProfile(user.id, profileData);
      await storage.createUserProgress(user.id);

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string(),
      });

      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email veya şifre hatalı" });
      }

      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Email veya şifre hatalı" });
      }

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz giriş bilgileri" });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Giriş yapılmamış" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Kullanıcı bilgisi alınırken hata oluştu" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Çıkış yapılırken hata oluştu" });
      }
      res.json({ message: "Başarıyla çıkış yapıldı" });
    });
  });

  // ==================== PROFILE ROUTES ====================

  // Get profile
  app.get("/api/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getProfile(req.session.userId!);
      if (!profile) {
        const newProfile = await storage.createProfile(req.session.userId!, {});
        return res.json(newProfile);
      }
      res.json(profile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Profil alınırken hata oluştu" });
    }
  });

  // Update profile
  app.put("/api/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const profileData = insertProfileSchema.partial().parse(req.body);
      
      const existingProfile = await storage.getProfile(req.session.userId!);
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateProfile(req.session.userId!, profileData);
      } else {
        profile = await storage.createProfile(req.session.userId!, profileData);
      }

      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz profil verisi" });
      }
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Profil güncellenirken hata oluştu" });
    }
  });

  // ==================== JOB ANALYSIS ROUTES ====================

  // Create job analysis
  app.post("/api/job-analysis", requireAuth, async (req: Request, res: Response) => {
    try {
      const analysisInput = z.object({
        jobTitle: z.string().min(1, "İş unvanı gerekli"),
        jobDescription: z.string().min(10, "İş açıklaması en az 10 karakter olmalı"),
      }).parse(req.body);

      const profile = await storage.getProfile(req.session.userId!);
      const userSkills = profile?.skills || [];

      const { matchScore, skillsMatch, skillsGap, recommendations } = 
        analyzeSkillMatch(userSkills, analysisInput.jobDescription);

      const analysis = await storage.createJobAnalysis(req.session.userId!, {
        jobTitle: analysisInput.jobTitle,
        jobDescription: analysisInput.jobDescription,
        matchScore,
        skillsMatch,
        skillsGap,
        recommendations,
      });

      res.status(201).json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create job analysis error:", error);
      res.status(500).json({ message: "İş analizi oluşturulurken hata oluştu" });
    }
  });

  // Get all job analyses
  app.get("/api/job-analysis", requireAuth, async (req: Request, res: Response) => {
    try {
      const analyses = await storage.getJobAnalyses(req.session.userId!);
      res.json(analyses);
    } catch (error) {
      console.error("Get job analyses error:", error);
      res.status(500).json({ message: "İş analizleri alınırken hata oluştu" });
    }
  });

  // Get single job analysis
  app.get("/api/job-analysis/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const analysis = await storage.getJobAnalysis(req.params.id);
      if (!analysis || analysis.userId !== req.session.userId) {
        return res.status(404).json({ message: "Analiz bulunamadı" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Get job analysis error:", error);
      res.status(500).json({ message: "İş analizi alınırken hata oluştu" });
    }
  });

  // ==================== LEARNING QUEST ROUTES ====================

  // Get all quests
  app.get("/api/quests", requireAuth, async (req: Request, res: Response) => {
    try {
      const quests = await storage.getLearningQuests(req.session.userId!);
      res.json(quests);
    } catch (error) {
      console.error("Get quests error:", error);
      res.status(500).json({ message: "Görevler alınırken hata oluştu" });
    }
  });

  // Create quest
  app.post("/api/quests", requireAuth, async (req: Request, res: Response) => {
    try {
      const questData = insertLearningQuestSchema.parse(req.body);
      const quest = await storage.createLearningQuest(req.session.userId!, questData);
      res.status(201).json(quest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz görev verisi" });
      }
      console.error("Create quest error:", error);
      res.status(500).json({ message: "Görev oluşturulurken hata oluştu" });
    }
  });

  // Update quest
  app.put("/api/quests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const existingQuest = await storage.getLearningQuest(req.params.id);
      if (!existingQuest || existingQuest.userId !== req.session.userId) {
        return res.status(404).json({ message: "Görev bulunamadı" });
      }

      const questData = insertLearningQuestSchema.partial().parse(req.body);
      const quest = await storage.updateLearningQuest(req.params.id, questData);

      if (questData.status === "completed" && existingQuest.status !== "completed") {
        const progress = await storage.getUserProgress(req.session.userId!);
        if (progress) {
          const newXp = progress.totalXp + (existingQuest.xp || 50);
          const newLevel = Math.floor(newXp / 500) + 1;
          await storage.updateUserProgress(req.session.userId!, {
            totalXp: newXp,
            currentLevel: newLevel,
            lastActivityDate: new Date(),
          });
        }
      }

      res.json(quest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz görev verisi" });
      }
      console.error("Update quest error:", error);
      res.status(500).json({ message: "Görev güncellenirken hata oluştu" });
    }
  });

  // ==================== PROGRESS ROUTES ====================

  // Get user progress
  app.get("/api/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      let progress = await storage.getUserProgress(req.session.userId!);
      if (!progress) {
        progress = await storage.createUserProgress(req.session.userId!);
      }
      res.json(progress);
    } catch (error) {
      console.error("Get progress error:", error);
      res.status(500).json({ message: "İlerleme bilgisi alınırken hata oluştu" });
    }
  });

  // Update user progress
  app.put("/api/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const progressData = insertUserProgressSchema.partial().parse(req.body);
      
      let existingProgress = await storage.getUserProgress(req.session.userId!);
      if (!existingProgress) {
        existingProgress = await storage.createUserProgress(req.session.userId!);
      }

      const progress = await storage.updateUserProgress(req.session.userId!, {
        ...progressData,
        lastActivityDate: new Date(),
      });

      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz ilerleme verisi" });
      }
      console.error("Update progress error:", error);
      res.status(500).json({ message: "İlerleme güncellenirken hata oluştu" });
    }
  });

  // ==================== ASSESSMENT ROUTES ====================

  // Get assessment results
  app.get("/api/assessments", requireAuth, async (req: Request, res: Response) => {
    try {
      const results = await storage.getAssessmentResults(req.session.userId!);
      res.json(results);
    } catch (error) {
      console.error("Get assessments error:", error);
      res.status(500).json({ message: "Değerlendirmeler alınırken hata oluştu" });
    }
  });

  // Create assessment result
  app.post("/api/assessments", requireAuth, async (req: Request, res: Response) => {
    try {
      const resultData = z.object({
        assessmentType: z.string(),
        score: z.number(),
        feedback: z.string().optional(),
        responses: z.record(z.any()).optional(),
      }).parse(req.body);

      const result = await storage.createAssessmentResult(req.session.userId!, resultData);

      const progress = await storage.getUserProgress(req.session.userId!);
      if (progress) {
        const xpReward = Math.round(resultData.score / 2);
        await storage.updateUserProgress(req.session.userId!, {
          totalXp: progress.totalXp + xpReward,
          lastActivityDate: new Date(),
        });
      }

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz değerlendirme verisi" });
      }
      console.error("Create assessment error:", error);
      res.status(500).json({ message: "Değerlendirme kaydedilirken hata oluştu" });
    }
  });

  // ==================== CV PARSE ROUTES ====================

  // Parse CV and return extracted data
  app.post("/api/cv/parse", upload.single("cv"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CV dosyası gerekli" });
      }

      const pdfData = await pdfParse(req.file.buffer);
      const cvText = pdfData.text;

      if (!cvText || cvText.trim().length < 50) {
        return res.status(422).json({ 
          message: "CV dosyasından yeterli metin çıkarılamadı",
          code: "INVALID_CONTENT"
        });
      }

      const result = await parseCVText(cvText);
      
      // Return with warnings and degraded flag
      const responseData = {
        ...result.data,
        warnings: result.warnings,
        degraded: result.degraded,
      };
      
      // Return 206 for degraded/partial content
      if (result.degraded) {
        return res.status(206).json({
          ...responseData,
          message: "CV'den yeterli bilgi çıkarılamadı. Manuel olarak doldurabilirsiniz.",
        });
      }
      
      res.json(responseData);
    } catch (error: any) {
      console.error("CV parse error:", error);
      const message = error?.message || "CV işlenirken bir hata oluştu";
      const code = error?.code;
      
      // 503: AI not configured
      if (message.includes("AI entegrasyonu")) {
        return res.status(503).json({ message, unavailable: true, code: "AI_UNAVAILABLE" });
      }
      
      // 429: Rate limiting
      if (code === "RATE_LIMIT" || code === "TIMEOUT") {
        return res.status(429).json({ message, code });
      }
      
      // 502: Upstream OpenAI error
      if (code === "UPSTREAM_ERROR") {
        return res.status(502).json({ message, code });
      }
      
      // 422: Validation/schema failure
      if (message.includes("doğrulama") || message.includes("validation")) {
        return res.status(422).json({ message, code: "VALIDATION_ERROR" });
      }
      
      // 500: Unexpected errors
      res.status(500).json({ message, code: "INTERNAL_ERROR" });
    }
  });

  return httpServer;
}
