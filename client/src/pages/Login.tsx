import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseErrorMessage } from "@/lib/errorUtils";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DOTLOTTIE_WASM_URL } from "@/lib/lottie";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";
// import { trackEvent, identifyUser } from "@/lib/mixpanel-wrapper";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [animationSrc, setAnimationSrc] = useState<string>(
    import.meta.env.PROD
      ? "/lottie/hallederik-bg.lottie"
      : "https://lottie.host/8aa90f89-3d22-4f51-99f6-8262f166f0a9/w07L1QkYUx.lottie"
  );

  // Prefer local asset in production to avoid external CORS/hotlinking issues.
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const controller = new AbortController();
    fetch("/lottie/hallederik-bg.lottie", { method: "HEAD", signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          setAnimationSrc("https://lottie.host/8aa90f89-3d22-4f51-99f6-8262f166f0a9/w07L1QkYUx.lottie");
        }
      })
      .catch(() => {
        setAnimationSrc("https://lottie.host/8aa90f89-3d22-4f51-99f6-8262f166f0a9/w07L1QkYUx.lottie");
      });
    return () => controller.abort();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ email: loginEmail, password: loginPassword }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email: loginEmail, password: loginPassword });
      return response;
    },
    onSuccess: (data) => {
      console.log('[Login] Login successful, data:', data);

      // Track login success in Mixpanel
      // trackEvent('User Logged In', {
      //   email,
      //   login_method: 'email',
      // });

      // Identify user in Mixpanel
      // if (data.user) {
      //   identifyUser(data.user.id, {
      //     email: data.user.email,
      //     username: data.user.username,
      //   });
      // }

      console.log('[Login] Invalidating queries and redirecting to /dashboard');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      console.log('[Login] Calling setLocation("/dashboard")');
      setLocation("/dashboard");
      console.log('[Login] setLocation called, navigating to dashboard');
    },
    onError: (error: any) => {
      console.error("Login failed:", error);

      let errorMessage = "Login failed. Please check your credentials.";

      try {
        // Parse error message format: "401: {\"error\":\"message\"}"
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

        // Handle rate limiting
        if (error.message?.includes('429') || error.message?.includes('Too many')) {
          errorMessage = "Too many login attempts. Please wait a few minutes and try again.";
        }
      } catch (e) {
        console.error("Error parsing error message:", e);
      }

      toast({
        title: t("auth.loginFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Login] Form submitted, preventDefault called');

    // Track login attempt
    // trackEvent('Login Attempt', {
    //   email,
    // });

    if (!email || !password) {
      console.log('[Login] Missing email or password');
      toast({
        title: t("auth.missingInfo"),
        description: t("auth.missingInfoMessage"),
        variant: "destructive",
      });
      return;
    }

    console.log('[Login] Calling loginMutation.mutate');
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-md flex items-center justify-center bg-card border hover:bg-accent transition-colors"
        data-testid="button-theme-toggle"
        aria-label={t("auth.toggleTheme")}
      >
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
      
      {/* Background Lottie Animation */}
      <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
        <DotLottieReact
          src={animationSrc}
          loop
          autoplay
          className="w-full h-full object-cover"
          wasmUrl={DOTLOTTIE_WASM_URL}
        />
      </div>

      {/* Content Layer */}
      <Card className="relative z-10 w-full max-w-md mx-auto backdrop-blur-sm bg-card/95 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t("auth.loginTo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("common.password")}</Label>
                  <button
                    type="button"
                    onClick={() => setLocation("/forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
{loginMutation.isPending ? t("auth.loggingIn") : t("common.login")}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
{t("auth.dontHaveAccount")}{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-primary hover:underline"
              >
                {t("common.register")}
              </button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

