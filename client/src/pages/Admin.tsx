import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MessageSquare, Globe, Users, Gavel, Mail } from "lucide-react";

export default function Admin() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Admin Panel</CardTitle>
            <CardDescription>
              Manage your application and access consumer-facing features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Welcome to the admin panel. This page is currently empty and ready for future features.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Consumer Features</CardTitle>
            <CardDescription>
              Access and test consumer-facing features from the admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Lead Capture</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Test the consumer chatbot interface for lead submission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/lead-capture">
                    <Button className="w-full" variant="outline">
                      Open Lead Capture
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Marketing Page</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    View the public marketing landing page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/">
                    <Button className="w-full" variant="outline">
                      Open Marketing Page
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Leads Dashboard</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    View and manage submitted leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/leads">
                    <Button className="w-full" variant="outline">
                      Open Leads Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Bids Management</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    View contractor bids and response windows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/bids">
                    <Button className="w-full" variant="outline">
                      Open Bids
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Messages</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    View contractor-customer messaging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/messages">
                    <Button className="w-full" variant="outline">
                      Open Messages
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

