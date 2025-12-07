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
import { parseCVText } from "./cv-parser";
import { analyzeJobWithAI, generateQuestTasks } from "./job-analyzer";
import * as cheerio from "cheerio";

// Lazy load pdf-parse to handle both ESM (dev) and CJS (prod) environments
let PDFParseClass: any = null;
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  if (!PDFParseClass) {
    const module = await import("pdf-parse") as any;
    // pdf-parse v2 exports PDFParse as a class
    PDFParseClass = module.PDFParse;
  }
  
  // PDFParse is a class: new PDFParse({ data: buffer }) then getText()
  const parser = new PDFParseClass({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text || "";
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

  // Allowed job posting domains for URL fetching (SSRF protection)
  const allowedJobDomains = [
    "linkedin.com",
    "www.linkedin.com",
    "kariyer.net",
    "www.kariyer.net",
    "indeed.com",
    "www.indeed.com",
    "tr.indeed.com",
    "glassdoor.com",
    "www.glassdoor.com",
    "secretcv.com",
    "www.secretcv.com",
    "yenibiris.com",
    "www.yenibiris.com",
    "eleman.net",
    "www.eleman.net",
    "monster.com",
    "www.monster.com",
    "stepstone.com",
    "www.stepstone.com",
  ];

  // Fetch job content from URL
  app.post("/api/job-analysis/fetch-url", requireAuth, async (req: Request, res: Response) => {
    try {
      const { url: inputText } = z.object({
        url: z.string().min(1, "URL veya metin gerekli"),
      }).parse(req.body);

      // Extract URL from text if needed (e.g., "Şu iş ilanına bir göz atın: https://linkedin.com/jobs/view/123")
      let extractedUrl = inputText.trim();
      
      // Try to find a URL in the text using regex
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
      const matches = inputText.match(urlRegex);
      if (matches && matches.length > 0) {
        // Use the first URL found
        extractedUrl = matches[0];
      }

      // Security: Parse and validate URL
      let parsedUrl: URL;
      let finalUrl = extractedUrl;
      try {
        parsedUrl = new URL(extractedUrl);
        
        // Transform LinkedIn URL with currentJobId to view URL
        if (parsedUrl.hostname.includes("linkedin.com")) {
          const currentJobId = parsedUrl.searchParams.get("currentJobId");
          if (currentJobId) {
            finalUrl = `https://www.linkedin.com/jobs/view/${currentJobId}`;
            parsedUrl = new URL(finalUrl);
          }
        }
      } catch {
        return res.status(400).json({ message: "Geçerli bir URL bulunamadı. Lütfen geçerli bir iş ilanı linki girin." });
      }

      // Security: Only allow HTTPS
      if (parsedUrl.protocol !== "https:") {
        return res.status(400).json({ message: "Sadece HTTPS URL'leri desteklenmektedir" });
      }

      // Security: Check against allowed domains
      const hostname = parsedUrl.hostname.toLowerCase();
      const isAllowedDomain = allowedJobDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (!isAllowedDomain) {
        return res.status(400).json({ 
          message: "Bu site desteklenmiyor. Desteklenen siteler: LinkedIn, Kariyer.net, Indeed, Glassdoor, SecretCV, Yenibiris, Eleman.net" 
        });
      }

      // Security: Add timeout with AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(finalUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(400).json({ message: "URL'den içerik alınamadı. Lütfen ilanı manuel olarak yapıştırın." });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove scripts, styles, nav, header, footer
      $("script, style, nav, header, footer, iframe, noscript, svg, img").remove();

      // Try to extract job title
      let jobTitle = "";
      const titleSelectors = [
        "h1",
        "[class*='job-title']",
        "[class*='jobTitle']",
        "[class*='position-title']",
        "[data-testid='jobTitle']",
        ".jobs-unified-top-card__job-title",
      ];
      for (const selector of titleSelectors) {
        const el = $(selector).first();
        if (el.length && el.text().trim()) {
          jobTitle = el.text().trim().slice(0, 200);
          break;
        }
      }

      // Try to extract job description from common containers
      let jobDescription = "";
      const descriptionSelectors = [
        "[class*='job-description']",
        "[class*='jobDescription']",
        "[class*='description']",
        "[data-testid='jobDescription']",
        ".jobs-description__content",
        ".job-details",
        "article",
        "main",
        ".content",
      ];

      for (const selector of descriptionSelectors) {
        const el = $(selector).first();
        if (el.length) {
          const text = el.text().replace(/\s+/g, " ").trim();
          if (text.length > 100) {
            jobDescription = text.slice(0, 10000);
            break;
          }
        }
      }

      // Fallback to body text if no specific container found
      if (!jobDescription || jobDescription.length < 100) {
        jobDescription = $("body").text().replace(/\s+/g, " ").trim().slice(0, 10000);
      }

      if (!jobDescription || jobDescription.length < 50) {
        return res.status(400).json({ 
          message: "İlan içeriği çekilemedi. Bu site otomatik çekmeyi desteklemiyor olabilir. Lütfen ilanı manuel olarak kopyalayıp yapıştırın." 
        });
      }

      res.json({ 
        jobTitle: jobTitle || "",
        jobDescription,
        message: jobTitle ? "İlan içeriği başarıyla çekildi" : "İlan içeriği çekildi ancak başlık bulunamadı. Lütfen kontrol edin."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Fetch URL error:", error);
      res.status(500).json({ message: "URL'den içerik alınırken hata oluştu. Lütfen ilanı manuel olarak yapıştırın." });
    }
  });

  // Create job analysis
  app.post("/api/job-analysis", requireAuth, async (req: Request, res: Response) => {
    try {
      const analysisInput = z.object({
        jobTitle: z.string().min(1, "İş unvanı gerekli"),
        jobDescription: z.string().min(10, "İş açıklaması en az 10 karakter olmalı"),
        jobUrl: z.string().optional(),
      }).parse(req.body);

      const profile = await storage.getProfile(req.session.userId!);
      const userSkills = profile?.skills || [];
      const userExperience = (profile?.experience as Array<{ title: string; company: string; description: string }>) || [];

      const { matchScore, skillsMatch, skillsGap, recommendations } = 
        await analyzeJobWithAI(userSkills, userExperience, analysisInput.jobTitle, analysisInput.jobDescription);

      const analysis = await storage.createJobAnalysis(req.session.userId!, {
        jobTitle: analysisInput.jobTitle,
        jobDescription: analysisInput.jobDescription,
        jobUrl: analysisInput.jobUrl || null,
        matchScore,
        skillsMatch,
        skillsGap,
        recommendations,
      });

      // Auto-create learning quests for skill gaps (max 5)
      if (skillsGap && skillsGap.length > 0) {
        const existingQuests = await storage.getLearningQuests(req.session.userId!);
        const existingSkills = new Set(
          existingQuests.map(q => q.targetSkill.toLowerCase().trim())
        );

        const questsToCreate = skillsGap
          .filter(skill => !existingSkills.has(skill.toLowerCase().trim()))
          .slice(0, 5);

        for (const skill of questsToCreate) {
          const { tasks, description } = await generateQuestTasks(skill, analysisInput.jobTitle);
          await storage.createLearningQuest(req.session.userId!, {
            title: `${skill} Öğren`,
            description,
            targetSkill: skill,
            level: "beginner",
            status: "pending",
            progress: 0,
            xp: 100,
            tasks,
          });
        }
      }

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

  // Delete quest (reject)
  app.delete("/api/quests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const existingQuest = await storage.getLearningQuest(req.params.id);
      if (!existingQuest || existingQuest.userId !== req.session.userId) {
        return res.status(404).json({ message: "Görev bulunamadı" });
      }

      await storage.deleteLearningQuest(req.params.id);
      res.json({ message: "Görev silindi" });
    } catch (error) {
      console.error("Delete quest error:", error);
      res.status(500).json({ message: "Görev silinirken hata oluştu" });
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

  // Update quest task (toggle completion)
  app.put("/api/quests/:questId/tasks/:taskId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { questId, taskId } = req.params;
      const { completed } = z.object({ completed: z.boolean() }).parse(req.body);

      const existingQuest = await storage.getLearningQuest(questId);
      if (!existingQuest || existingQuest.userId !== req.session.userId) {
        return res.status(404).json({ message: "Görev bulunamadı" });
      }

      const tasks = (existingQuest.tasks as Array<{ id: string; title: string; description: string; completed: boolean }>) || [];
      
      if (tasks.length === 0) {
        return res.json(existingQuest);
      }
      
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ message: "Alt görev bulunamadı" });
      }

      tasks[taskIndex].completed = completed;
      
      const completedCount = tasks.filter(t => t.completed).length;
      const newProgress = Math.round((completedCount / tasks.length) * 100);
      const allTasksCompleted = completedCount === tasks.length;
      const wasCompleted = existingQuest.status === "completed";
      
      const updateData: any = {
        tasks,
        progress: newProgress,
      };
      
      if (allTasksCompleted && !wasCompleted) {
        updateData.status = "completed";
        updateData.completedAt = new Date();
        
        const progress = await storage.getUserProgress(req.session.userId!);
        if (progress) {
          const xpReward = existingQuest.xp || 50;
          const newXp = progress.totalXp + xpReward;
          const newLevel = Math.floor(newXp / 500) + 1;
          await storage.updateUserProgress(req.session.userId!, {
            totalXp: newXp,
            currentLevel: newLevel,
            lastActivityDate: new Date(),
          });
        }
      }
      
      const quest = await storage.updateLearningQuest(questId, updateData);

      res.json(quest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri" });
      }
      console.error("Update task error:", error);
      res.status(500).json({ message: "Alt görev güncellenirken hata oluştu" });
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

  // Soft skill titles and descriptions for quest creation
  const softSkillInfo: Record<string, { title: string; description: string; tasks: Array<{ id: string; title: string; description: string; completed: boolean }> }> = {
    leadership: {
      title: "Liderlik Becerilerini Geliştir",
      description: "Ekip yönetimi, karar verme ve motivasyon yeteneklerini güçlendir.",
      tasks: [
        { id: "task-1", title: "Liderlik kitabı oku", description: "Bir liderlik veya yönetim kitabı okuyun", completed: false },
        { id: "task-2", title: "Mentorluk yap", description: "Bir junior meslektaşa mentorluk yapın", completed: false },
        { id: "task-3", title: "Toplantı yönet", description: "Bir ekip toplantısını yönetin ve sonuçları raporlayın", completed: false },
      ]
    },
    communication: {
      title: "İletişim Becerilerini Geliştir",
      description: "Etkili iletişim, sunum ve ikna kabiliyetlerini güçlendir.",
      tasks: [
        { id: "task-1", title: "Sunum yap", description: "Bir konuda 5 dakikalık sunum hazırlayın ve yapın", completed: false },
        { id: "task-2", title: "Aktif dinleme pratik", description: "Bir görüşmede aktif dinleme tekniklerini uygulayın", completed: false },
        { id: "task-3", title: "Yazılı iletişim", description: "Karmaşık bir konuyu basit bir şekilde yazılı olarak açıklayın", completed: false },
      ]
    },
    problem_solving: {
      title: "Problem Çözme Becerilerini Geliştir",
      description: "Analitik düşünme ve yaratıcı çözüm üretme becerilerini güçlendir.",
      tasks: [
        { id: "task-1", title: "Kök neden analizi", description: "Bir sorunu 5 Neden tekniği ile analiz edin", completed: false },
        { id: "task-2", title: "Algoritma çöz", description: "Bir algoritma problemi çözün ve çözümü dokümante edin", completed: false },
        { id: "task-3", title: "Beyin fırtınası", description: "Bir problem için en az 5 alternatif çözüm üretin", completed: false },
      ]
    },
    empathy: {
      title: "Empati Becerilerini Geliştir",
      description: "Duygusal zeka ve başkalarını anlama yeteneğini güçlendir.",
      tasks: [
        { id: "task-1", title: "Perspektif değiştir", description: "Bir tartışmada karşı tarafın bakış açısını yazılı olarak ifade edin", completed: false },
        { id: "task-2", title: "Geri bildirim al", description: "İş arkadaşlarınızdan empati beceriniz hakkında geri bildirim alın", completed: false },
        { id: "task-3", title: "Aktif destek ol", description: "Zor bir dönemden geçen bir meslektaşa destek olun", completed: false },
      ]
    },
    adaptability: {
      title: "Uyum Becerilerini Geliştir",
      description: "Değişime uyum sağlama ve esneklik becerilerini güçlendir.",
      tasks: [
        { id: "task-1", title: "Yeni araç öğren", description: "Daha önce kullanmadığınız bir araç veya teknolojiyi öğrenin", completed: false },
        { id: "task-2", title: "Konfor alanı dışına çık", description: "Normalde yapmadığınız bir görev üstlenin", completed: false },
        { id: "task-3", title: "Değişimi belgele", description: "Bir değişikliğe nasıl uyum sağladığınızı günlük tutarak izleyin", completed: false },
      ]
    },
  };

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

      // Auto-create learning quest for low scores
      let createdQuestTitle: string | null = null;
      if (resultData.score < 80) {
        const skillInfo = softSkillInfo[resultData.assessmentType];
        if (skillInfo) {
          const existingQuests = await storage.getLearningQuests(req.session.userId!);
          const alreadyExists = existingQuests.some(
            q => q.targetSkill.toLowerCase() === resultData.assessmentType.toLowerCase()
          );
          
          if (!alreadyExists) {
            await storage.createLearningQuest(req.session.userId!, {
              title: skillInfo.title,
              description: skillInfo.description,
              targetSkill: resultData.assessmentType,
              level: "beginner",
              status: "pending",
              progress: 0,
              xp: 75,
              tasks: skillInfo.tasks,
            });
            createdQuestTitle = skillInfo.title;
          }
        }
      }

      res.status(201).json({ ...result, createdQuestTitle });
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

      const cvText = await parsePdfBuffer(req.file.buffer);

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
