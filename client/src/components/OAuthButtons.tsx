import { Button } from "@/components/ui/button";

export function OAuthButtons() {
  return (
    <div className="space-y-4">
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
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
    </div>
  );
}

