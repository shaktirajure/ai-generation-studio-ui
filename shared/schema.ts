import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(20),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Job types for webhook processing
export const jobSchema = z.object({
  id: z.string(),
  jobType: z.string(),
  inputText: z.string(),
  userId: z.string(),
  status: z.enum(["pending", "done"]),
  resultUrl: z.string().optional(),
  createdAt: z.date(),
});

export const insertJobSchema = z.object({
  jobType: z.string(),
  inputText: z.string(),
  userId: z.string(),
});

export type Job = z.infer<typeof jobSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
