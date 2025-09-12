// Using Hugging Face free inference API for image generation
// No API key required for basic usage, but we can use one for higher rate limits if available

export interface GenerationResult {
  url: string;
  success: boolean;
  error?: string;
}

export class AIService {
  /**
   * Generate an image from text using Hugging Face FLUX.1 (FREE)
   */
  static async generateTextToImage(prompt: string): Promise<GenerationResult> {
    try {
      console.log("[HF DEBUG] Generating image with FLUX.1 for prompt:", prompt);
      
      // Use Hugging Face's free FLUX model inference API - FLUX.1 is the new leading open-source model in 2025
      const response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
          headers: {
            "Content-Type": "application/json",
            // Optional: Add HF token for higher rate limits if available
            ...(process.env.HUGGINGFACE_TOKEN && { 
              "Authorization": `Bearer ${process.env.HUGGINGFACE_TOKEN}` 
            }),
          },
          method: "POST",
          body: JSON.stringify({
            inputs: prompt,
            options: { wait_for_model: true }
          }),
        }
      );

      console.log("[HF DEBUG] Response status:", response.status);
      console.log("[HF DEBUG] Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        if (response.status === 503) {
          return {
            url: "",
            success: false,
            error: "The AI model is loading. Please try again in a few seconds."
          };
        }
        
        const errorText = await response.text();
        console.error("[HF DEBUG] Full API error response:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
        });
        return {
          url: "",
          success: false,
          error: `Image generation failed: ${response.status} ${errorText || 'Server error'}`
        };
      }

      // Get the image data as blob
      const imageBlob = await response.blob();
      
      // Convert blob to base64 data URL for immediate use
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      console.log("[HF DEBUG] Successfully generated image, size:", buffer.length, "bytes");
      return {
        url: dataUrl,
        success: true
      };
    } catch (error: any) {
      console.error("Error generating image with Hugging Face:", error);
      
      // Handle network and other errors
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          url: "",
          success: false,
          error: "Request timed out. Please try again with a shorter prompt."
        };
      }
      
      return {
        url: "",
        success: false,
        error: `Image generation failed: ${error.message || 'Unknown error occurred'}`
      };
    }
  }

  /**
   * Generate a 3D model from text (placeholder implementation)
   * Note: OpenAI doesn't provide 3D generation, so this is a placeholder
   */
  static async generateTextTo3D(prompt: string): Promise<GenerationResult> {
    console.log("3D generation requested for prompt:", prompt);
    
    // For now, return an informative error since we don't have a 3D API
    return {
      url: "",
      success: false,
      error: "3D model generation is not currently available. This feature requires a specialized 3D AI service which is not yet integrated. Please use text-to-image generation instead."
    };
  }

  /**
   * Generate video from image (placeholder implementation)
   */
  static async generateImageToVideo(prompt: string): Promise<GenerationResult> {
    console.log("Video generation requested for prompt:", prompt);
    
    // Placeholder for future video generation capability
    return {
      url: "",
      success: false,
      error: "Video generation is not currently available. This feature requires a specialized video AI service which is not yet integrated. Please use text-to-image generation instead."
    };
  }
}