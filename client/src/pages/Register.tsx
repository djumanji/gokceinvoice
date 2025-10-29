import { useEffect, useState } from "react";
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
// import { trackEvent, identifyUser } from "@/lib/mixpanel";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error(t("errors.passwordMismatch"));
      }
      const res = await apiRequest("POST", "/api/auth/register", { email, password });
      return res;
    },
    onSuccess: (data) => {
      // Track registration success in Mixpanel
      // trackEvent('User Registered', {
      //   email,
      //   username: username || 'not provided',
      //   registration_method: 'email',
      // });

      // Identify user in Mixpanel
      // if (data.user) {
      //   identifyUser(data.user.id, {
      //     email: data.user.email,
      //     username: data.user.username,
      //   });
      // }
      
      // Invalidate the auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/onboarding");
    },
    onError: async (error: any) => {
      console.error("Registration failed:", error);

      let errorMessage = t("register.registrationFailed");

      try {
        // Parse error message format: "400: {\"error\":\"message\"}"
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
        title: t("register.registrationFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track registration attempt
    // trackEvent('Registration Attempt', {
    //   email,
    //   has_username: !!username,
    // });
    
    registerMutation.mutate();
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
        />
      </div>

      {/* Content Layer */}
      <Card className="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/95 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("register.createAccount")}</CardTitle>
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
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t("auth.passwordPlaceholder")}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Min 8 characters with uppercase, lowercase, and number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t("auth.passwordPlaceholder")}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? t("register.creatingAccount") : t("common.register")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            {t("register.alreadyHaveAccount")}{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-primary hover:underline"
            >
              {t("common.login")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

