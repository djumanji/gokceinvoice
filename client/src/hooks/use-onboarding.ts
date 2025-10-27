import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

/**
 * Custom hook to check if user has completed onboarding
 * Onboarding is complete when user has created at least 1 client, 1 invoice, and 1 service
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

  const isOnboardingComplete = clients.length > 0 && invoices.length > 0 && services.length > 0;

  return { isOnboardingComplete, clientCount: clients.length, invoiceCount: invoices.length, serviceCount: services.length };
}

