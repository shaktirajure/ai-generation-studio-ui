// Job service for managing AI generation jobs

import { db } from "./db";
import { jobs, toolCosts, toolSchema, type Tool, type Job, sessions, users } from "@shared/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { ProviderFactory } from "./providers/provider-factory";
import type { 
  TextToImageRequest, 
  TextTo3DRequest, 
  TexturingRequest, 
  ImageToVideoRequest,
  ProviderJob
} from "./providers/types";

export interface CreateJobRequest {
  tool: Tool;
  prompt: string;
  inputs?: any;
  userId: string;
  sessionId: string;
}

export class JobService {
  // Check if user has enough credits
  static async checkCredits(userId: string, tool: Tool): Promise<boolean> {
    const cost = toolCosts[tool];
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    return user && user.credits >= cost;
  }

  // Check rate limits for heavy jobs
  static async checkRateLimit(userId: string, sessionId: string, tool: Tool): Promise<boolean> {
    const heavyJobs: Tool[] = ["text2mesh", "texturing", "img2video"];
    if (!heavyJobs.includes(tool)) return true;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Get or create session
    let [session] = await db.select().from(sessions).where(
      and(eq(sessions.userId, userId), eq(sessions.id, sessionId))
    );

    if (!session) {
      [session] = await db.insert(sessions).values({
        userId,
        id: sessionId,
        heavyJobsThisHour: 0,
      }).returning();
    }

    // Reset counter if last heavy job was more than an hour ago
    if (!session.lastHeavyJobAt || session.lastHeavyJobAt < oneHourAgo) {
      await db.update(sessions)
        .set({ 
          heavyJobsThisHour: 0,
          lastHeavyJobAt: new Date()
        })
        .where(eq(sessions.id, sessionId));
      return true;
    }

    return session.heavyJobsThisHour < 5;
  }

  // Create and start a job
  static async createJob(request: CreateJobRequest): Promise<Job> {
    const { tool, prompt, inputs, userId, sessionId } = request;
    const cost = toolCosts[tool];

    // Validate tool
    if (!toolSchema.safeParse(tool).success) {
      throw new Error(`Invalid tool: ${tool}`);
    }

    // Check credits
    if (!(await this.checkCredits(userId, tool))) {
      throw new Error(`Insufficient credits. ${tool} costs ${cost} credits.`);
    }

    // Check rate limits
    if (!(await this.checkRateLimit(userId, sessionId, tool))) {
      throw new Error("Rate limit exceeded. Maximum 5 heavy jobs per hour.");
    }

    // Deduct credits atomically
    await db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user || user.credits < cost) {
        throw new Error("Insufficient credits");
      }
      
