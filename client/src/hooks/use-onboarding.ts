import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Custom hook to check if user has completed onboarding
 * Onboarding is complete when user has:
 * 1. Set profile (company name, address, phone, or tax ID)
 * 2. Created at least 1 client
 * 
 * Note: Invoice and service creation are not required for onboarding completion.
 * The onboarding wizard only requires company details and a client.
 */
export function useOnboardingGuard() {
  
  // Run all queries in parallel with proper queryFn for better caching
  // Use enabled flag to only fetch data we actually need for onboarding check
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/auth/me");
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    enabled: !!user, // Only fetch if user exists (already authenticated)
    staleTime: 30000,
  });
  
  // Only fetch these if needed - they're not required for onboarding check
  // but keeping for backward compatibility
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user,
    staleTime: 30000,
  });
  
  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["/api/services"],
    enabled: !!user,
    staleTime: 30000,
  });

  const hasCompanyName = user?.companyName;
  // Admin users bypass onboarding checks
  const isAdmin = user?.isAdmin || false;
  // Onboarding is complete if user has company name and at least one client
  // This matches what the onboarding wizard actually creates
  // Admin users always have onboarding complete
  const isOnboardingComplete = isAdmin || (hasCompanyName && clients.length > 0);
  const isLoading = userLoading || (!!user && clientsLoading);

  return { 
    isOnboardingComplete, 
    isLoading,
    clientCount: clients.length, 
    invoiceCount: invoices.length, 
    serviceCount: services.length,
    hasProfile: !!hasCompanyName
  };
}

