// Webhook service for handling vendor callbacks

import crypto from "crypto";
import { JobService } from "./job-service";

export interface WebhookRequest {
  jobId: string;
  status: "completed" | "failed";
  result?: {
    assetUrls: string[];
    meta?: Record<string, any>;
  };
  error?: string;
  signature?: string;
}

export class WebhookService {
  private static readonly WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "default-webhook-secret";

  // Verify webhook signature using HMAC
  static verifySignature(payload: string, signature: string): boolean {
    if (!signature) return false;

    const expectedSignature = `sha256=${crypto
      .createHmac("sha256", this.WEBHOOK_SECRET)
      .update(payload)
      .digest("hex")}`;

    // Compare signatures safely with length guard to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Process webhook payload
  static async processWebhook(request: WebhookRequest): Promise<void> {
    const { jobId, status, result, error } = request;

    try {
      const job = await JobService.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (status === "completed" && result) {
        await this.completeJob(jobId, result.assetUrls, result.meta);
      } else if (status === "failed") {
        await this.failJob(jobId, error || "Webhook reported failure");
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      throw error;
    }
  }

  // Complete job via webhook
  private static async completeJob(
    jobId: string, 
    assetUrls: string[], 
    meta?: Record<string, any>
  ): Promise<void> {
    const { db } = await import("./db");
    const { jobs } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    await db.update(jobs)
      .set({
        status: "completed",
        assetUrls,
        meta,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, jobId));
  }

  // Fail job via webhook
  private static async failJob(jobId: string, error: string): Promise<void> {
    const { db } = await import("./db");
    const { jobs, users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    // Get job and refund credits
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (!job) return;

    await db.transaction(async (tx) => {
      // Refund credits
      const [user] = await tx.select().from(users).where(eq(users.id, job.userId));
      if (user) {
        await tx.update(users)
          .set({ credits: user.credits + job.creditsUsed })
          .where(eq(users.id, job.userId));
      }

      // Update job status
      await tx.update(jobs)
        .set({
          status: "failed",
          meta: { error },
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
    });
  }

  // Simulate webhook for testing
  static async simulateWebhook(jobId: string, delay: number = 6000): Promise<void> {
    if (!process.env.SIMULATE_WEBHOOKS) return;

    setTimeout(async () => {
      try {
        // Create a mock successful webhook payload
        const payload = JSON.stringify({
          jobId,
          status: "completed",
          result: {
            assetUrls: ["https://example.com/generated-asset.glb"],
            meta: { simulated: true, timestamp: new Date().toISOString() }
          }
        });

        // Create signature
        const signature = `sha256=${crypto
          .createHmac("sha256", this.WEBHOOK_SECRET)
          .update(payload)
          .digest("hex")}`;

        // Process webhook
        await this.processWebhook({
          jobId,
          status: "completed",
          result: {
            assetUrls: ["https://example.com/generated-asset.glb"],
            meta: { simulated: true, timestamp: new Date().toISOString() }
          }
        });

        console.log(`Simulated webhook completed for job ${jobId}`);
      } catch (error) {
        console.error("Error simulating webhook:", error);
      }
    }, delay);
  }
}