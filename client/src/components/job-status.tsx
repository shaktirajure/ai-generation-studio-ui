import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  ExternalLink,
  Eye,
  RotateCcw
} from "lucide-react";
import "@google/model-viewer";

// Declare model-viewer for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface JobStatusProps {
  jobId: string | null;
  onClose: () => void;
}

export function JobStatus({ jobId, onClose }: JobStatusProps) {
  const [progress, setProgress] = useState(0);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) throw new Error("Failed to fetch job");
      return response.json();
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Stop polling when job is completed or failed
      if (!data) return 2000;
      return data.status === "completed" || data.status === "failed" ? false : 2000;
    }
  });

  // Simulate progress for visual feedback
  useEffect(() => {
    if (!job) return;
    
    if (job.status === "queued") {
      setProgress(10);
    } else if (job.status === "processing") {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 10, 85));
      }, 1000);
      return () => clearInterval(interval);
    } else if (job.status === "completed") {
      setProgress(100);
    } else if (job.status === "failed") {
      setProgress(0);
    }
  }, [job?.status]);

  if (!jobId) return null;

  if (isLoading) {
    return (
      <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
        <CardContent className="p-6">
          <div className="text-center text-white">Loading job status...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
        <CardContent className="p-6">
          <div className="text-center text-red-400">Failed to load job status</div>
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="mt-4 w-full"
            data-testid="button-close-error"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!job) return null;

  const getStatusIcon = () => {
    switch (job.status) {
      case "queued":
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case "processing":
        return <RotateCcw className="h-5 w-5 text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "queued":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/20";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/20";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/20";
    }
  };

  const renderAssetPreview = () => {
    if (!job.assetUrls || !Array.isArray(job.assetUrls) || job.assetUrls.length === 0) {
      return null;
    }

    const firstAsset = job.assetUrls[0];

    // Handle different asset types based on tool
    if (job.tool === "text2image") {
      return (
        <div className="mt-4">
          <img 
            src={firstAsset} 
            alt="Generated image" 
            className="w-full h-48 object-contain rounded-lg bg-black/20"
            data-testid="generated-image"
          />
        </div>
      );
    }

    if (job.tool === "text2mesh") {
      return (
        <div className="mt-4 space-y-4">
          <div className="text-white/60 mb-2">
            {job.previewImage ? "3D Model + Image Preview Generated" : "3D Model Generated"}
          </div>
          
          {/* Image Preview */}
          {job.previewImage && (
            <div>
              <div className="text-white/40 text-sm mb-2">Image Preview:</div>
              <div className="h-48 bg-black/20 rounded-lg overflow-hidden">
                <img 
                  src={job.previewImage}
                  alt={`Preview of ${job.prompt}`}
                  className="w-full h-full object-cover"
                  data-testid="preview-image"
                />
              </div>
            </div>
          )}
          
          {/* 3D Model */}
          <div>
            <div className="text-white/40 text-sm mb-2">3D Model:</div>
            <div className="h-64 bg-black/20 rounded-lg relative overflow-hidden flex items-center justify-center">
              {firstAsset ? (
                <model-viewer
                  src={firstAsset}
                  alt="Generated 3D model"
                  auto-rotate
                  camera-controls
                  disable-zoom
                  ar="false"
                  xr-environment="false"
                  loading="lazy"
                  reveal="interaction"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent'
                  }}
                  data-testid="model-viewer"
                  onError={(e: any) => {
                    console.warn('Model viewer error (suppressed):', e);
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (e && e.preventDefault) e.preventDefault();
                    return false;
                  }}
                />
              ) : (
                <div className="text-white/40 text-sm">
                  Loading 3D model...
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (job.tool === "texturing") {
      return (
        <div className="mt-4">
          <div className="text-white/60 mb-2">Generated PBR Maps:</div>
          <div className="grid grid-cols-2 gap-2">
            {job.assetUrls.map((url: string, index: number) => (
              <div key={index} className="text-center">
                <img 
                  src={url} 
                  alt={`Texture map ${index + 1}`} 
                  className="w-full h-20 object-cover rounded bg-black/20"
                  data-testid={`texture-map-${index}`}
                />
                <div className="text-xs text-white/40 mt-1">
                  {index === 0 ? "Albedo" : index === 1 ? "Normal" : "Metallic/Roughness"}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (job.tool === "img2video") {
      return (
        <div className="mt-4">
          <video 
            src={firstAsset} 
            controls 
            className="w-full h-48 rounded-lg bg-black/20"
            data-testid="generated-video"
          >
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="text-white">Job Status</div>
              <div className="text-sm text-white/60 font-normal">
                {job.tool.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
              </div>
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar for active jobs */}
        {(job.status === "queued" || job.status === "processing") && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/60">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Job details */}
        <div className="space-y-2">
          <div className="text-sm text-white/60">Prompt:</div>
          <div className="text-white bg-white/5 p-3 rounded-lg text-sm">
            {job.prompt}
          </div>
        </div>

        {/* Credits used */}
        <div className="text-sm text-white/60">
          Credits used: <span className="text-white font-medium">{job.creditsUsed}</span>
        </div>

        {/* Error message for failed jobs */}
        {job.status === "failed" && job.meta?.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-red-400 text-sm">
              <strong>Error:</strong> {job.meta.error}
            </div>
          </div>
        )}

        {/* Asset preview for completed jobs */}
        {job.status === "completed" && renderAssetPreview()}

        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          {job.status === "completed" && job.assetUrls && job.assetUrls.length > 0 && (
            <>
              {job.tool === "text2mesh" ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // Scroll to the 3D model preview
                    const modelViewer = document.querySelector('[data-testid="model-viewer"]');
                    if (modelViewer) {
                      modelViewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  data-testid="button-view-3d"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View 3D
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(job.assetUrls[0], '_blank')}
                  data-testid="button-view-asset"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `/api/assets/${job.id}/download`;
                  link.download = `generated-${job.tool}-${job.id}`;
                  link.click();
                }}
                data-testid="button-download"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
          <Button 
            onClick={onClose} 
            variant="outline"
            data-testid="button-close"
          >
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}