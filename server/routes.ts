import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, DEMO_USER_ID } from "./storage";
import { insertJobSchema } from "@shared/schema";

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

  // Get completed jobs endpoint
  app.get("/api/assets", async (req, res) => {
    try {
      const completedJobs = await storage.getCompletedJobs();
      res.json(completedJobs);
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
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

  const httpServer = createServer(app);

  return httpServer;
}
