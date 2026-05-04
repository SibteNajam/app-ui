import { apiFetch } from './api';

// ── Types ───────────────────────────────────────────────

export interface LoginResponse {
  requiresOTP?: boolean;
  message?: string;
}

export interface VerifyLoginOTPResponse {
  data: {
    data: {
      user: { id: string; email: string; name: string };
      payload: {
        type: string;
        token: string;
        refresh_token: string;
      };
    };
  };
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  inviteToken?: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
}

// ── Auth endpoints ───────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function verifyLoginOTP(
  email: string,
  otp: string
): Promise<VerifyLoginOTPResponse> {
  return apiFetch<VerifyLoginOTPResponse>('/auth/verify-login-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendLoginOTP(email: string): Promise<void> {
  return apiFetch<void>('/auth/resend-login-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ── User / signup endpoints ──────────────────────────────

export async function registerUser(data: RegisterPayload): Promise<void> {
  return apiFetch<void>('/user/register-user', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifySignupOTP(email: string, otp: string): Promise<void> {
  return apiFetch<void>('/user/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendSignupOTP(email: string): Promise<void> {
  return apiFetch<void>('/user/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ── Forgot / Reset Password ──────────────────────────────

export async function forgotPassword(email: string, dateOfBirth: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/user/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, dateOfBirth }),
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/user/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}

// ── Session ──────────────────────────────────────────────

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/auth/me');
}

export async function logoutUser(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}
