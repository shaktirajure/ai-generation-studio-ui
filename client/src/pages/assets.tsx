import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Download, Eye, Calendar, Image, Box, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface CompletedJob {
  id: string;
  status: "done";
  jobType: string;
  inputText: string;
  userId: string;
  createdAt: string;
  resultUrl: string;
}

function getJobTypeIcon(jobType: string) {
  switch (jobType) {
    case "text-to-image":
      return <Image className="w-4 h-4" />;
    case "text-to-3D":
      return <Box className="w-4 h-4" />;
    case "image-to-video":
      return <PlayCircle className="w-4 h-4" />;
    default:
      return <Image className="w-4 h-4" />;
  }
}

function getJobTypeColor(jobType: string) {
  switch (jobType) {
    case "text-to-image":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "text-to-3D":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "image-to-video":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

function AssetPlaceholder({ jobType }: { jobType: string }) {
  const baseClasses = "aspect-video rounded-lg flex items-center justify-center text-white font-medium text-lg";
  
  switch (jobType) {
    case "text-to-image":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-blue-400 to-blue-600`}>
          <div className="flex flex-col items-center gap-2">
            <Image className="w-8 h-8" />
            <span className="text-sm">Image</span>
          </div>
        </div>
      );
    case "text-to-3D":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-green-400 to-green-600`}>
          <div className="flex flex-col items-center gap-2">
            <Box className="w-8 h-8" />
            <span className="text-sm">3D Model</span>
          </div>
        </div>
      );
    case "image-to-video":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-purple-400 to-purple-600`}>
          <div className="flex flex-col items-center gap-2">
            <PlayCircle className="w-8 h-8" />
            <span className="text-sm">Video</span>
          </div>
        </div>
      );
    default:
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-gray-400 to-gray-600`}>
          <div className="flex flex-col items-center gap-2">
            <Image className="w-8 h-8" />
            <span className="text-sm">Asset</span>
          </div>
        </div>
      );
  }
}

export default function Assets() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: completedJobs = [], isLoading, error } = useQuery<CompletedJob[]>({
    queryKey: ["/api/assets"],
    refetchInterval: 30000, // Refresh every 30 seconds to pick up new completed jobs
  });

  const filteredJobs = completedJobs.filter(job =>
    job.inputText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.jobType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Asset Library</h1>
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-300">
              Failed to load assets. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Asset Library</h1>
            <p className="text-muted-foreground">
              Browse and manage your generated content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search assets..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-assets"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-5 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-muted rounded flex-1"></div>
                      <div className="h-8 bg-muted rounded flex-1"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {searchTerm ? "No matching assets found" : "No Assets Yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No assets match "${searchTerm}". Try a different search term.`
                  : "Your generated content will appear here once you start creating with our AI tools."
                }
              </p>
              {!searchTerm && (
                <Link href="/generate">
                  <Button className="mt-4" data-testid="button-create-first-asset">
                    Generate Your First Asset
                  </Button>
                </Link>
              )}
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setSearchTerm("")}
                  data-testid="button-clear-search"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="group hover:shadow-lg transition-shadow" data-testid={`asset-card-${job.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge 
                      className={`flex items-center gap-1 ${getJobTypeColor(job.jobType)}`}
                      data-testid={`badge-job-type-${job.jobType}`}
                    >
                      {getJobTypeIcon(job.jobType)}
                      {job.jobType.replace("-", " ")}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span data-testid={`date-${job.id}`}>
                        {format(new Date(job.createdAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AssetPlaceholder jobType={job.jobType} />
                  <div className="space-y-2 mt-3">
                    <h4 className="font-medium line-clamp-2 text-sm" data-testid={`prompt-${job.id}`}>
                      {job.inputText}
                    </h4>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.open(job.resultUrl, '_blank')}
                        data-testid={`button-view-${job.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = job.resultUrl;
                          link.download = `${job.jobType}-${job.id.slice(0, 8)}.png`;
                          link.click();
                        }}
                        data-testid={`button-download-${job.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredJobs.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {filteredJobs.length} of {completedJobs.length} completed jobs
          </div>
        )}
      </div>
    </div>
  );
}