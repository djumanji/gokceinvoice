import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export default function Waitlist() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      // Browser back button was pressed - let wouter handle it naturally
      // Wouter already listens to popstate events, so this ensures proper navigation
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const waitlistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/waitlist", {
        email,
        source: "waitlist_page",
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You've been added to the waitlist. We'll notify you when invites are available.",
      });
      setEmail("");
    },
    onError: async (error: any) => {
      console.error("Waitlist signup failed:", error);

      let errorMessage = "Failed to join waitlist. Please try again.";

      try {
        const match = error.message?.match(/\d+:\s*(.+)/);
        if (match) {
          const errorBody = match[1];
          try {
            const errorData = JSON.parse(errorBody);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorBody;
          }
        }
      } catch (e) {
        console.error("Error parsing error message:", e);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    waitlistMutation.mutate();
  };

  const handleBack = () => {
    // Use wouter's navigation for proper history management
    // Check if we came from marketing page or another page
    const referrer = document.referrer;
    if (referrer && (referrer.includes(window.location.origin))) {
      // Try to go back in history
      window.history.back();
    } else {
      // Default to marketing page
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-start mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-auto"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-2xl">Join the Waitlist</CardTitle>
          <CardDescription className="mt-2">
            This is an invite-only platform. Enter your email to join the waitlist and we'll notify you when invites become available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                disabled={waitlistMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={waitlistMutation.isPending}
            >
              {waitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an invite?{" "}
            <button
              onClick={(e) => {
                e.preventDefault();
                setLocation("/register");
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              Register here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
