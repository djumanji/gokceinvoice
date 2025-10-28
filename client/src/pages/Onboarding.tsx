import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, FileText, Users, Settings, Box } from "lucide-react";
import { Link } from "wouter";
import { useOnboardingGuard } from "@/hooks/use-onboarding";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { isOnboardingComplete, clientCount, invoiceCount, serviceCount } = useOnboardingGuard();

  // Redirect to dashboard if onboarding is complete
  useEffect(() => {
    if (isOnboardingComplete) {
      setLocation("/");
    }
  }, [isOnboardingComplete, setLocation]);

  // Fetch user profile to check if profile is set
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return res.json();
    },
  });

  const hasProfile = user && (user.companyName || user.address || user.phone || user.taxOfficeId);

  const setupSteps = [
    { title: "Set your profile", completed: hasProfile, time: "1 min", href: "/settings" },
    { title: "Add your first client", completed: clientCount > 0, time: "2 mins", href: "/clients" },
    { title: "Add your first service", completed: serviceCount > 0, time: "2 mins", href: "/services" },
    { title: "Create your first invoice", completed: invoiceCount > 0, time: "3 mins", href: "/invoices/new" },
  ];

  const quickActions = [
    { title: "Manage Clients", icon: Users, href: "/clients" },
    { title: "Manage Services", icon: Box, href: "/services" },
    { title: "Create Invoice", icon: FileText, href: "/invoices/new" },
    { title: "View Invoices", icon: FileText, href: "/invoices" },
  ];

  const completedCount = setupSteps.filter(step => step.completed).length;
  const progressPercentage = (completedCount / setupSteps.length) * 100;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome to InvoiceHub!
        </h1>
        <p className="text-muted-foreground">
          Let's get you set up and ready to send your first invoice
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Let's start step-by-step</CardTitle>
            <span className="text-sm text-muted-foreground">{completedCount}/{setupSteps.length} completed</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progressPercentage}%` }}></div>
          </div>

          <div className="space-y-3">
            {setupSteps.map((step, index) => (
              <Link key={index} href={step.href}>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                      {step.completed && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <action.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold">{action.title}</h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
