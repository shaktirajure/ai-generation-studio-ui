import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Send, Globe } from "lucide-react";

export default function Playground() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Playground</h1>
          <p className="text-muted-foreground">
            Test and explore our API endpoints interactively
          </p>
        </div>

        <Tabs defaultValue="webhook" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="webhook" data-testid="tab-webhook">Webhook</TabsTrigger>
            <TabsTrigger value="status" data-testid="tab-status">Job Status</TabsTrigger>
          </TabsList>

          <TabsContent value="webhook" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      POST /webhook
                    </CardTitle>
                    <CardDescription>
                      Submit a new AI generation job
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Example Request</h4>
                  <pre className="text-sm text-muted-foreground">
{`curl -X POST http://localhost:5000/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "jobType": "text-to-image",
    "inputText": "A beautiful sunset over mountains",
    "userId": "user123"
  }'`}
                  </pre>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Example Response</h4>
                  <pre className="text-sm text-muted-foreground">
{`{
  "status": "received",
  "jobId": "3910179b-4678-47c1-86e6-e66a4a1bdc4a"
}`}
                  </pre>
                </div>
                <Button className="w-full" data-testid="button-try-webhook">
                  <Code className="w-4 h-4 mr-2" />
                  Try it out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      GET /api/job/:jobId
                    </CardTitle>
                    <CardDescription>
                      Check the status of a generation job
                    </CardDescription>
                  </div>
                  <Badge variant="outline">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Example Request</h4>
                  <pre className="text-sm text-muted-foreground">
{`curl -X GET http://localhost:5000/api/job/3910179b-4678-47c1-86e6-e66a4a1bdc4a`}
                  </pre>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Example Response (Pending)</h4>
                  <pre className="text-sm text-muted-foreground">
{`{
  "id": "3910179b-4678-47c1-86e6-e66a4a1bdc4a",
  "status": "pending",
  "jobType": "text-to-image",
  "inputText": "A beautiful sunset over mountains",
  "userId": "user123",
  "createdAt": "2025-09-12T03:54:39.611Z"
}`}
                  </pre>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Example Response (Complete)</h4>
                  <pre className="text-sm text-muted-foreground">
{`{
  "id": "3910179b-4678-47c1-86e6-e66a4a1bdc4a",
  "status": "done",
  "jobType": "text-to-image",
  "inputText": "A beautiful sunset over mountains",
  "userId": "user123",
  "createdAt": "2025-09-12T03:54:39.611Z",
  "resultUrl": "https://example.com/generated-content.png"
}`}
                  </pre>
                </div>
                <Button className="w-full" data-testid="button-try-status">
                  <Code className="w-4 h-4 mr-2" />
                  Try it out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limits & Usage</CardTitle>
            <CardDescription>
              Important information about API usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Rate Limit:</strong> 100 requests per minute per user</p>
              <p><strong>Job Processing:</strong> Typical processing time is 5-30 seconds</p>
              <p><strong>File Retention:</strong> Generated assets are stored for 30 days</p>
              <p><strong>Supported Formats:</strong> PNG, JPG, MP4, GLB, OBJ</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}