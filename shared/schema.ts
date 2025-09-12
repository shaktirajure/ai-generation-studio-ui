import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(25), // Updated to 25 credits
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Enhanced jobs table for AI studio
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tool: text("tool").notNull(), // "text2image" | "text2mesh" | "texturing" | "img2video"
  prompt: text("prompt").notNull(),
  inputs: jsonb("inputs"), // For file uploads, images, models
  status: text("status").notNull().default("queued"), // "queued" | "processing" | "completed" | "failed"
  assetUrls: jsonb("asset_urls"), // Array of URLs for multi-asset results
  provider: text("provider"), // "SIM" | "MESHY" | "REPLICATE"
  providerJobId: text("provider_job_id"), // External job ID for tracking
  meta: jsonb("meta"), // Additional metadata
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

// Tool types and costs
export const toolCosts = {
  "text2image": 1,
  "text2mesh": 5,
  "texturing": 3,
  "img2video": 4,
} as const;

export const toolSchema = z.enum(["text2image", "text2mesh", "texturing", "img2video"]);
export type Tool = z.infer<typeof toolSchema>;

// Session tracking for rate limiting
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  heavyJobsThisHour: integer("heavy_jobs_this_hour").notNull().default(0),
  lastHeavyJobAt: timestamp("last_heavy_job_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assets table for persistent storage of generated content
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  jobType: text("job_type").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
