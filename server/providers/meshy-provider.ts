// Meshy API provider for Text→3D generation
import { ITextTo3DProvider, TextTo3DRequest, ProviderJob } from './types';
import { FileService } from '../file-service';

export class MeshyProvider implements ITextTo3DProvider {
  private apiKey: string;
  private baseUrl = 'https://api.meshy.ai/v1';
  private jobs = new Map<string, ProviderJob>();

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('MESHY_API_KEY is required');
    }
    this.apiKey = apiKey;
  }

  async generateMesh(request: TextTo3DRequest): Promise<ProviderJob> {
    console.log('[MESHY] Starting text-to-3D generation:', request.prompt);

    const job: ProviderJob = {
      id: `meshy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'processing'
    };

    try {
      // Create text-to-3D task with Meshy API
      const response = await fetch(`${this.baseUrl}/text-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'preview', // or 'refine' for higher quality
          prompt: request.prompt,
          art_style: request.options?.style || 'realistic',
          negative_prompt: '',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meshy API error: ${response.status} ${error}`);
      }

      const result = await response.json();
      job.result = {
        assetUrls: [], // Will be populated when task completes
        meta: {
          meshyTaskId: result.result,
          prompt: request.prompt,
          provider: 'MESHY',
        }
      };

      this.jobs.set(job.id, job);

      // Set up webhook callback URL
      const baseUrl = process.env.BASE_URL;
      if (baseUrl && process.env.WEBHOOK_SECRET) {
        this.setupWebhookPolling(job.id, result.result, baseUrl);
      } else {
        console.warn('[MESHY] No BASE_URL or WEBHOOK_SECRET configured, webhook disabled');
      }

      console.log(`[MESHY] Text-to-3D job created: ${job.id} (Meshy task: ${result.result})`);
      return job;

    } catch (error) {
      console.error('[MESHY] Error creating text-to-3D job:', error);
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

    // If job has a Meshy task ID, check its status
    if (job.result?.meta?.meshyTaskId) {
      try {
        const response = await fetch(`${this.baseUrl}/text-to-3d/${job.result.meta.meshyTaskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'SUCCEEDED' && result.model_urls) {
            // Download and store the GLB file locally
            const glbUrl = result.model_urls.glb;
            if (glbUrl) {
              try {
                const localPath = await FileService.downloadAndStore(glbUrl, jobId.split('_')[1] || jobId);
                job.status = 'completed';
                job.result = {
                  assetUrls: [localPath],
                  meta: {
                    ...job.result.meta,
                    originalUrl: glbUrl,
                    localPath,
                  }
                };
              } catch (downloadError) {
                console.error('[MESHY] Failed to download model:', downloadError);
                job.status = 'failed';
                job.error = 'Failed to download generated model';
              }
            }
          } else if (result.status === 'FAILED') {
            job.status = 'failed';
            job.error = 'Meshy generation failed';
          }
          // Otherwise keep as processing
        }
      } catch (error) {
        console.error('[MESHY] Error checking job status:', error);
      }
    }

    return job;
  }

  // Set up polling for webhook simulation since Meshy doesn't have webhooks
  private setupWebhookPolling(jobId: string, meshyTaskId: string, baseUrl: string): void {
    const pollInterval = setInterval(async () => {
      try {
        const job = await this.getJobStatus(jobId);
        
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollInterval);
          
          // Send simulated webhook
          const webhookUrl = `${baseUrl}/api/webhooks/vendor`;
          const payload = {
            jobId,
            status: job.status,
            result: job.result,
            error: job.error,
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

          console.log(`[MESHY] Sent webhook for job ${jobId}: ${job.status}`);
        }
      } catch (error) {
        console.error('[MESHY] Error in polling:', error);
        clearInterval(pollInterval);
      }
    }, 10000); // Poll every 10 seconds

    // Clear polling after 10 minutes to prevent infinite loops
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 10 * 60 * 1000);
  }

  private createWebhookSignature(payload: string): string {
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET || 'default-webhook-secret';
    return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  }
}