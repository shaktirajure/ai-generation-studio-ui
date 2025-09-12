import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Wand2, Palette, Video, Image, Cpu, Layers } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const toolCosts = {
  "text2image": 1,
  "text2mesh": 5,
  "texturing": 3,
  "img2video": 4,
} as const;

const toolInfo = {
  "text2image": {
    icon: Image,
    title: "Text to Image",
    description: "Generate high-quality images from text prompts using FLUX.1",
    category: "Image Generation"
  },
  "text2mesh": {
    icon: Cpu,
    title: "Text to 3D",
    description: "Create 3D models from text descriptions",
    category: "3D Generation"
  },
  "texturing": {
    icon: Layers,
    title: "AI Texturing",
    description: "Generate PBR textures for your 3D models",
    category: "3D Texturing"
  },
  "img2video": {
    icon: Video,
    title: "Image to Video",
    description: "Transform images into dynamic videos",
    category: "Video Generation"
  }
};

interface StudioTabsProps {
  userCredits: number;
  onJobCreated: (jobId: string) => void;
}

export function StudioTabs({ userCredits, onJobCreated }: StudioTabsProps) {
  const [activeTab, setActiveTab] = useState("text2image");
  const [prompts, setPrompts] = useState({
    text2image: "",
    text2mesh: "",
    texturing: "",
    img2video: ""
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    texturing: null,
    img2video: null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async ({ tool, prompt, inputs }: { tool: string; prompt: string; inputs?: any }) => {
      const response = await fetch(`/api/jobs`, {
        method: "POST",
        body: JSON.stringify({ tool, prompt, inputs }),
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create job');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.job) {
        onJobCreated(data.job.id);
        toast({
          title: "Job created successfully!",
          description: `Started ${toolInfo[data.job.tool as keyof typeof toolInfo].title} generation`
        });
        // Clear the prompt after successful submission
        setPrompts(prev => ({
          ...prev,
          [data.job.tool]: ""
        }));
        // Invalidate credits cache
        queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create job",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (tool: keyof typeof toolCosts) => {
    const prompt = prompts[tool];
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt before generating",
        variant: "destructive"
      });
      return;
    }

    const cost = toolCosts[tool];
    if (userCredits < cost) {
      toast({
        title: "Insufficient credits",
        description: `You need ${cost} credits but only have ${userCredits}`,
        variant: "destructive"
      });
      return;
    }

    let inputs = {};

    // Handle file uploads for texturing and img2video
    if (tool === "texturing" && uploadedFiles.texturing) {
      // For demo purposes, we'll use a placeholder URL
      // In a real implementation, you'd upload the file first
      inputs = {
        modelUrl: "https://example.com/uploaded-model.glb",
        options: { resolution: 1024 }
      };
    } else if (tool === "img2video" && uploadedFiles.img2video) {
      // For demo purposes, we'll use a placeholder URL
      inputs = {
        imageUrl: "https://example.com/uploaded-image.jpg",
        options: { duration: 5, fps: 24 }
      };
    }

    createJobMutation.mutate({ tool, prompt, inputs });
  };

  const handleFileUpload = (tool: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [tool]: file
      }));
    }
  };

  const canAfford = (tool: keyof typeof toolCosts) => userCredits >= toolCosts[tool];
  const isLoading = createJobMutation.isPending;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/20 backdrop-blur-sm border border-white/10">
          {Object.entries(toolInfo).map(([key, info]) => {
            const Icon = info.icon;
            const cost = toolCosts[key as keyof typeof toolCosts];
            const affordable = canAfford(key as keyof typeof toolCosts);
            
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-white/10"
                data-testid={`tab-${key}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{info.title}</span>
                <Badge 
                  variant={affordable ? "secondary" : "destructive"} 
                  className="text-xs"
                >
                  {cost} credits
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(toolInfo).map(([key, info]) => {
          const tool = key as keyof typeof toolCosts;
          const Icon = info.icon;
          const cost = toolCosts[tool];
          const affordable = canAfford(tool);
          const needsFileUpload = tool === "texturing" || tool === "img2video";

          return (
            <TabsContent key={key} value={key} className="mt-6">
              <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-blue-400" />
                    <div>
                      <div className="text-xl text-white">{info.title}</div>
                      <div className="text-sm text-white/60 font-normal">{info.description}</div>
                    </div>
                    <Badge 
                      variant={affordable ? "secondary" : "destructive"}
                      className="ml-auto"
                    >
                      {cost} credits
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File upload for texturing and img2video */}
                  {needsFileUpload && (
                    <div className="space-y-2">
                      <Label className="text-white">
                        {tool === "texturing" ? "Upload 3D Model (.glb)" : "Upload Image"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept={tool === "texturing" ? ".glb,.gltf" : "image/*"}
                          onChange={(e) => handleFileUpload(tool, e)}
                          className="bg-white/5 border-white/10 text-white file:bg-blue-600 file:text-white file:border-0"
                          data-testid={`input-file-${tool}`}
                        />
                        <Upload className="h-4 w-4 text-white/60" />
                      </div>
                      {uploadedFiles[tool] && (
                        <p className="text-sm text-green-400">
                          ✓ {uploadedFiles[tool]!.name} uploaded
                        </p>
                      )}
                    </div>
                  )}

                  {/* Prompt input */}
                  <div className="space-y-2">
                    <Label htmlFor={`prompt-${tool}`} className="text-white">
                      {tool === "texturing" ? "Texture Description" : "Prompt"}
                    </Label>
                    <Textarea
                      id={`prompt-${tool}`}
                      placeholder={
                        tool === "text2image" ? "A beautiful sunset over a mountain range..." :
                        tool === "text2mesh" ? "A futuristic robot with glowing eyes..." :
                        tool === "texturing" ? "Rusty metal with scratches and wear..." :
                        "Describe the motion or scene you want..."
                      }
                      value={prompts[tool]}
                      onChange={(e) => setPrompts(prev => ({ ...prev, [tool]: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                      data-testid={`input-prompt-${tool}`}
                    />
                  </div>

                  {/* Additional options for some tools */}
                  {tool === "img2video" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Duration (seconds)</Label>
                        <Input
                          type="number"
                          defaultValue={5}
                          min={1}
                          max={10}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-duration"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Frame Rate (FPS)</Label>
                        <Input
                          type="number"
                          defaultValue={24}
                          min={12}
                          max={60}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-fps"
                        />
                      </div>
                    </div>
                  )}

                  {/* Generate button */}
                  <Button
                    onClick={() => handleSubmit(tool)}
                    disabled={!affordable || isLoading || !prompts[tool].trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                    data-testid={`button-generate-${tool}`}
                  >
                    {isLoading ? (
                      <>
                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate {info.title}
                      </>
                    )}
                  </Button>

                  {!affordable && (
                    <p className="text-sm text-red-400 text-center">
                      You need {cost - userCredits} more credits to use this tool
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}