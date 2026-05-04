import { getToken, clearToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class NetworkError extends Error {
  constructor() {
    super('Unable to reach server. Check your connection.');
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor() {
    super('Session expired. Please log in again.');
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401) {
    clearToken();
    throw new AuthError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}
