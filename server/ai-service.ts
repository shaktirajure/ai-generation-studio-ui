import OpenAI from "openai";

// Using the javascript_openai integration
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GenerationResult {
  url: string;
  success: boolean;
  error?: string;
}

export class AIService {
  /**
   * Generate an image from text using DALL-E 3
   */
  static async generateTextToImage(prompt: string): Promise<GenerationResult> {
    try {
      console.log("Generating image with DALL-E 3 for prompt:", prompt);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("No image data returned from DALL-E");
      }

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL returned from DALL-E");
      }

      console.log("Successfully generated image:", imageUrl);
      return {
        url: imageUrl,
        success: true
      };
    } catch (error: any) {
      console.error("Error generating image with DALL-E:", error);
      
      // Handle specific OpenAI errors
      if (error.code === 'content_policy_violation') {
        return {
          url: "",
          success: false,
          error: "Content policy violation: The prompt contains content that violates OpenAI's usage policies. Please try a different prompt."
        };
      }
      
      if (error.code === 'rate_limit_exceeded') {
        return {
          url: "",
          success: false,
          error: "Rate limit exceeded: Too many requests. Please try again in a moment."
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