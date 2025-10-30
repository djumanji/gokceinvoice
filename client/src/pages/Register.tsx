import { useEffect, useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DOTLOTTIE_WASM_URL } from "@/lib/lottie";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";
// import { trackEvent, identifyUser } from "@/lib/mixpanel";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  // Extract invite token from URL query params
  const inviteParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite');
  }, [location]);

  // Validate invite token on page load
  const { data: inviteValidation, isLoading: isValidatingInvite } = useQuery({
    queryKey: ['/api/invites/validate', inviteParam],
    queryFn: async () => {
      if (!inviteParam) return null;
      const res = await apiRequest("GET", `/api/invites/validate?token=${inviteParam}`);
      return res;
    },
    enabled: !!inviteParam,
    retry: false,
  });

  // If invite param in URL, set it as the invite code
  useEffect(() => {
    if (inviteParam) {
      setInviteCode(inviteParam);
    }
  }, [inviteParam]);

  // Handle invalid invite token
  useEffect(() => {
    if (inviteValidation && !inviteValidation.valid) {
      toast({
        title: "Invalid Invite",
        description: inviteValidation.error || "This invite link is invalid or has expired.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/waitlist", { replace: true });
      }, 2000);
    } else if (inviteValidation && inviteValidation.valid) {
      setInviteToken(inviteParam!);
      if (inviteValidation.recipientEmail) {
        setEmail(inviteValidation.recipientEmail);
      }
    }
  }, [inviteValidation, inviteParam, toast, setLocation]);

  // Extract email and marketing flag from URL params (legacy support)
  const emailParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email');
  }, [location]);

  const fromMarketing = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('from') === 'marketing';
  }, [location]);

  // Pre-fill email from URL params (legacy support)
  useEffect(() => {
    if (emailParam && !inviteValidation?.recipientEmail) {
      setEmail(emailParam);
    }
  }, [emailParam, inviteValidation]);

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

      if (!inviteToken) {
        throw new Error("Invite token is required");
      }

      const res = await apiRequest("POST", "/api/auth/register", {
        email,
        password,
        invite_token: inviteToken,
      });
      return res;
    },
    onSuccess: async (data) => {
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

      // Invalidate and refetch user data to check if onboarding is needed
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });

      // Check if user already has profile data (edge case: existing marketing user)
      const user = queryClient.getQueryData(["/api/auth/me"]) as any;
      if (user?.companyName && user?.address) {
        // User already has onboarding data, go to dashboard
        setLocation("/dashboard");
      } else {
        // Normal flow: redirect to onboarding
        setLocation("/onboarding");
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the invite code (either from URL or manually entered)
    const codeToValidate = inviteParam || inviteCode.trim();

    if (!codeToValidate) {
      toast({
        title: "Invite Code Required",
        description: "Please enter a valid invite code to register.",
        variant: "destructive",
      });
      return;
    }

    // Validate the invite code first
    try {
      const validation = await apiRequest("GET", `/api/invites/validate?token=${codeToValidate}`);

      if (!validation.valid) {
        toast({
          title: "Invalid Invite Code",
          description: validation.error || "The invite code is invalid or has expired.",
          variant: "destructive",
        });
        return;
      }

      // Set the validated token and proceed with registration
      setInviteToken(codeToValidate);
      registerMutation.mutate();
    } catch (error: any) {
      toast({
        title: "Validation Failed",
        description: "Could not validate invite code. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while validating invite from URL
  if (inviteParam && isValidatingInvite) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
        <Card className="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/95 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center">Validating invite...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Company Logo */}
      <Link href="/" className="absolute top-4 left-4 z-50 h-[50px] w-[50px] p-1">
        <div className="h-full w-full flex items-center justify-center bg-indigo-600 rounded-lg">
          <span className="text-white font-bold text-lg">H</span>
        </div>
      </Link>
      
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
      <Card className="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/95 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t("register.createAccount")}
          </CardTitle>
          {inviteValidation?.sender && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Invited by {inviteValidation.sender.name || inviteValidation.sender.email}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                readOnly={!!inviteParam}
                placeholder="Enter your invite code"
                className={inviteParam ? "bg-muted cursor-not-allowed" : ""}
              />
              {!inviteParam && (
                <p className="text-xs text-muted-foreground">
                  Enter the invite code you received
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={!!inviteValidation?.recipientEmail}
                placeholder={t("auth.emailPlaceholder")}
                className={inviteValidation?.recipientEmail ? "bg-muted cursor-not-allowed" : ""}
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
              {registerMutation.isPending
                ? t("register.creatingAccount")
                : t("common.register")
              }
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

