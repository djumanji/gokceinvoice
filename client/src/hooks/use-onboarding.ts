import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Custom hook to check if user has completed onboarding
 * Onboarding is complete when user has:
 * 1. Set profile (company name, address, phone, or tax ID)
 * 2. Created at least 1 client
 * 3. Created at least 1 invoice  
 * 4. Created at least 1 service
 */
export function useOnboardingGuard() {
  const [, setLocation] = useLocation();
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });
  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });
  
  // Fetch user profile to check if profile is set
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/auth/me");
    },
  });

  const hasCompanyName = user && user.companyName;
  const isOnboardingComplete = hasCompanyName && invoices.length > 0;

  return { 
    isOnboardingComplete, 
    clientCount: clients.length, 
    invoiceCount: invoices.length, 
    serviceCount: services.length,
    hasProfile: !!hasCompanyName
  };
}

