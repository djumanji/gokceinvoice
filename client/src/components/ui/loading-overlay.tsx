import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ show, message, className }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-4 shadow-md">
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          aria-hidden="true"
        />
        {message ? (
          <span className="text-sm text-muted-foreground">{message}</span>
        ) : null}
      </div>
    </div>
  );
}


