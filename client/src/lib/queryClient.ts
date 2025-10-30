import { QueryClient, QueryFunction } from "@tanstack/react-query";

// CSRF token management with proper race condition handling
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  // If token already exists, return it
  if (csrfToken) {
    return csrfToken;
  }

  // If fetch is already in progress, wait for it
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Start new fetch and store the promise
  csrfTokenPromise = (async () => {
    try {
      const res = await fetch('/api/csrf-token', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch CSRF token: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      csrfToken = data.csrfToken;

      if (!csrfToken) {
        throw new Error('CSRF token not found in response');
      }

      return csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      // Clear the promise so next call will retry
      csrfTokenPromise = null;
      throw error;
    } finally {
      // Clear the promise once complete (success or error)
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

// Reset CSRF token on auth changes
export function resetCsrfToken() {
  csrfToken = null;
  csrfTokenPromise = null;
}

// Global API loading tracker
let activeRequests = 0;
let loadingTimeout: NodeJS.Timeout | null = null;
let setGlobalLoadingState: ((loading: boolean) => void) | null = null;

export function setApiLoadingCallback(callback: (loading: boolean) => void) {
  setGlobalLoadingState = callback;
}

function startRequestTracking() {
  activeRequests++;
  
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
  }
  
  // Only show loading after 300ms for faster feedback
  loadingTimeout = setTimeout(() => {
    if (activeRequests > 0 && setGlobalLoadingState) {
      setGlobalLoadingState(true);
    }
  }, 300);
}

function endRequestTracking() {
  activeRequests = Math.max(0, activeRequests - 1);
  
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }
  
  // Hide loading when no more active requests
  if (activeRequests === 0 && setGlobalLoadingState) {
    setGlobalLoadingState(false);
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  startRequestTracking();

  try {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = {};

    // Only set Content-Type for non-FormData, let browser set it for FormData
    if (data && !isFormData) {
      headers["Content-Type"] = "application/json";
    }

    // Add CSRF token for non-GET requests
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const token = await getCsrfToken();
      headers["X-CSRF-Token"] = token;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      credentials: "include",
    });

    // If CSRF token is invalid, reset and retry once
    if (res.status === 403) {
      const errorText = await res.text();
      if (errorText.includes('CSRF')) {
        resetCsrfToken();
        const newToken = await getCsrfToken();
        headers["X-CSRF-Token"] = newToken;

        const retryRes = await fetch(url, {
          method,
          headers,
          body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
          credentials: "include",
        });

        await throwIfResNotOk(retryRes);
        endRequestTracking();
        return await retryRes.json();
      }
    }

    await throwIfResNotOk(res);
    endRequestTracking();
    return await res.json();
  } catch (error) {
    endRequestTracking();
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    startRequestTracking();
    
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        endRequestTracking();
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      endRequestTracking();
      return data;
    } catch (error) {
      endRequestTracking();
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
