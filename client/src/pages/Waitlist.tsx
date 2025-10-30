import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
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

  // Get email from URL params if present
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');

  const [email, setEmail] = useState(emailParam || "");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const waitlistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/waitlist", {
        email,
        source: "waitlist_page",
      });
      return res;
    },
    onSuccess: () => {
      setIsSuccess(true);
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
    setLocation("/");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      {/* Company Logo */}
      <Link href="/" className="absolute top-4 left-4 z-50 h-[50px] w-[50px] p-1">
        <div className="h-full w-full flex items-center justify-center bg-indigo-600 rounded-lg">
          <span className="text-white font-bold text-lg">H</span>
        </div>
      </Link>
      
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
          <CardTitle className="text-2xl">
            {isSuccess ? "You're on the list!" : "Join the Waitlist"}
          </CardTitle>
          <CardDescription className="mt-2">
            {isSuccess
              ? "You've been added to the waitlist. We'll notify you when invites are available."
              : "This is an invite-only platform. Enter your email to join the waitlist and we'll notify you when invites become available."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-lg font-medium mb-2">{email}</p>
                <p className="text-sm text-muted-foreground">
                  Check your email for updates
                </p>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Already have an invite code?{" "}
                <Link href="/register" className="text-primary hover:underline cursor-pointer font-medium inline-block">
                  Register here
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                Already have an invite code?{" "}
                <Link href="/register" className="text-primary hover:underline cursor-pointer font-medium inline-block">
                  Register here
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
