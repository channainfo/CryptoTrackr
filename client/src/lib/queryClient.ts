import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// API request options interface
interface ApiRequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  body?: unknown; // Alternative name for data for compatibility
  headers?: Record<string, string>; // Support for custom headers
}

export async function apiRequest(urlOrOptions: string | ApiRequestOptions, config?: Omit<ApiRequestOptions, 'url'>): Promise<any> {
  let url: string;
  let method: string = 'GET';
  let data: unknown;
  
  // Handle both formats of the function call
  let headers: Record<string, string> = {};
  
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    method = config?.method || 'GET';
    data = config?.data || config?.body;
    headers = config?.headers || {};
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method;
    data = urlOrOptions.data || urlOrOptions.body;
    headers = urlOrOptions.headers || {};
  }
  
  // Add content-type header for requests with data
  if (data) {
    headers = { 
      "Content-Type": "application/json",
      ...headers 
    };
  }
  
  const res = await fetch(url, {
    method: method,
    headers: headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Only try to parse JSON for non-empty responses and non-DELETE methods
  if (method === 'DELETE' || res.headers.get('Content-Length') === '0') {
    return null;
  }
  
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
