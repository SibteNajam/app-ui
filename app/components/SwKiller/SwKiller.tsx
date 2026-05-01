'use client';
import { useEffect } from 'react';

/**
 * Silently unregisters any stale Service Workers left over from
 * old Vite/CRA projects that ran on the same localhost:3000 port.
 * This eliminates the ghost 404 requests for pdfHelper, supabase-client, etc.
 */
export default function SwKiller() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister();
        });
      });
    }
  }, []);

  return null;
}
