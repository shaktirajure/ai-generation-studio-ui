// File service for downloading and storing 3D models locally
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export class FileService {
  private static readonly UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  
  // Ensure uploads directory exists
  static async ensureUploadsDir(): Promise<void> {
    try {
      await fs.access(this.UPLOADS_DIR);
    } catch {
      await fs.mkdir(this.UPLOADS_DIR, { recursive: true });
    }
  }

  // Download file from URL and save locally
  static async downloadAndStore(url: string, jobId: string, extension?: string): Promise<string> {
    await this.ensureUploadsDir();
    
    // Auto-detect extension from URL if not provided
    if (!extension) {
      const urlPath = new URL(url).pathname;
      extension = path.extname(urlPath) || '.glb';
    }
    
    const filename = `${jobId}${extension}`;
    const filePath = path.join(this.UPLOADS_DIR, filename);
    
    try {
      console.log(`[FILE] Downloading ${url} to ${filePath}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      // Convert fetch ReadableStream to Node.js Readable
      const readable = Readable.fromWeb(response.body);
      const writeStream = (await import('fs')).createWriteStream(filePath);
      
      await pipeline(readable, writeStream);
      
      console.log(`[FILE] Successfully downloaded and saved: ${filePath}`);
      return `/uploads/${filename}`;
      
    } catch (error) {
      console.error(`[FILE] Failed to download ${url}:`, error);
      throw new Error(`File download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file path for job ID
  static getJobFilePath(jobId: string, extension: string = '.glb'): string {
    return `/uploads/${jobId}${extension}`;
  }

  // Check if file exists locally
  static async fileExists(jobId: string, extension: string = '.glb'): Promise<boolean> {
    const filePath = path.join(this.UPLOADS_DIR, `${jobId}${extension}`);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Get file size
  static async getFileSize(jobId: string, extension: string = '.glb'): Promise<number | null> {
    const filePath = path.join(this.UPLOADS_DIR, `${jobId}${extension}`);
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return null;
    }
  }

  // Clean up old files (optional maintenance function)
  static async cleanupOldFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.ensureUploadsDir();
    
    try {
      const files = await fs.readdir(this.UPLOADS_DIR);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.UPLOADS_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`[FILE] Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('[FILE] Error during cleanup:', error);
    }
  }
}