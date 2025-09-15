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

// Prompt-based 3D model selection for simulation
const PROMPT_TO_MODEL = {
  // Kitchen/household items (including teapot for testing)
  'teapot|kettle|pot|kitchen|tea|coffee': 'https://threejs.org/examples/models/gltf/teapot.gltf',
  
  // Robots, machines, tech
  'robot|android|mech|machine|tech|cyber|futuristic': 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  
  // Animals and creatures
  'dog|cat|animal|pet|creature|dragon|bird|fish': 'https://threejs.org/examples/models/gltf/Horse.glb',
  
  // Vehicles and transportation
  'car|vehicle|truck|ship|plane|boat|motorcycle': 'https://threejs.org/examples/models/gltf/ferrari.glb',
  
  // Natural objects and plants
  'flower|plant|tree|garden|nature|organic|bloom|petal|rose|tulip|lily|daisy': 'https://modelviewer.dev/shared-assets/models/Flower/Flower.glb',
  
  // Buildings and architecture
  'house|building|castle|tower|structure|architecture': 'https://threejs.org/examples/models/gltf/LittlestTokyo.glb',
  
  // Default fallback
  'default': 'https://threejs.org/examples/models/gltf/DamagedHelmet/DamagedHelmet.gltf'
};

function selectModelFromPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [keywords, modelUrl] of Object.entries(PROMPT_TO_MODEL)) {
    if (keywords === 'default') continue;
    
    const regex = new RegExp(keywords, 'i');
    if (regex.test(lowerPrompt)) {
      return modelUrl;
    }
  }
  
  return PROMPT_TO_MODEL.default;
}

// Enhanced prompt generation with customizations
function enhancePromptWithCustomizations(prompt: string, customizations: any): string {
  let enhanced = prompt;
  
  if (customizations.style) {
    enhanced += `, ${customizations.style} style`;
  }
  
  if (customizations.color) {
    enhanced += `, ${customizations.color} color scheme`;
  }
  
  if (customizations.material) {
    enhanced += `, ${customizations.material} material`;
  }
  
  if (customizations.quality) {
    enhanced += `, ${customizations.quality} quality`;
  }
  
  return enhanced;
}

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

  // Text to 3D (Enhanced with image preview and real generation)
  async generateMesh(request: TextTo3DRequest): Promise<ProviderJob> {
    const job = this.createJob("processing");
    
    // Simulate realistic generation process
    setTimeout(async () => {
      try {
        // Step 1: Generate image preview first (like Meshy AI)
        const { AIService } = await import("../ai-service");
        const imageResult = await AIService.generateTextToImage(request.prompt);
        
        // Step 2: Select 3D model based on prompt
        const selectedModel = selectModelFromPrompt(request.prompt);
        
        // Step 3: Generate variations based on style/customization
        const customizations = request.options?.customizations || {};
        const enhancedPrompt = enhancePromptWithCustomizations(request.prompt, customizations);
        
        if (imageResult.success) {
          job.status = "completed";
          job.result = {
            // Return both image preview AND 3D model
            assetUrls: [selectedModel],
            previewImage: imageResult.url, // Image preview like Meshy AI
            meta: { 
              prompt: request.prompt,
              enhancedPrompt,
              provider: "SIM_Enhanced",
              customizations,
              type: "3D_with_preview",
              note: `Generated 3D model with image preview for: "${request.prompt}"`
            }
          };
          console.log(`[SIM DEBUG] Text2Mesh job ${job.id} completed with preview image and model: ${selectedModel}`);
        } else {
          // Fallback to 3D only if image generation fails
          job.status = "completed";
          job.result = {
            assetUrls: [selectedModel],
            meta: { 
              prompt: request.prompt,
              provider: "SIM_Enhanced",
              type: "3D_only",
              note: `Generated 3D model for: "${request.prompt}"`
            }
          };
          console.log(`[SIM DEBUG] Text2Mesh job ${job.id} completed with model only: ${selectedModel}`);
        }
        
        this.jobs.set(job.id, job);
        
        // Simulate webhook delivery if enabled
        if (process.env.SIMULATE_WEBHOOKS === 'true') {
          await this.simulateWebhookWithFileDownload(job.id, job.result);
        }
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "3D generation failed";
        this.jobs.set(job.id, job);
      }
    }, 8000); // Longer delay for realistic 3D generation
    
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

  // Simulate webhook with file download for comprehensive testing
  private async simulateWebhookWithFileDownload(jobId: string, result: any): Promise<void> {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      console.log('[SIM] No BASE_URL configured, skipping webhook simulation');
      return;
    }

    try {
      // For 3D models, download and store locally
      if (result?.assetUrls?.[0]) {
        const { FileService } = await import('../file-service');
        const modelUrl = result.assetUrls[0];
        
        // Extract job ID for file naming
        const jobIdPart = jobId.split('_')[1] || jobId;
        const localPath = await FileService.downloadAndStore(modelUrl, jobIdPart, '.glb');
        
        // Update result to use local path
        result.assetUrls = [localPath];
        result.meta = {
          ...result.meta,
          originalUrl: modelUrl,
          localPath,
        };
        
        console.log(`[SIM] Downloaded model to: ${localPath}`);
      }

      // Send webhook
      const webhookUrl = `${baseUrl}/api/webhooks/vendor`;
      const payload = {
        jobId,
        status: 'completed',
        result,
      };

      const signature = this.createWebhookSignature(JSON.stringify(payload));
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
        },
        body: JSON.stringify(payload),
      });

      console.log(`[SIM] Sent webhook for job ${jobId} with local file`);
      
    } catch (error) {
      console.error('[SIM] Error in webhook simulation:', error);
    }
  }

  private createWebhookSignature(payload: string): string {
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET || 'default-webhook-secret';
    return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  }
}