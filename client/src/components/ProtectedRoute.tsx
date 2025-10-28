import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: user, error, isLoading: queryLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/api/auth/me");
        return data;
      } catch (err) {
        // Return null on auth errors instead of throwing
        console.log('[ProtectedRoute] Auth error:', err);
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    console.log('[ProtectedRoute] Effect running:', { queryLoading, hasUser: !!user, hasError: !!error });
    if (queryLoading) {
      console.log('[ProtectedRoute] Still loading, waiting...');
      return;
    }

    if (error || !user) {
      console.log('[ProtectedRoute] No user or error, redirecting to /login');
      setLocation("/login");
    } else {
      console.log('[ProtectedRoute] User authenticated, showing protected content');
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [user, error, queryLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

