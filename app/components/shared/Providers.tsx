'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClientConfig } from '../../lib/queryClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures a NEW QueryClient is created per browser session
  // NOT shared between users on the server
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
