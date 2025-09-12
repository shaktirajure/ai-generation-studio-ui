import { type User, type InsertUser, type Job, type InsertJob } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  updateJobStatus(id: string, status: "pending" | "done", resultUrl?: string): Promise<Job | undefined>;
  getCompletedJobs(): Promise<Job[]>;
  getUserCredits(userId: string): Promise<number>;
  deductUserCredits(userId: string, amount: number): Promise<boolean>;
  ensureUser(userId: string): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, credits: 20 };
    this.users.set(id, user);
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      id,
      ...insertJob,
      status: "pending",
      createdAt: new Date(),
    };
    this.jobs.set(id, job);
    
    // Simulate AI processing - update to "done" after 5 seconds with placeholder URLs
    setTimeout(() => {
      this.updateJobStatus(id, "done", "https://example.com/generated-content.png");
    }, 5000);
    
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async updateJobStatus(id: string, status: "pending" | "done", resultUrl?: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob: Job = { ...job, status, resultUrl };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async getCompletedJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.status === "done")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserCredits(userId: string): Promise<number> {
    const user = await this.ensureUser(userId);
    return user.credits;
  }

  async deductUserCredits(userId: string, amount: number): Promise<boolean> {
    const user = await this.ensureUser(userId);
    if (user.credits < amount) {
      return false; // Insufficient credits
    }
    
    const updatedUser: User = { ...user, credits: user.credits - amount };
    this.users.set(userId, updatedUser);
    return true; // Credits deducted successfully
  }

  async ensureUser(userId: string): Promise<User> {
    let user = await this.getUser(userId);
    if (!user) {
      // Create a default user if it doesn't exist
      user = await this.createUser({ username: userId, password: 'temp' });
    }
    return user;
  }
}

export const storage = new MemStorage();
