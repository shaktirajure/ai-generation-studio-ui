// Simulation provider for testing without external APIs

import { 
  ITextToImageProvider, 
  ITextTo3DProvider, 
  ITexturingProvider, 
  IImageToVideoProvider,
  ProviderJob,
  TextToImageRequest,
  TextTo3DRequest,
  TexturingRequest,
  ImageToVideoRequest
} from "./types";

// Known public assets for simulation
const SIM_ASSETS = {
  GLB_MODEL: "https://threejs.org/examples/models/gltf/DamagedHelmet/DamagedHelmet.gltf",
  TEXTURE_ALBEDO: "https://threejs.org/examples/models/gltf/DamagedHelmet/DamagedHelmet_baseColor.png",
  TEXTURE_NORMAL: "https://threejs.org/examples/models/gltf/DamagedHelmet/DamagedHelmet_normal.png",
  TEXTURE_METALLIC: "https://threejs.org/examples/models/gltf/DamagedHelmet/DamagedHelmet_metallicRoughness.png",
  VIDEO_SAMPLE: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
};

export class SimProvider implements ITextToImageProvider, ITextTo3DProvider, ITexturingProvider, IImageToVideoProvider {
  private jobs = new Map<string, ProviderJob>();

  private generateJobId(): string {
    return `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createJob(status: "queued" | "processing" | "completed" = "queued"): ProviderJob {
    const id = this.generateJobId();
    const job: ProviderJob = { id, status };
    this.jobs.set(id, job);
    return job;
  }

  // Text to Image (using existing FLUX implementation)
  async generateImage(request: TextToImageRequest): Promise<ProviderJob> {
    // For SIM mode, we'll still use the real FLUX.1 implementation
    const job = this.createJob("processing");
    
    // Simulate async processing
    setTimeout(async () => {
      try {
        // Import the existing AI service
        const { AIService } = await import("../ai-service");
        const result = await AIService.generateTextToImage(request.prompt);
        
        if (result.success) {
          job.status = "completed";
          job.result = {
            assetUrls: [result.url],
            meta: { prompt: request.prompt, model: "FLUX.1-schnell" }
          };
        } else {
          job.status = "failed";
          job.error = result.error || "Generation failed";
        }
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "Unknown error";
      }
      
      this.jobs.set(job.id, job);
    }, 2000); // 2 second delay for realism
    
    return job;
  }

  // Text to 3D
  async generateMesh(request: TextTo3DRequest): Promise<ProviderJob> {
    const job = this.createJob("processing");
    
    setTimeout(() => {
      job.status = "completed";
      job.result = {
        assetUrls: [SIM_ASSETS.GLB_MODEL],
        meta: { 
          prompt: request.prompt,
          provider: "SIM",
          note: "This is a sample 3D model for demonstration"
        }
      };
      this.jobs.set(job.id, job);
    }, 8000); // Longer delay for 3D generation
    
    return job;
  }

  // AI Texturing
  async generateTextures(request: TexturingRequest): Promise<ProviderJob> {
    const job = this.createJob("processing");
    
    setTimeout(() => {
      job.status = "completed";
      job.result = {
        assetUrls: [
          SIM_ASSETS.TEXTURE_ALBEDO,
          SIM_ASSETS.TEXTURE_NORMAL,
          SIM_ASSETS.TEXTURE_METALLIC,
        ],
        meta: {
          prompt: request.prompt,
          modelUrl: request.modelUrl,
          provider: "SIM",
          maps: {
            albedo: SIM_ASSETS.TEXTURE_ALBEDO,
            normal: SIM_ASSETS.TEXTURE_NORMAL,
            metallicRoughness: SIM_ASSETS.TEXTURE_METALLIC,
          }
        }
      };
      this.jobs.set(job.id, job);
    }, 6000);
    
    return job;
  }

  // Image to Video
  async generateVideo(request: ImageToVideoRequest): Promise<ProviderJob> {
    const job = this.createJob("processing");
    
    setTimeout(() => {
      job.status = "completed";
      job.result = {
        assetUrls: [SIM_ASSETS.VIDEO_SAMPLE],
        meta: {
          prompt: request.prompt,
          imageUrl: request.imageUrl,
          provider: "SIM",
          note: "This is a sample video for demonstration"
        }
      };
      this.jobs.set(job.id, job);
    }, 10000); // Longest delay for video generation
    
    return job;
  }

  // Common status check
  async getJobStatus(jobId: string): Promise<ProviderJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    return job;
  }
}