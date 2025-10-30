import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

export default function Messages() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Communicate with customers and contractors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              Select a conversation to view messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Input placeholder="Search conversations..." />
            </div>
            <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Conversations will appear here when messages are exchanged
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Select a conversation to start messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-96 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Messaging interface coming soon
                </p>
                <p className="text-sm text-muted-foreground">
                  This will show real-time messaging between contractors and customers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Feature Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Database Schema</span>
            <Badge variant="default">Complete</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>API Endpoints</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Frontend UI</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Real-time Updates</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Message Notifications</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



