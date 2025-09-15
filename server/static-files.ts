// Static file serving setup with proper MIME types
import express from 'express';
import path from 'path';
import mime from 'mime-types';

export function setupStaticFiles(app: express.Express): void {
  // Set custom MIME types for 3D model files
  mime.types['glb'] = 'model/gltf-binary';
  mime.types['gltf'] = 'model/gltf+json';
  mime.types['bin'] = 'application/octet-stream';
  mime.types['ktx2'] = 'image/ktx2';

  // Serve uploads directory with proper headers
  app.use('/uploads', (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    
    // Set appropriate Content-Type based on file extension
    switch (ext) {
      case '.glb':
        res.setHeader('Content-Type', 'model/gltf-binary');
        break;
      case '.gltf':
        res.setHeader('Content-Type', 'model/gltf+json');
        break;
      case '.bin':
        res.setHeader('Content-Type', 'application/octet-stream');
        break;
      case '.ktx2':
        res.setHeader('Content-Type', 'image/ktx2');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      default:
        // Let express handle other types
        break;
    }
    
    // Enable CORS for 3D model loading
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    next();
  }, express.static(path.join(process.cwd(), 'uploads')));

  console.log('[STATIC] Set up /uploads directory with proper MIME types');
}