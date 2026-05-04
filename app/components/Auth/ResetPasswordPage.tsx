'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock, Eye, EyeOff, ArrowRight, Check, AlertCircle,
  ShieldCheck, Shield,
} from 'lucide-react';
import { resetPassword } from '../../lib/authApi';
import { BrandPanel } from './BrandPanel';
import './Auth.css';



/* ─────────────────────────────────────────────────────────
   URL token reader
   ───────────────────────────────────────────────────────── */
function TokenReader({ onToken }: { onToken: (t: string) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    const t = params?.get('token');
    if (t) onToken(t);
  }, [params, onToken]);
  return null;
}

/* ─────────────────────────────────────────────────────────
   Password strength helper
   ───────────────────────────────────────────────────────── */
function getStrength(pass: string) {
  if (!pass) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pass.length >= 6) s++;
  if (pass.length >= 8) s++;
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) s++;
  if (/[^A-Za-z0-9]/.test(pass)) s++;
  return {
    score: s,
    label: ['', 'Weak', 'Fair', 'Strong', 'Elite'][s],
    color: ['', '#f87171', '#fbbf24', '#34d399', '#22d3ee'][s],
  };
}

/* ─────────────────────────────────────────────────────────
   RESET PASSWORD PAGE
   ───────────────────────────────────────────────────────── */
export default function ResetPasswordPage() {
  const router = useRouter();

  const [formReady, setFormReady] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const t = setTimeout(() => setFormReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleTokenCapture = useCallback((t: string) => setToken(t), []);

  // Auto-redirect after success
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.push('/auth/login');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid or missing reset token. Please use the link from your email.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await resetPassword(token, newPassword, confirmPassword);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div className="al-root">
      <div className="al-noise" />
      <Suspense fallback={null}>
        <TokenReader onToken={handleTokenCapture} />
      </Suspense>

      <div className="al-container">

        {/* ════════════ LEFT: Form panel ════════════ */}
        <div className="al-left">
          <div className={`al-body ${formReady ? 'ready' : ''}`}>

            {/* ── SUCCESS STATE ── */}
            {success ? (
              <div className="al-otp-card">
                <div className="al-otp-icon-wrap">
                  <div className="al-otp-icon al-otp-icon--success">
                    <ShieldCheck size={28} />
                  </div>
                </div>

                <h2 className="al-title" style={{ textAlign: 'center' }}>
                  Password reset successfully!
                </h2>
                <p className="al-subtitle" style={{ textAlign: 'center', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                  Your password has been updated. You can now sign in with your new credentials.
                </p>

                <button
                  type="button"
                  className="al-submit"
                  onClick={() => router.push('/auth/login')}
                >
                  <span>Go to Login</span>
                  <ArrowRight size={16} />
                </button>

                <p className="al-resend" style={{ marginTop: 16 }}>
                  Redirecting in <strong style={{ color: 'var(--al-green)' }}>{countdown}s</strong>
                </p>
              </div>
            ) : (
              /* ── FORM STATE ── */
              <div className="al-form-view">
                <div className="al-form-head">
                  <div className="al-otp-icon-wrap" style={{ marginBottom: 16 }}>
                    <div className="al-otp-icon">
                      <Lock size={24} />
                    </div>
                  </div>
                  <h1 className="al-title">
                    <b>Reset</b> your password
                  </h1>
                  <p className="al-subtitle">
                    Choose a strong new password for your account
                  </p>
                </div>

                {!token && (
                  <div className="al-alert al-alert-err">
                    <AlertCircle size={13} />
                    <span>No reset token found. Please use the link from your email.</span>
                  </div>
                )}

                {error && (
                  <div className="al-alert al-alert-err">
                    <AlertCircle size={13} /><span>{error}</span>
                  </div>
                )}

                <form className="al-form" onSubmit={handleSubmit}>
                  <div className="al-field">
                    <label className="al-label">New password</label>
                    <div className="al-input-wrap">
                      <Lock size={15} className="al-icon" />
                      <input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        className="al-input al-input-icon al-input-pr"
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="al-eye"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="al-strength">
                        <div className="al-strength-bars">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`al-bar ${i <= strength.score ? 'on' : ''}`}
                              style={{ background: i <= strength.score ? strength.color : undefined }}
                            />
                          ))}
                        </div>
                        <span className="al-strength-lbl" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="al-field">
                    <label className="al-label">Confirm new password</label>
                    <div className="al-input-wrap">
                      <Shield size={15} className="al-icon" />
                      <input
                        id="reset-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        className="al-input al-input-icon al-input-pr"
                        placeholder="Repeat your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="al-eye"
                        tabIndex={-1}
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {passwordsMismatch && (
                      <span className="al-field-err">Passwords do not match</span>
                    )}
                    {passwordsMatch && (
                      <span className="al-field-ok"><Check size={11} /> Passwords match</span>
                    )}
                  </div>

                  {/* Password requirements */}
                  <div className="al-pw-requirements">
                    <p className="al-pw-req-title">Password requirements:</p>
                    <ul className="al-pw-req-list">
                      <li className={newPassword.length >= 6 ? 'met' : ''}>
                        <Check size={10} /> At least 6 characters
                      </li>
                      <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>
                        <Check size={10} /> One uppercase letter
                      </li>
                      <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>
                        <Check size={10} /> One number
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}>
                        <Check size={10} /> One special character
                      </li>
                    </ul>
                  </div>

                  <button
                    id="reset-submit"
                    type="submit"
                    className="al-submit"
                    disabled={isLoading || !token}
                  >
                    {isLoading
                      ? <span className="al-spinner" />
                      : <><span>Reset Password</span><ArrowRight size={16} /></>}
                  </button>
                </form>
              </div>
            )}
          </div>

          <p className="al-copyright">© 2026 ByteBoom. All rights reserved.</p>
        </div>

        {/* ════════════ RIGHT: Brand panel ════════════ */}
        <BrandPanel />

      </div>
    </div>
  );
}
