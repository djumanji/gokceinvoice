import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export default function Leads() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">Manage and track your leads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Column: To Do */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              To Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <p className="text-muted-foreground text-center px-4">
                Coming Soon
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Column: In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <p className="text-muted-foreground text-center px-4">
                Coming Soon
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Column: Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <p className="text-muted-foreground text-center px-4">
                Coming Soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Status</CardTitle>
          <CardDescription>
            Current implementation status of the leads system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Database Schema</span>
            <Badge variant="default">Complete</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Chatbot Lead Capture</span>
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
            <span>Lead Management</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

