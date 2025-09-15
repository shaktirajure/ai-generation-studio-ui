import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { JobService } from "./job-service";
import { WebhookService } from "./webhook-service";
import { toolSchema, toolCosts } from "@shared/schema";
import { AIService } from "./ai-service";
import { z } from "zod";
import crypto from "crypto";

const DEMO_USER_ID = "demo-user";
const DEMO_SESSION_ID = "demo-session";

// Rate limiting middleware for mutating operations only
const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: "Too many requests, please try again later" },
  skip: (req) => req.method === "HEAD" || req.method === "GET" // Skip rate limiting for read operations
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to write routes only
  app.use("/api", generalRateLimit);

  // Get user credits
  app.get("/api/credits", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const [user] = await db.select({ credits: users.credits })
        .from(users)
        .where({ column: 'id', value: DEMO_USER_ID });

      if (!user) {
        // Create demo user if doesn't exist
        await db.insert(users).values({
          id: DEMO_USER_ID,
          username: "demo",
          password: "demo",
          credits: 25
        }).onConflictDoNothing();
        
        return res.json({ credits: 25 });
      }

      res.json({ credits: user.credits });
    } catch (error) {
      console.error("Error getting credits:", error);
      res.status(500).json({ error: "Failed to get credits" });
    }
  });

  // Create a new job
  app.post("/api/jobs", async (req, res) => {
    try {
      const { tool, prompt, inputs } = req.body;

      // Validate tool
      const validatedTool = toolSchema.parse(tool);
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const job = await JobService.createJob({
        tool: validatedTool,
        prompt,
        inputs: inputs || {},
        userId: DEMO_USER_ID,
        sessionId: DEMO_SESSION_ID
      });

      res.json({
        success: true,
        job: {
          id: job.id,
          tool: job.tool,
          prompt: job.prompt,
          status: job.status,
          creditsUsed: job.creditsUsed,
          createdAt: job.createdAt
        }
      });

    } catch (error) {
      console.error("Error creating job:", error);
      const message = error instanceof Error ? error.message : "Failed to create job";
      
      if (message.includes("Insufficient credits")) {
        return res.status(402).json({ error: "Insufficient credits", message });
      }
      if (message.includes("Rate limit")) {
        return res.status(429).json({ error: "Rate limit exceeded", message });
      }
      
      res.status(400).json({ error: message });
    }
  });

  // Get job status
  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await JobService.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json({
        id: job.id,
        tool: job.tool,
        prompt: job.prompt,
        status: job.status,
        assetUrls: job.assetUrls,
        meta: job.meta,
        creditsUsed: job.creditsUsed,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      });

    } catch (error) {
      console.error("Error getting job:", error);
      res.status(500).json({ error: "Failed to get job" });
    }
  });

  // Get user's jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const jobs = await JobService.getUserJobs(DEMO_USER_ID, limit, offset);

      res.json({
        jobs: jobs.map(job => ({
          id: job.id,
          tool: job.tool,
          prompt: job.prompt,
          status: job.status,
          assetUrls: job.assetUrls,
          meta: job.meta,
          creditsUsed: job.creditsUsed,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        })),
        pagination: {
          limit,
          offset,
          hasMore: jobs.length === limit
        }
      });

    } catch (error) {
      console.error("Error getting jobs:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });

  // Legacy generate endpoint for backward compatibility
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, jobType } = req.body;

      if (jobType !== "text-to-image") {
        return res.status(400).json({ 
          error: "Legacy endpoint only supports text-to-image",
          message: "Please use /api/jobs for other tools"
        });
      }

      // Use the job service for consistency
      const job = await JobService.createJob({
        tool: "text2image",
        prompt,
        inputs: {},
        userId: DEMO_USER_ID,
        sessionId: DEMO_SESSION_ID
      });

      // For backward compatibility, wait for completion
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        const updatedJob = await JobService.getJob(job.id);
        
        if (updatedJob?.status === "completed" && updatedJob.assetUrls && Array.isArray(updatedJob.assetUrls) && updatedJob.assetUrls.length > 0) {
          // Get updated credits
          const { db } = await import("./db");
          const { users } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");

          const [user] = await db.select({ credits: users.credits })
            .from(users)
            .where(eq(users.id, DEMO_USER_ID));

          return res.json({
            success: true,
            asset: {
              id: updatedJob.id,
              prompt: updatedJob.prompt,
              url: updatedJob.assetUrls[0],
              jobType: "text-to-image",
              createdAt: updatedJob.createdAt
            },
            creditsRemaining: user?.credits || 0
          });
        }

        if (updatedJob?.status === "failed") {
          const errorMessage = typeof updatedJob.meta === 'object' && updatedJob.meta && 'error' in updatedJob.meta 
            ? String(updatedJob.meta.error) 
            : "Unknown error";
          return res.status(422).json({
            error: "Generation failed",
            message: errorMessage
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      return res.status(408).json({
        error: "Generation timeout",
        message: "Generation is taking longer than expected"
      });

    } catch (error) {
      console.error("Error in legacy generate:", error);
      const message = error instanceof Error ? error.message : "Generation failed";
      
      if (message.includes("Insufficient credits")) {
        return res.status(402).json({ error: "Insufficient credits", message });
      }
      
      res.status(422).json({ error: "Generation failed", message });
    }
  });

  // Webhook endpoint for vendor callbacks
  app.post("/api/webhooks/vendor", async (req, res) => {
    try {
      const signature = req.headers["x-signature"] as string;
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      if (!WebhookService.verifySignature(payload, signature)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      await WebhookService.processWebhook(req.body);
      res.json({ status: "processed" });

    } catch (error) {
      console.error("Error processing vendor webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Admin endpoint to add credits (protected by password)
  app.post("/api/admin/credits", async (req, res) => {
    try {
      const { password, amount } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

      if (password !== adminPassword) {
        return res.status(401).json({ error: "Invalid admin password" });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [user] = await db.select().from(users).where(eq(users.id, DEMO_USER_ID));
      
      if (user) {
        await db.update(users)
          .set({ credits: user.credits + amount })
          .where(eq(users.id, DEMO_USER_ID));
      }

      res.json({ 
        success: true, 
        message: `Added ${amount} credits`,
        newBalance: user ? user.credits + amount : amount
      });

    } catch (error) {
      console.error("Error adding credits:", error);
      res.status(500).json({ error: "Failed to add credits" });
    }
  });

  // Legacy assets endpoint for backward compatibility
  app.get("/api/assets", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const jobs = await JobService.getUserJobs(DEMO_USER_ID, limit, offset);

      // Convert jobs to legacy asset format
      const assets = jobs
        .filter(job => job.status === "completed" && job.assetUrls && job.assetUrls.length > 0)
        .map(job => ({
          id: job.id,
          prompt: job.prompt,
          url: job.assetUrls![0], // Use first asset URL
          jobType: job.tool === "text2image" ? "text-to-image" : job.tool,
          createdAt: job.createdAt
        }));

      res.json(assets);

    } catch (error) {
      console.error("Error getting assets:", error);
      res.status(500).json({ error: "Failed to get assets" });
    }
  });

  // Asset download endpoint
  app.get("/api/assets/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await JobService.getJob(id);

      if (!job || !job.assetUrls || !Array.isArray(job.assetUrls) || job.assetUrls.length === 0) {
        return res.status(404).json({ error: "Asset not found" });
      }

      const assetUrl = job.assetUrls[0];
      
      // Handle data URLs (base64 encoded images)
      if (assetUrl.startsWith("data:")) {
        const [header, data] = assetUrl.split(",");
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const buffer = Buffer.from(data, "base64");

        const extension = mimeType.includes("image") ? "png" : 
                         mimeType.includes("video") ? "mp4" : 
                         mimeType.includes("model") ? "glb" : "bin";

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="generated-${id}.${extension}"`);
        return res.send(buffer);
      }

      // Handle local file paths (starts with /uploads/)
      if (assetUrl.startsWith("/uploads/")) {
        // Serve the local file directly
        const path = await import('path');
        const filePath = path.join(process.cwd(), assetUrl);
        
        // Set appropriate headers for download
        const extension = path.extname(assetUrl).toLowerCase();
        const mimeType = extension === '.glb' ? 'model/gltf-binary' : 
                        extension === '.gltf' ? 'model/gltf+json' : 
                        'application/octet-stream';
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="generated-${id}${extension}"`);
        
        // Use sendFile for efficient file serving
        return res.sendFile(filePath, (err) => {
          if (err) {
            console.error('Error serving local file:', err);
            res.status(404).json({ error: 'File not found' });
          }
        });
      }

      // For external URLs, redirect to the asset
      res.redirect(assetUrl);

    } catch (error) {
      console.error("Error downloading asset:", error);
      res.status(500).json({ error: "Failed to download asset" });
    }
  });

  // Tool information endpoint
  app.get("/api/tools", async (req, res) => {
    res.json({
      tools: [
        {
          id: "text2image",
          name: "Text to Image",
          description: "Generate images from text prompts",
          cost: toolCosts.text2image,
          category: "image"
        },
        {
          id: "text2mesh",
          name: "Text to 3D",
          description: "Generate 3D models from text prompts",
          cost: toolCosts.text2mesh,
          category: "3d"
        },
        {
          id: "texturing",
          name: "AI Texturing",
          description: "Generate PBR textures for 3D models",
          cost: toolCosts.texturing,
          category: "3d"
        },
        {
          id: "img2video",
          name: "Image to Video",
          description: "Generate videos from images",
          cost: toolCosts.img2video,
          category: "video"
        }
      ]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}