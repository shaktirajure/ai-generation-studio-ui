// Replicate API provider for Text→3D generation
import { ITextTo3DProvider, TextTo3DRequest, ProviderJob } from './types';
import { FileService } from '../file-service';

export class ReplicateProvider implements ITextTo3DProvider {
  private apiToken: string;
  private baseUrl = 'https://api.replicate.com/v1';
  private jobs = new Map<string, ProviderJob>();

  constructor(apiToken: string) {
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN is required');
    }
    this.apiToken = apiToken;
  }

  async generateMesh(request: TextTo3DRequest): Promise<ProviderJob> {
    console.log('[REPLICATE] Starting text-to-3D generation:', request.prompt);

    const job: ProviderJob = {
      id: `replicate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'processing'
    };

    try {
      // Create prediction with Point-E or similar 3D model
      const response = await fetch(`${this.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "40c76190258990b7ba2e9b3b5125a4ad5c7a09c7", // Point-E model
          input: {
            prompt: request.prompt,
            num_inference_steps: request.options?.quality === 'high' ? 100 : 64,
          },
          webhook: this.getWebhookUrl(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Replicate API error: ${response.status} ${error}`);
      }

      const result = await response.json();
      
      job.result = {
        assetUrls: [], // Will be populated when prediction completes
        meta: {
          replicateId: result.id,
          prompt: request.prompt,
          provider: 'REPLICATE',
          status: result.status,
        }
      };

      this.jobs.set(job.id, job);

      console.log(`[REPLICATE] Text-to-3D job created: ${job.id} (Replicate ID: ${result.id})`);
      return job;

    } catch (error) {
      console.error('[REPLICATE] Error creating text-to-3D job:', error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      return job;
    }
  }

  async getJobStatus(jobId: string): Promise<ProviderJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // If job has a Replicate prediction ID, check its status
    if (job.result?.meta?.replicateId) {
      try {
        const response = await fetch(`${this.baseUrl}/predictions/${job.result.meta.replicateId}`, {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'succeeded' && result.output) {
            // Output should be a URL to the generated 3D file
            const modelUrl = Array.isArray(result.output) ? result.output[0] : result.output;
            
            if (modelUrl && typeof modelUrl === 'string') {
              try {
                // Download and store the file locally
                const jobIdPart = jobId.split('_')[1] || jobId;
                const extension = modelUrl.endsWith('.ply') ? '.ply' : '.glb';
                const localPath = await FileService.downloadAndStore(modelUrl, jobIdPart, extension);
                
                job.status = 'completed';
                job.result = {
                  assetUrls: [localPath],
                  meta: {
                    ...job.result.meta,
                    originalUrl: modelUrl,
                    localPath,
                    replicateStatus: result.status,
                  }
                };
              } catch (downloadError) {
                console.error('[REPLICATE] Failed to download model:', downloadError);
                job.status = 'failed';
                job.error = 'Failed to download generated model';
              }
            }
          } else if (result.status === 'failed') {
            job.status = 'failed';
            job.error = result.error || 'Replicate generation failed';
          } else if (result.status === 'canceled') {
            job.status = 'failed';
            job.error = 'Generation was canceled';
          }
          
          // Update meta with latest status
          if (job.result?.meta) {
            job.result.meta.replicateStatus = result.status;
          }
        }
      } catch (error) {
        console.error('[REPLICATE] Error checking job status:', error);
      }
    }

    return job;
  }

  private getWebhookUrl(): string | undefined {
    const baseUrl = process.env.BASE_URL;
    return baseUrl ? `${baseUrl}/api/webhooks/vendor` : undefined;
  }

  // Handle webhook from Replicate (called by webhook service)
  static async handleWebhook(payload: any): Promise<void> {
    console.log('[REPLICATE] Received webhook:', payload);
    
    // Replicate webhook format is different, extract job info
    if (payload.id && payload.status) {
      const webhookData = {
        jobId: `replicate_${payload.id}`, // Match our job ID format
        status: payload.status === 'succeeded' ? 'completed' : 'failed',
        result: payload.status === 'succeeded' ? {
          assetUrls: Array.isArray(payload.output) ? payload.output : [payload.output],
          meta: {
            replicateId: payload.id,
            replicateStatus: payload.status,
          }
        } : undefined,
        error: payload.error,
      };

      // Process through webhook service
      const { WebhookService } = await import('../webhook-service');
      await WebhookService.processWebhook(webhookData);
    }
  }
}