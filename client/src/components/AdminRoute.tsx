import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: user, error, isLoading: queryLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/api/auth/me");
        return data;
      } catch (err) {
        console.log('[AdminRoute] Auth error:', err);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (queryLoading) {
        setIsLoading(false);
      }
    }, 1000);

    if (queryLoading) {
      return () => clearTimeout(timeoutId);
    }

    clearTimeout(timeoutId);

    // Check if user is authenticated
    if (!user && !queryLoading) {
      console.log('[AdminRoute] No user found, redirecting to /login');
      setLocation("/login");
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    if (error) {
      console.log('[AdminRoute] Error detected, redirecting to /login');
      setLocation("/login");
      setIsLoading(false);
      setIsAuthorized(false);
      return;
    }

    // Check if user is admin
    if (user && user.isAdmin) {
      console.log('[AdminRoute] User is admin, showing admin content');
      setIsAuthorized(true);
      setIsLoading(false);
    } else if (user && !user.isAdmin) {
      console.log('[AdminRoute] User is not admin, redirecting to /dashboard');
      setLocation("/dashboard");
      setIsAuthorized(false);
      setIsLoading(false);
    }
  }, [user, error, queryLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

