import {
  users,
  profiles,
  jobAnalyses,
  learningQuests,
  userProgress,
  assessmentResults,
  emailVerificationCodes,
  type User,
  type InsertUser,
  type SelectUser,
  type Profile,
  type InsertProfile,
  type JobAnalysis,
  type InsertJobAnalysis,
  type LearningQuest,
  type InsertLearningQuest,
  type UserProgress,
  type InsertUserProgress,
  type AssessmentResult,
  type InsertAssessmentResult,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray, and, lt, gt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(userId: string, profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Job Analysis operations
  getJobAnalyses(userId: string): Promise<JobAnalysis[]>;
  getJobAnalysis(id: string): Promise<JobAnalysis | undefined>;
  createJobAnalysis(userId: string, analysis: InsertJobAnalysis): Promise<JobAnalysis>;
  pruneOldJobAnalyses(userId: string, keepCount?: number): Promise<void>;
  
  // Learning Quest operations
  getLearningQuests(userId: string): Promise<LearningQuest[]>;
  getLearningQuest(id: string): Promise<LearningQuest | undefined>;
  createLearningQuest(userId: string, quest: InsertLearningQuest): Promise<LearningQuest>;
  updateLearningQuest(id: string, quest: Partial<InsertLearningQuest>): Promise<LearningQuest | undefined>;
  deleteLearningQuest(id: string): Promise<void>;
  
  // User Progress operations
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  createUserProgress(userId: string): Promise<UserProgress>;
  updateUserProgress(userId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;
  
  // Assessment operations
  getAssessmentResults(userId: string): Promise<AssessmentResult[]>;
  getAssessmentResultByTypeAndLevel(userId: string, assessmentType: string, level: number): Promise<AssessmentResult | undefined>;
  getMaxLevelForAssessment(userId: string, assessmentType: string): Promise<number>;
  createAssessmentResult(userId: string, result: InsertAssessmentResult): Promise<AssessmentResult>;
  
  // Email verification operations
  createVerificationCode(email: string, code: string): Promise<void>;
  getVerificationCode(email: string): Promise<{ code: string; expiresAt: Date } | undefined>;
  deleteVerificationCode(email: string): Promise<void>;
  updateUserEmailVerified(userId: string, verified: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async createProfile(userId: string, insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values({ ...insertProfile, userId })
      .returning();
    return profile;
  }

  async updateProfile(userId: string, profileUpdate: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set({ ...profileUpdate, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile || undefined;
  }

  // Job Analysis operations
  async getJobAnalyses(userId: string): Promise<JobAnalysis[]> {
    return db
      .select()
      .from(jobAnalyses)
      .where(eq(jobAnalyses.userId, userId))
      .orderBy(desc(jobAnalyses.createdAt));
  }

  async getJobAnalysis(id: string): Promise<JobAnalysis | undefined> {
    const [analysis] = await db.select().from(jobAnalyses).where(eq(jobAnalyses.id, id));
    return analysis || undefined;
  }

  async createJobAnalysis(userId: string, analysis: InsertJobAnalysis): Promise<JobAnalysis> {
    const [jobAnalysis] = await db
      .insert(jobAnalyses)
      .values({ ...analysis, userId })
      .returning();
    return jobAnalysis;
  }

  async pruneOldJobAnalyses(userId: string, keepCount: number = 3): Promise<void> {
    try {
      const allAnalyses = await db
        .select({ id: jobAnalyses.id })
        .from(jobAnalyses)
        .where(eq(jobAnalyses.userId, userId))
        .orderBy(desc(jobAnalyses.createdAt));
      
      if (allAnalyses.length > keepCount) {
        const idsToDelete = allAnalyses.slice(keepCount).map(a => a.id);
        await db.delete(jobAnalyses).where(inArray(jobAnalyses.id, idsToDelete));
      }
    } catch (error) {
      console.error("Error pruning old job analyses:", error);
    }
  }

  // Learning Quest operations
  async getLearningQuests(userId: string): Promise<LearningQuest[]> {
    return db
      .select()
      .from(learningQuests)
      .where(eq(learningQuests.userId, userId))
      .orderBy(desc(learningQuests.createdAt));
  }

  async getLearningQuest(id: string): Promise<LearningQuest | undefined> {
    const [quest] = await db.select().from(learningQuests).where(eq(learningQuests.id, id));
    return quest || undefined;
  }

  async createLearningQuest(userId: string, quest: InsertLearningQuest): Promise<LearningQuest> {
    const [learningQuest] = await db
      .insert(learningQuests)
      .values({ ...quest, userId })
      .returning();
    return learningQuest;
  }

  async updateLearningQuest(id: string, questUpdate: Partial<InsertLearningQuest>): Promise<LearningQuest | undefined> {
    const [quest] = await db
      .update(learningQuests)
      .set(questUpdate)
      .where(eq(learningQuests.id, id))
      .returning();
    return quest || undefined;
  }

  async deleteLearningQuest(id: string): Promise<void> {
    await db.delete(learningQuests).where(eq(learningQuests.id, id));
  }

  // User Progress operations
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return progress || undefined;
  }

  async createUserProgress(userId: string): Promise<UserProgress> {
    const [progress] = await db
      .insert(userProgress)
      .values({ userId })
      .returning();
    return progress;
  }

  async updateUserProgress(userId: string, progressUpdate: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    const [progress] = await db
      .update(userProgress)
      .set({ ...progressUpdate, updatedAt: new Date() })
      .where(eq(userProgress.userId, userId))
      .returning();
    return progress || undefined;
  }

  // Assessment operations
  async getAssessmentResults(userId: string): Promise<AssessmentResult[]> {
    return db
      .select()
      .from(assessmentResults)
      .where(eq(assessmentResults.userId, userId))
      .orderBy(desc(assessmentResults.completedAt));
  }

  async createAssessmentResult(userId: string, result: InsertAssessmentResult): Promise<AssessmentResult> {
    const [assessmentResult] = await db
      .insert(assessmentResults)
      .values({ ...result, userId })
      .returning();
    return assessmentResult;
  }

  async getAssessmentResultByTypeAndLevel(userId: string, assessmentType: string, level: number): Promise<AssessmentResult | undefined> {
    const [result] = await db
      .select()
      .from(assessmentResults)
      .where(
        and(
          eq(assessmentResults.userId, userId),
          eq(assessmentResults.assessmentType, assessmentType),
          eq(assessmentResults.level, level)
        )
      );
    return result || undefined;
  }

  async getMaxLevelForAssessment(userId: string, assessmentType: string): Promise<number> {
    const results = await db
      .select({ level: assessmentResults.level, score: assessmentResults.score })
      .from(assessmentResults)
      .where(
        and(
          eq(assessmentResults.userId, userId),
          eq(assessmentResults.assessmentType, assessmentType)
        )
      )
      .orderBy(desc(assessmentResults.level));
    
    if (results.length === 0) return 1;
    
    const highestCompleted = results.find(r => r.score >= 70);
    if (highestCompleted) {
      return Math.min(highestCompleted.level + 1, 3);
    }
    return results[0].level;
  }

  // Email verification operations
  async createVerificationCode(email: string, code: string): Promise<void> {
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(emailVerificationCodes).values({ email, code, expiresAt });
  }

  async getVerificationCode(email: string): Promise<{ code: string; expiresAt: Date } | undefined> {
    const [record] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          gt(emailVerificationCodes.expiresAt, new Date())
        )
      );
    if (!record) return undefined;
    return { code: record.code, expiresAt: record.expiresAt };
  }

  async deleteVerificationCode(email: string): Promise<void> {
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));
  }

  async updateUserEmailVerified(userId: string, verified: boolean): Promise<void> {
    await db.update(users).set({ emailVerified: verified }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
