import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export interface ErrorBannerProps {
  title?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

export function ErrorBanner({ title = "Something went wrong", description, children }: ErrorBannerProps) {
  return (
    <Alert variant="destructive" role="alert">
      <TriangleAlert className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
      {children}
    </Alert>
  );
}


