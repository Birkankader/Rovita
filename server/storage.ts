import {
  users,
  profiles,
  jobAnalyses,
  learningQuests,
  userProgress,
  assessmentResults,
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
import { eq, desc } from "drizzle-orm";

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
  
  // Learning Quest operations
  getLearningQuests(userId: string): Promise<LearningQuest[]>;
  getLearningQuest(id: string): Promise<LearningQuest | undefined>;
  createLearningQuest(userId: string, quest: InsertLearningQuest): Promise<LearningQuest>;
  updateLearningQuest(id: string, quest: Partial<InsertLearningQuest>): Promise<LearningQuest | undefined>;
  
  // User Progress operations
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  createUserProgress(userId: string): Promise<UserProgress>;
  updateUserProgress(userId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;
  
  // Assessment operations
  getAssessmentResults(userId: string): Promise<AssessmentResult[]>;
  createAssessmentResult(userId: string, result: InsertAssessmentResult): Promise<AssessmentResult>;
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
}

export const storage = new DatabaseStorage();
