import { type User, type InsertUser, type Job, type InsertJob, type Asset, type InsertAsset } from "@shared/schema";
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
  consumeCredits(userId: string, amount: number): Promise<{ success: boolean; remaining: number }>;
  ensureUser(userId: string): Promise<User>;
  // Asset management methods
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAssets(userId?: string): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
}

// Demo user constant
export const DEMO_USER_ID = "demo-user";

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private assets: Map<string, Asset>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.assets = new Map();
    
    // Seed demo user at startup
    const demoUser: User = {
      id: DEMO_USER_ID,
      username: "demo-user",
      password: "temp",
      credits: 20
    };
    this.users.set(DEMO_USER_ID, demoUser);
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

  async consumeCredits(userId: string, amount: number): Promise<{ success: boolean; remaining: number }> {
    const user = await this.ensureUser(userId);
    if (user.credits < amount) {
      return { success: false, remaining: user.credits }; // Insufficient credits
    }
    
    const newCredits = user.credits - amount;
    const updatedUser: User = { ...user, credits: newCredits };
    this.users.set(userId, updatedUser);
    return { success: true, remaining: newCredits }; // Credits deducted successfully
  }

  // Legacy method for compatibility
  async deductUserCredits(userId: string, amount: number): Promise<boolean> {
    const result = await this.consumeCredits(userId, amount);
    return result.success;
  }

  async ensureUser(userId: string): Promise<User> {
    let user = await this.getUser(userId);
    if (!user) {
      // Create a user with the provided userId as the key
      const newUser: User = {
        id: userId,
        username: userId,
        password: 'temp',
        credits: 20
      };
      this.users.set(userId, newUser);
      user = newUser;
    }
    return user;
  }

  // Asset management methods
  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = randomUUID();
    const asset: Asset = {
      id,
      ...insertAsset,
      createdAt: new Date(),
    };
    // For now, store assets in memory as a Map
    if (!this.assets) {
      this.assets = new Map();
    }
    this.assets.set(id, asset);
    return asset;
  }

  async getAssets(userId?: string): Promise<Asset[]> {
    if (!this.assets) {
      return [];
    }
    const allAssets = Array.from(this.assets.values());
    if (userId) {
      return allAssets.filter(asset => asset.userId === userId);
    }
    return allAssets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return this.assets?.get(id);
  }
}

export const storage = new MemStorage();
