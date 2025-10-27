import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const res = await apiRequest("POST", "/api/auth/register", { email, password, username });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/onboarding");
    },
    onError: async (error: any) => {
      console.error("Registration failed:", error);
      
      // Try to extract error message from the error
      let errorMessage = error.message || "Registration failed. Please try again.";
      
      try {
        // The error message from apiRequest contains the response text
        // Format is usually "400: {\"error\":\"User already exists\"}"
        const errorMatch = error.message?.match(/\{[^}]+\}/);
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[0]);
          errorMessage = errorData.error || errorMessage;
        }
      } catch (e) {
        // If parsing fails, use the error message as is
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-md flex items-center justify-center bg-card border hover:bg-accent transition-colors"
        data-testid="button-theme-toggle"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
      
      {/* Background Lottie Animation */}
      <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
        <DotLottieReact
          src="https://lottie.host/8aa90f89-3d22-4f51-99f6-8262f166f0a9/w07L1QkYUx.lottie"
          loop
          autoplay
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Layer */}
      <Card className="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/95 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/api/auth/google'}
              variant="outline"
              className="w-full"
            >
              🔵 Continue with Google
            </Button>
            <Button
              onClick={() => window.location.href = '/api/auth/github'}
              variant="outline"
              className="w-full"
            >
              🐙 Continue with GitHub
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-primary hover:underline"
            >
              Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