      await tx.update(users)
        .set({ credits: user.credits - cost })
        .where(eq(users.id, userId));
    });

    // Create job record and update heavy job counter if needed
    const [job] = await db.transaction(async (tx) => {
      const [newJob] = await tx.insert(jobs).values({
        tool,
        prompt,
        inputs: inputs || null,
        status: "queued",
        userId,
        sessionId,
        creditsUsed: cost,
        provider: this.getProviderName(tool),
      }).returning();

      // Update heavy job counter for rate limiting
      const heavyJobs: Tool[] = ["text2mesh", "texturing", "img2video"];
      if (heavyJobs.includes(tool)) {
        await tx.update(sessions)
          .set({ 
            heavyJobsThisHour: sql`${sessions.heavyJobsThisHour} + 1`,
            lastHeavyJobAt: new Date()
          })
          .where(and(eq(sessions.userId, userId), eq(sessions.id, sessionId)));
      }

      return newJob;
    });

    // Start the job asynchronously
    this.startJob(job.id).catch(console.error);

    return job;
  }

  // Start job processing
  private static async startJob(jobId: string): Promise<void> {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (!job) throw new Error("Job not found");

      // Update status to processing
      await db.update(jobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(jobs.id, jobId));

      // Route to appropriate provider
      const providerJob = await this.routeToProvider(job);

      // Store provider job ID
      await db.update(jobs)
        .set({ 
          providerJobId: providerJob.id,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));

      // Start polling for completion (if not immediate)
      if (providerJob.status !== "completed") {
        this.pollJobStatus(jobId, providerJob.id).catch(console.error);
      } else {
        await this.completeJob(jobId, providerJob);
      }

    } catch (error) {
      console.error("Error starting job:", error);
      await this.failJob(jobId, error instanceof Error ? error.message : "Unknown error");
    }
  }

  // Route job to appropriate provider
  private static async routeToProvider(job: Job): Promise<ProviderJob> {
    const inputs = job.inputs as any || {};
    
    switch (job.tool) {
      case "text2image":
        const imageProvider = ProviderFactory.createTextToImageProvider();
        return imageProvider.generateImage({
          prompt: job.prompt,
          options: inputs.options
        });

      case "text2mesh":
        const meshProvider = ProviderFactory.createTextTo3DProvider();
        return meshProvider.generateMesh({
          prompt: job.prompt,
          options: inputs.options
        });

      case "texturing":
        const texturingProvider = ProviderFactory.createTexturingProvider();
        return texturingProvider.generateTextures({
          modelUrl: inputs.modelUrl,
          prompt: job.prompt,
          options: inputs.options
        });

      case "img2video":
        const videoProvider = ProviderFactory.createImageToVideoProvider();
        return videoProvider.generateVideo({
          imageUrl: inputs.imageUrl,
          prompt: job.prompt,
          options: inputs.options
        });

      default:
        throw new Error(`Unsupported tool: ${job.tool}`);
    }
  }

  // Poll job status for async providers
  private static async pollJobStatus(jobId: string, providerJobId: string): Promise<void> {
    const maxAttempts = 60; // 5 minutes at 5 second intervals
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        
        const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
        if (!job) return;

        const provider = this.getProvider(job.tool as Tool);
        const providerJob = await provider.getJobStatus(providerJobId);

        if (providerJob.status === "completed") {
          await this.completeJob(jobId, providerJob);
        } else if (providerJob.status === "failed") {
          await this.failJob(jobId, providerJob.error || "Provider job failed");
        } else if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 5000);
        } else {
          await this.failJob(jobId, "Job timed out");
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        await this.failJob(jobId, "Polling error");
      }
    };

    setTimeout(poll, 5000);
  }

  // Complete a job
  private static async completeJob(jobId: string, providerJob: ProviderJob): Promise<void> {
    await db.update(jobs)
      .set({
        status: "completed",
        assetUrls: providerJob.result?.assetUrls || null,
        meta: providerJob.result?.meta || null,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, jobId));
  }

  // Fail a job and refund credits
  private static async failJob(jobId: string, error: string): Promise<void> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (!job) return;

    // Refund credits
    await db.transaction(async (tx) => {
      // Get current credits first
      const [user] = await tx.select().from(users).where(eq(users.id, job.userId));
      if (user) {
        await tx.update(users)
          .set({ credits: user.credits + job.creditsUsed })
          .where(eq(users.id, job.userId));
      }

      await tx.update(jobs)
        .set({
          status: "failed",
          meta: { error },
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
    });
  }

  // Get provider for a tool
  private static getProvider(tool: Tool): any {
    switch (tool) {
      case "text2image":
        return ProviderFactory.createTextToImageProvider();
      case "text2mesh":
        return ProviderFactory.createTextTo3DProvider();
      case "texturing":
        return ProviderFactory.createTexturingProvider();
      case "img2video":
        return ProviderFactory.createImageToVideoProvider();
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  // Get provider name for a tool
  private static getProviderName(tool: Tool): string {
    const config = {
      text2image: process.env.PROVIDER_TEXT2IMAGE || "FLUX",
      text2mesh: process.env.PROVIDER_3D || "SIM",
      texturing: process.env.PROVIDER_TEXTURE || "SIM",
      img2video: process.env.PROVIDER_VIDEO || "SIM",
    };

    switch (tool) {
      case "text2image":
        return config.text2image;
      case "text2mesh":
        return config.text2mesh;
      case "texturing":
        return config.texturing;
      case "img2video":
        return config.img2video;
      default:
        return "SIM";
    }
  }

  // Get job by ID
  static async getJob(jobId: string): Promise<Job | null> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    return job || null;
  }

  // Get jobs for user
  static async getUserJobs(userId: string, limit: number = 20, offset: number = 0): Promise<Job[]> {
    return db.select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}