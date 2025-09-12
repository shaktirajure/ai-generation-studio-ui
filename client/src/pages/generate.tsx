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

interface WebhookResponse {
  status: string;
  jobId: string;
  creditsRemaining?: number;
}

interface WebhookError {
  error: string;
  message: string;
}

interface JobStatus {
  id: string;
  status: "pending" | "done";
  jobType: string;
  inputText: string;
  userId: string;
  createdAt: string;
  resultUrl?: string;
}

export default function Generate() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      prompt: "",
      jobType: undefined,
    },
  });

  // Job status polling query
  const { data: jobStatus, isLoading: isPolling } = useQuery<JobStatus>({
    queryKey: ["/api/job", currentJobId],
    queryFn: async (): Promise<JobStatus> => {
      if (!currentJobId) throw new Error("No job ID");
      const response = await fetch(`/api/job/${currentJobId}`);
      if (!response.ok) throw new Error("Failed to fetch job status");
      return response.json();
    },
    enabled: !!currentJobId,
    refetchInterval: (query) => {
      // Stop polling when job is done
      return query.state.data?.status === "done" ? false : 2000;
    },
  });

  // Webhook submission mutation
  const submitJobMutation = useMutation({
    mutationFn: async (data: GenerateFormData): Promise<WebhookResponse> => {
      const response = await apiRequest("POST", "/webhook", {
        jobType: data.jobType,
        inputText: data.prompt,
        // userId is now handled server-side for security
      });
      
      // Handle credit errors
      if (response.status === 402) {
        const errorData: WebhookError = await response.json();
        throw new Error(errorData.message || "Insufficient credits");
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit job");
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      setCurrentJobId(response.jobId);
      
      // Refresh credits in navbar
      queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
      
      toast({
        title: "Job submitted!",
        description: `Your generation request has been submitted. ${
          response.creditsRemaining !== undefined 
            ? `${response.creditsRemaining} credits remaining.`
            : ""
        }`,
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit job. Please try again.";
      
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
      console.error("Webhook submission error:", error);
    },
  });

  const onSubmit = (data: GenerateFormData) => {
    submitJobMutation.mutate(data);
  };

  const resetForm = () => {
    setCurrentJobId(null);
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
                      disabled={submitJobMutation.isPending || isPolling}
                      className="flex-1"
                      data-testid="button-generate"
                    >
                      {submitJobMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Generate"
                      )}
                    </Button>
                    
                    {currentJobId && (
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
              {!currentJobId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Submit a generation request to see status</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Job Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Job ID:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded" data-testid="text-job-id">
                        {currentJobId.slice(0, 8)}...
                      </code>
                    </div>
                    
                    {jobStatus && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Type:</span>
                          <span className="text-sm capitalize" data-testid="text-job-type">
                            {jobStatus.jobType.replace("-", " ")}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Status:</span>
                          <div className="flex items-center gap-2">
                            {jobStatus.status === "pending" && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            )}
                            <span 
                              className={`text-sm font-medium capitalize ${
                                jobStatus.status === "done" ? "text-green-600" : "text-blue-600"
                              }`}
                              data-testid="text-job-status"
                            >
                              {jobStatus.status}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Processing Message */}
                  {isPolling && jobStatus && (jobStatus as JobStatus).status === "pending" && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">
                          Processing your request...
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        This usually takes a few moments
                      </p>
                    </div>
                  )}

                  {/* Completed Result */}
                  {jobStatus?.status === "done" && jobStatus.resultUrl && (
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border space-y-3">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">Generation Complete!</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Your content has been generated successfully
                        </p>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => window.open(jobStatus.resultUrl, '_blank')}
                            data-testid="button-view-result"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Result
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = jobStatus.resultUrl!;
                              link.download = `generated-${jobStatus.jobType}-${jobStatus.id.slice(0, 8)}.png`;
                              link.click();
                            }}
                            data-testid="button-download-result"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                          <p className="text-xs text-muted-foreground break-all" data-testid="text-result-url">
                            {jobStatus.resultUrl}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}