import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudioTabs } from "@/components/studio-tabs";
import { JobStatus } from "@/components/job-status";

export default function Generate() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Get user credits
  const { data: creditsData } = useQuery({
    queryKey: ["/api/credits"],
    queryFn: async () => {
      const response = await fetch("/api/credits");
      if (!response.ok) throw new Error("Failed to fetch credits");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const userCredits = creditsData?.credits || 0;

  const handleJobCreated = (jobId: string) => {
    setActiveJobId(jobId);
  };

  const handleCloseJobStatus = () => {
    setActiveJobId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Generation Studio
              </div>
              <div className="text-sm text-white/60 mt-2">
                Create images, 3D models, textures, and videos with AI
              </div>
              <div className="flex justify-center items-center gap-2 mt-4">
                <div className="text-white/80">Credits:</div>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full font-medium">
                  {userCredits}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Studio Tabs */}
          <div className="lg:col-span-2">
            <StudioTabs 
              userCredits={userCredits} 
              onJobCreated={handleJobCreated}
            />
          </div>

          {/* Right Column - Job Status */}
          <div className="lg:col-span-1">
            {activeJobId ? (
              <JobStatus 
                jobId={activeJobId} 
                onClose={handleCloseJobStatus}
              />
            ) : (
              <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-center">
                    Job Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-white/60 py-12">
                  <div className="text-4xl mb-4">🎯</div>
                  <div>Start a generation to see status here</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-blue-400 font-medium">🖼️ Text to Image</div>
                <div className="text-white/60">Generate high-quality images from text prompts using FLUX.1 model</div>
                <div className="text-xs text-white/40">Cost: 1 credit</div>
              </div>
              <div className="space-y-2">
                <div className="text-purple-400 font-medium">🎲 Text to 3D</div>
                <div className="text-white/60">Create 3D models from text descriptions</div>
                <div className="text-xs text-white/40">Cost: 5 credits</div>
              </div>
              <div className="space-y-2">
                <div className="text-green-400 font-medium">🎨 AI Texturing</div>
                <div className="text-white/60">Generate PBR textures for your 3D models</div>
                <div className="text-xs text-white/40">Cost: 3 credits</div>
              </div>
              <div className="space-y-2">
                <div className="text-yellow-400 font-medium">🎬 Image to Video</div>
                <div className="text-white/60">Transform static images into dynamic videos</div>
                <div className="text-xs text-white/40">Cost: 4 credits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}