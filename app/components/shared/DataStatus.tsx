'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NetworkError, AuthError } from '../../lib/api';

interface Props {
  isError: boolean;
  isFetching: boolean;
  error: Error | null;
}

export default function DataStatus({ isError, isFetching, error }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (isError && error instanceof AuthError) {
      router.replace('/auth/login');
    }
  }, [isError, error, router]);

  if (isError && error instanceof AuthError) return null; // redirect pending
  if (isError && error instanceof NetworkError) {
    return <div className="data-status offline">⚡ Connection lost — retrying...</div>;
  }
  if (isError) {
    return <div className="data-status error">⚠ Data unavailable — retrying shortly</div>;
  }
  if (isFetching) {
    return <div className="data-status syncing" />;
  }
  return null;
}
