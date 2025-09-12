import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, Image, Box, PlayCircle, Database, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold">AI Content Generation Platform</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create stunning AI-generated content with our powerful suite of tools. 
          From images to 3D models to videos, bring your ideas to life.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <CardTitle>Generate Content</CardTitle>
            </div>
            <CardDescription>
              Create AI-powered content with text prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Transform your ideas into visual content using our advanced AI generation tools.
            </p>
            <Link href="/generate">
              <Button className="w-full" data-testid="button-go-generate">
                Start Generating
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              <CardTitle>Asset Library</CardTitle>
            </div>
            <CardDescription>
              Manage your generated content assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse, organize, and download all your previously generated content.
            </p>
            <Link href="/assets">
              <Button variant="outline" className="w-full" data-testid="button-go-assets">
                View Assets
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <CardTitle>API Playground</CardTitle>
            </div>
            <CardDescription>
              Test and explore our API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Experiment with our API directly from your browser with interactive tools.
            </p>
            <Link href="/playground">
              <Button variant="outline" className="w-full" data-testid="button-go-playground">
                Open Playground
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 rounded-lg p-8">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <Image className="w-8 h-8 mx-auto text-blue-600" />
            <h3 className="font-semibold">Text to Image</h3>
            <p className="text-sm text-muted-foreground">
              Generate high-quality images from text descriptions
            </p>
          </div>
          <div className="space-y-2">
            <Box className="w-8 h-8 mx-auto text-green-600" />
            <h3 className="font-semibold">Text to 3D</h3>
            <p className="text-sm text-muted-foreground">
              Create 3D models and assets from simple text prompts
            </p>
          </div>
          <div className="space-y-2">
            <PlayCircle className="w-8 h-8 mx-auto text-purple-600" />
            <h3 className="font-semibold">Image to Video</h3>
            <p className="text-sm text-muted-foreground">
              Transform static images into dynamic video content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}