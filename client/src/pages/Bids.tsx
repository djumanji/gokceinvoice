import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

export default function Bids() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bids Management</h1>
        <p className="text-muted-foreground">Manage contractor bids and response windows</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Bids</TabsTrigger>
          <TabsTrigger value="history">Bid History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Response Windows</CardTitle>
              <CardDescription>
                Bids that are waiting for contractor response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/25">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Active bids interface coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will show bids with active response windows that need contractor attention
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bid History</CardTitle>
              <CardDescription>
                View all past bids and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/25">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Bid history interface coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will show all contractor bids with status, rank, and conversion data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <span>Bid Placement Flow</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Response Window Management</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



