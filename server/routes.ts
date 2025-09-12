import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, DEMO_USER_ID } from "./storage";
import { insertJobSchema } from "@shared/schema";
import { AIService } from "./ai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Webhook endpoint
  app.post("/webhook", async (req, res) => {
    try {
      const { jobType, inputText } = req.body;
      
      // Use server-side user ID (demo user for now)
      const userId = DEMO_USER_ID;
      
      // Validate the request body
      const validatedData = insertJobSchema.parse({ jobType, inputText, userId });
      
      // Atomically check and consume 1 credit
      const creditResult = await storage.consumeCredits(userId, 1);
      if (!creditResult.success) {
        return res.status(402).json({ 
          error: "Insufficient credits",
          message: `You need at least 1 credit to create a job. You have ${creditResult.remaining} credits remaining.`
        });
      }
      
      // Log the incoming request to console
      console.log("Webhook received:", {
        jobType,
        inputText,
        userId,
        creditsRemaining: creditResult.remaining,
        timestamp: new Date().toISOString()
      });
      
      // Store the job in memory and get the job ID
      const job = await storage.createJob(validatedData);
      
      res.json({
        status: "received",
        jobId: job.id,
        creditsRemaining: creditResult.remaining
      });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Job status endpoint
  app.get("/api/job/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      const response: any = {
        id: job.id,
        status: job.status,
        jobType: job.jobType,
        inputText: job.inputText,
        userId: job.userId,
        createdAt: job.createdAt
      };
      
      if (job.status === "done" && job.resultUrl) {
        response.resultUrl = job.resultUrl;
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get assets endpoint  
  app.get("/api/assets", async (req, res) => {
    try {
      // Use server-side user ID (demo user for now)
      const userId = DEMO_USER_ID;
      const assets = await storage.getAssets(userId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user credits endpoint
  app.get("/api/credits", async (req, res) => {
    try {
      // Use server-side user ID (demo user for now)
      const userId = DEMO_USER_ID;
      const credits = await storage.getUserCredits(userId);
      res.json({ credits });
    } catch (error) {
      console.error("Error fetching user credits:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Download asset endpoint
  app.get("/api/assets/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Asset ID is required" });
      }

      // Get asset by ID (ensure it belongs to the current user)
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      // Verify asset belongs to current user (for security)
      const userId = DEMO_USER_ID;
      if (asset.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Fetch the remote image
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(asset.url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Failed to fetch asset ${id} from ${asset.url}: ${response.status}`);
        return res.status(502).json({ error: "Failed to fetch asset" });
      }

      // Set download headers
      const filename = `${asset.jobType}-${asset.id.slice(0, 8)}.png`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
      
      // Stream the image data
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error("Error downloading asset:", error);
      res.status(500).json({ error: "Failed to download asset" });
    }
  });

  // Generate content endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, jobType } = req.body;
      
      if (!prompt || !jobType) {
        return res.status(400).json({ 
          error: "Missing required fields: prompt and jobType are required" 
        });
      }

      // Use server-side user ID (demo user for now)
      const userId = DEMO_USER_ID;
      
      // Consume 1 credit for generation
      const creditResult = await storage.consumeCredits(userId, 1);
      if (!creditResult.success) {
        return res.status(402).json({ 
          error: "Insufficient credits",
          message: `You need at least 1 credit to generate content. You have ${creditResult.remaining} credits remaining.`
        });
      }
      
      console.log("Generate request:", {
        prompt,
        jobType,
        userId,
        creditsRemaining: creditResult.remaining,
        timestamp: new Date().toISOString()
      });
      
      // Call appropriate AI service based on job type
      let generationResult;
      switch (jobType) {
        case "text-to-image":
          generationResult = await AIService.generateTextToImage(prompt);
          break;
        case "text-to-3D":
          generationResult = await AIService.generateTextTo3D(prompt);
          break;
        case "image-to-video":
          generationResult = await AIService.generateImageToVideo(prompt);
          break;
        default:
          return res.status(400).json({ 
            error: `Unsupported job type: ${jobType}. Supported types are: text-to-image, text-to-3D, image-to-video` 
          });
      }

      // Check if generation was successful
      if (!generationResult.success) {
        // Refund the credit since generation failed
        await storage.addCredits(userId, 1);
        return res.status(422).json({ 
          error: "Generation failed",
          message: generationResult.error || "Unknown error occurred during generation. Please try again."
        });
      }
      
      // Create asset record only if generation was successful
      const asset = await storage.createAsset({
        prompt,
        url: generationResult.url,
        jobType,
        userId
      });
      
      res.json({
        success: true,
        asset: {
          id: asset.id,
          prompt: asset.prompt,
          url: asset.url,
          jobType: asset.jobType,
          createdAt: asset.createdAt
        },
        creditsRemaining: creditResult.remaining
      });
      
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
