import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  
  // Only show loading after 1 second
  loadingTimeout = setTimeout(() => {
    if (activeRequests > 0 && setGlobalLoadingState) {
      setGlobalLoadingState(true);
    }
  }, 1000);
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
): Promise<Response> {
  startRequestTracking();
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    endRequestTracking();
    return res;
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
