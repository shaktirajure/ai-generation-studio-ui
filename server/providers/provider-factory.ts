// Provider factory to create appropriate providers based on configuration

import { 
  ITextToImageProvider, 
  ITextTo3DProvider, 
  ITexturingProvider, 
  IImageToVideoProvider,
  ProviderConfig
} from "./types";
import { SimProvider } from "./sim-provider";

// Get provider configuration from environment
export function getProviderConfig(): ProviderConfig {
  return {
    text2image: process.env.PROVIDER_TEXT2IMAGE || "FLUX",
    text2mesh: process.env.PROVIDER_3D || "SIM",
    texturing: process.env.PROVIDER_TEXTURE || "SIM", 
    img2video: process.env.PROVIDER_VIDEO || "SIM",
  };
}

// Provider instances (singleton pattern)
let simProvider: SimProvider | null = null;

function getSimProvider(): SimProvider {
  if (!simProvider) {
    simProvider = new SimProvider();
  }
  return simProvider;
}

// Factory functions
export function createTextToImageProvider(): ITextToImageProvider {
  const config = getProviderConfig();
  
  switch (config.text2image) {
    case "FLUX":
    case "SIM":
    default:
      return getSimProvider();
  }
}

export function createTextTo3DProvider(): ITextTo3DProvider {
  const config = getProviderConfig();
  
  switch (config.text2mesh) {
    case "MESHY":
      // TODO: Implement Meshy provider when API keys are available
      console.log("MESHY provider not implemented yet, falling back to SIM");
      return getSimProvider();
    case "REPLICATE":
      // TODO: Implement Replicate provider when API keys are available
      console.log("REPLICATE provider not implemented yet, falling back to SIM");
      return getSimProvider();
    case "SIM":
    default:
      return getSimProvider();
  }
}

export function createTexturingProvider(): ITexturingProvider {
  const config = getProviderConfig();
  
  switch (config.texturing) {
    case "MESHY":
      // TODO: Implement Meshy provider when API keys are available
      console.log("MESHY provider not implemented yet, falling back to SIM");
      return getSimProvider();
    case "SIM":
    default:
      return getSimProvider();
  }
}

export function createImageToVideoProvider(): IImageToVideoProvider {
  const config = getProviderConfig();
  
  switch (config.img2video) {
    case "REPLICATE":
      // TODO: Implement Replicate provider when API keys are available
      console.log("REPLICATE provider not implemented yet, falling back to SIM");
      return getSimProvider();
    case "SIM":
    default:
      return getSimProvider();
  }
}

// Export all provider creation functions
export const ProviderFactory = {
  createTextToImageProvider,
  createTextTo3DProvider,
  createTexturingProvider,
  createImageToVideoProvider,
};