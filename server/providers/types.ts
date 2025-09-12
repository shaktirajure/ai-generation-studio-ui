// Provider interfaces for AI studio tools

export interface ProviderJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  result?: {
    assetUrls: string[];
    meta?: Record<string, any>;
  };
  error?: string;
}

export interface TextToImageRequest {
  prompt: string;
  options?: {
    width?: number;
    height?: number;
    steps?: number;
  };
}

export interface TextTo3DRequest {
  prompt: string;
  options?: {
    style?: string;
    quality?: "draft" | "standard" | "high";
  };
}

export interface TexturingRequest {
  modelUrl: string; // URL to uploaded .glb file
  prompt: string;
  options?: {
    resolution?: number;
    style?: string;
  };
}

export interface ImageToVideoRequest {
  imageUrl?: string;
  prompt?: string;
  options?: {
    duration?: number;
    fps?: number;
  };
}

export interface ITextToImageProvider {
  generateImage(request: TextToImageRequest): Promise<ProviderJob>;
  getJobStatus(jobId: string): Promise<ProviderJob>;
}

export interface ITextTo3DProvider {
  generateMesh(request: TextTo3DRequest): Promise<ProviderJob>;
  getJobStatus(jobId: string): Promise<ProviderJob>;
}

export interface ITexturingProvider {
  generateTextures(request: TexturingRequest): Promise<ProviderJob>;
  getJobStatus(jobId: string): Promise<ProviderJob>;
}

export interface IImageToVideoProvider {
  generateVideo(request: ImageToVideoRequest): Promise<ProviderJob>;
  getJobStatus(jobId: string): Promise<ProviderJob>;
}

export interface ProviderConfig {
  text2image: string; // "FLUX" | "SIM"
  text2mesh: string; // "MESHY" | "REPLICATE" | "SIM"
  texturing: string; // "MESHY" | "SIM"
  img2video: string; // "REPLICATE" | "SIM"
}