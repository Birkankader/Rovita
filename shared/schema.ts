import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobTitle: text("job_title"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  skills: text("skills").array().default(sql`ARRAY[]::text[]`),
  experience: jsonb("experience").default([]),
  education: jsonb("education").default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobAnalyses = pgTable("job_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobTitle: text("job_title").notNull(),
  jobDescription: text("job_description").notNull(),
  jobUrl: text("job_url"),
  matchScore: integer("match_score").notNull(),
  skillsMatch: text("skills_match").array().default(sql`ARRAY[]::text[]`),
  skillsGap: text("skills_gap").array().default(sql`ARRAY[]::text[]`),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const learningQuests = pgTable("learning_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetSkill: text("target_skill").notNull(),
  level: text("level").notNull(),
  xp: integer("xp").notNull().default(0),
  status: text("status").notNull().default("locked"),
  progress: integer("progress").notNull().default(0),
  tasks: jsonb("tasks").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentLevel: integer("current_level").notNull().default(1),
  totalXp: integer("total_xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  achievements: text("achievements").array().default(sql`ARRAY[]::text[]`),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assessmentResults = pgTable("assessment_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assessmentType: text("assessment_type").notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback"),
  responses: jsonb("responses").default({}),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  progress: one(userProgress),
  jobAnalyses: many(jobAnalyses),
  learningQuests: many(learningQuests),
  assessmentResults: many(assessmentResults),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const jobAnalysesRelations = relations(jobAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [jobAnalyses.userId],
    references: [users.id],
  }),
}));

export const learningQuestsRelations = relations(learningQuests, ({ one }) => ({
  user: one(users, {
    fields: [learningQuests.userId],
    references: [users.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
  user: one(users, {
    fields: [assessmentResults.userId],
    references: [users.id],
  }),
}));

// Insert/Select Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const selectUserSchema = createSelectSchema(users).omit({ password: true });

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const insertJobAnalysisSchema = createInsertSchema(jobAnalyses).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertLearningQuestSchema = createInsertSchema(learningQuests).omit({
  id: true,
  userId: true,
  createdAt: true,
  completedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const insertAssessmentResultSchema = createInsertSchema(assessmentResults).omit({
  id: true,
  userId: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type JobAnalysis = typeof jobAnalyses.$inferSelect;
export type InsertJobAnalysis = z.infer<typeof insertJobAnalysisSchema>;

export type LearningQuest = typeof learningQuests.$inferSelect;
export type InsertLearningQuest = z.infer<typeof insertLearningQuestSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = z.infer<typeof insertAssessmentResultSchema>;
