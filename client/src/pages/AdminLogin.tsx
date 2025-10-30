import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ email: loginEmail, password: loginPassword }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email: loginEmail, password: loginPassword });
      return response;
    },
    onSuccess: async (data) => {
      console.log('[AdminLogin] Login successful, data:', data);

      // Invalidate and refetch user data to get admin status
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });

      // Check if user is admin
      const user = await queryClient.fetchQuery({
        queryKey: ["/api/auth/me"],
        queryFn: async () => {
          return await apiRequest("GET", "/api/auth/me");
        },
      });

      if (user?.isAdmin) {
        console.log('[AdminLogin] Admin user logged in, redirecting to dashboard');
        setLocation("/dashboard");
      } else {
        toast({
          title: "Access Denied",
          description: "This login is for administrators only.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Admin login failed:", error);

      let errorMessage = "Login failed. Please check your credentials.";

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
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    // For admin login, username is used as email
    loginMutation.mutate({ email: username, password });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Company Logo */}
      <Link href="/" className="absolute top-4 left-4 z-50 h-[50px] w-[50px] p-1">
        <div className="h-full w-full flex items-center justify-center bg-indigo-600 rounded-lg">
          <span className="text-white font-bold text-lg">H</span>
        </div>
      </Link>

      {/* Content Layer */}
      <Card className="relative z-10 w-full max-w-md mx-auto backdrop-blur-sm bg-card/95 shadow-xl border-2 border-indigo-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Administrator access only
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter admin username"
                autoComplete="username"
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
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login as Admin"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Regular user login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

