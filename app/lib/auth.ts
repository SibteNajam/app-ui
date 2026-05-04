const TOKEN_KEY = 'bb_auth_token';

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null; // SSR guard
  // Primary key is `bb_auth_token`. Some flows may set `token` directly — fallback to it.
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem('token');
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
