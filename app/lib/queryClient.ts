import type { QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 8 * 1000,        // Data considered fresh for 8s
      gcTime: 5 * 60 * 1000,      // Cache kept 5 min after component unmounts
      retry: 1,                   // Retry failed request once, then show error
      retryDelay: 3000,           // Wait 3s before retry
      refetchOnWindowFocus: true, // Re-fetch when user returns to browser tab
    },
  },
};
