import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Download, Eye, AlertCircle } from "lucide-react";

const generateFormSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  jobType: z.enum(["text-to-image", "text-to-3D", "image-to-video"], {
    required_error: "Please select a job type",
  }),
});

type GenerateFormData = z.infer<typeof generateFormSchema>;

interface GenerateResponse {
  success: boolean;
  asset: {
    id: string;
    prompt: string;
    url: string;
    jobType: string;
    createdAt: string;
  };
  creditsRemaining: number;
}

interface GenerateError {
  error: string;
  message?: string;
}

export default function Generate() {
  const [generatedAsset, setGeneratedAsset] = useState<GenerateResponse['asset'] | null>(null);
  const { toast } = useToast();

  const form = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      prompt: "",
      jobType: undefined,
    },
  });

  // Remove job polling as we now get immediate results

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async (data: GenerateFormData): Promise<GenerateResponse> => {
      const response = await apiRequest("POST", "/api/generate", {
        prompt: data.prompt,
        jobType: data.jobType,
      });
      
      // Handle credit errors
      if (response.status === 402) {
        const errorData: GenerateError = await response.json();
        throw new Error(errorData.message || "Insufficient credits");
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate content");
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      setGeneratedAsset(response.asset);
      
      // Refresh credits in navbar
      queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
      
      // Refresh assets page
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      
      toast({
        title: "Generation Complete!",
        description: `Your content has been generated successfully. ${response.creditsRemaining} credits remaining.`,
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content. Please try again.";
      
      // Show specific error for insufficient credits
      if (errorMessage.includes("credit")) {
        toast({
          title: "Insufficient Credits",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      console.error("Generation error:", error);
    },
  });

  const onSubmit = (data: GenerateFormData) => {
    generateMutation.mutate(data);
  };

  const resetForm = () => {
    setGeneratedAsset(null);
    form.reset();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AI Generation Studio</h1>
          <p className="text-muted-foreground">
            Create amazing content with AI - from images to 3D models to videos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Content</CardTitle>
              <CardDescription>
                Enter your prompt and select the type of content you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what you want to generate..."
                            className="min-h-[100px]"
                            data-testid="input-prompt"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generation Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-job-type">
                              <SelectValue placeholder="Select generation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text-to-image" data-testid="option-text-to-image">
                              Text to Image
                            </SelectItem>
                            <SelectItem value="text-to-3D" data-testid="option-text-to-3d">
                              Text to 3D Model
                            </SelectItem>
                            <SelectItem value="image-to-video" data-testid="option-image-to-video">
                              Image to Video
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={generateMutation.isPending}
                      className="flex-1"
                      data-testid="button-generate"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate"
                      )}
                    </Button>
                    
                    {generatedAsset && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        data-testid="button-reset"
                      >
                        New Generation
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Status and Results */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Status</CardTitle>
              <CardDescription>
                Track your generation progress and view results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!generatedAsset ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Submit a generation request to see your result</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Asset Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Asset ID:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded" data-testid="text-asset-id">
                        {generatedAsset.id.slice(0, 8)}...
                      </code>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm capitalize" data-testid="text-asset-type">
                        {generatedAsset.jobType.replace("-", " ")}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm" data-testid="text-asset-created">
                        {new Date(generatedAsset.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Generated Result */}
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">Generation Complete!</span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Image Preview */}
                      <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border">
                        <img
                          src={generatedAsset.url}
                          alt={generatedAsset.prompt}
                          className="w-full h-48 object-cover"
                          data-testid="img-generated-result"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LXNpemU9IjE0Ij5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==";
                          }}
                        />
                      </div>
                      
                      {/* Prompt Display */}
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Prompt:</p>
                        <p className="text-sm" data-testid="text-asset-prompt">
                          {generatedAsset.prompt}
                        </p>
                      </div>
                      
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Your content has been generated and saved to your assets
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => window.open(generatedAsset.url, '_blank')}
                          data-testid="button-view-result"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Size
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `/api/assets/${generatedAsset.id}/download`;
                          }}
                          data-testid="button-download-result"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}