'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail, Calendar, ArrowRight, ChevronLeft, Check,
  AlertCircle, KeyRound,
} from 'lucide-react';
import { forgotPassword } from '../../lib/authApi';
import { BrandPanel } from './BrandPanel';
import './Auth.css';



/* ─────────────────────────────────────────────────────────
   URL param reader (for ?email=xxx prefill)
   ───────────────────────────────────────────────────────── */
function EmailParamReader({ onEmail }: { onEmail: (e: string) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    const e = params?.get('email');
    if (e) onEmail(e);
  }, [params, onEmail]);
  return null;
}

/* ─────────────────────────────────────────────────────────
   FORGOT PASSWORD PAGE
   ───────────────────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const router = useRouter();

  const [formReady, setFormReady] = useState(false);
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFormReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleEmailPrefill = useCallback((e: string) => setEmail(e), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !dateOfBirth) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email, dateOfBirth);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="al-root">
      <div className="al-noise" />
      <Suspense fallback={null}>
        <EmailParamReader onEmail={handleEmailPrefill} />
      </Suspense>

      <div className="al-container">

        {/* ════════════ LEFT: Form panel ════════════ */}
        <div className="al-left">
          <div className={`al-body ${formReady ? 'ready' : ''}`}>

            {/* ── SUCCESS STATE ── */}
            {sent ? (
              <div className="al-otp-card">
                <div className="al-otp-icon-wrap">
                  <div className="al-otp-icon al-otp-icon--success">
                    <Check size={28} />
                  </div>
                </div>

                <h2 className="al-title" style={{ textAlign: 'center' }}>
                  Check your email
                </h2>
                <p className="al-subtitle" style={{ textAlign: 'center', marginBottom: 8 }}>
                  We&apos;ve sent a password reset link to
                </p>
                <p className="al-otp-email">{email}</p>

                <p className="al-subtitle" style={{ textAlign: 'center', maxWidth: 340, margin: '0 auto 24px' }}>
                  Click the link in the email to reset your password.
                  If you don&apos;t see it, check your spam folder.
                </p>

                <button
                  type="button"
                  className="al-submit"
                  onClick={() => router.push('/auth/login')}
                >
                  <span>Back to Login</span>
                  <ArrowRight size={16} />
                </button>

                <p className="al-resend" style={{ marginTop: 16 }}>
                  Didn&apos;t receive it?{' '}
                  <button
                    type="button"
                    className="al-resend-btn"
                    onClick={() => { setSent(false); setError(''); }}
                  >
                    Try again
                  </button>
                </p>
              </div>
            ) : (
              /* ── FORM STATE ── */
              <div className="al-form-view">
                <button
                  type="button"
                  className="al-back"
                  onClick={() => router.push('/auth/login')}
                >
                  <ChevronLeft size={14} /> Back to Login
                </button>

                <div className="al-form-head">
                  <div className="al-otp-icon-wrap" style={{ marginBottom: 16 }}>
                    <div className="al-otp-icon">
                      <KeyRound size={24} />
                    </div>
                  </div>
                  <h1 className="al-title">
                    <b>Forgot</b> your password?
                  </h1>
                  <p className="al-subtitle">
                    Enter your email and date of birth to receive a password reset link
                  </p>
                </div>

                {error && (
                  <div className="al-alert al-alert-err">
                    <AlertCircle size={13} /><span>{error}</span>
                  </div>
                )}

                <form className="al-form" onSubmit={handleSubmit}>
                  <div className="al-field">
                    <label className="al-label">Email address</label>
                    <div className="al-input-wrap">
                      <Mail size={15} className="al-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        className="al-input al-input-icon"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="al-field">
                    <label className="al-label">Date of birth</label>
                    <div className="al-input-wrap">
                      <Calendar size={15} className="al-icon" />
                      <input
                        id="forgot-dob"
                        type="date"
                        className="al-input al-input-icon al-input-date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                      />
                    </div>
                    <span className="al-field-hint">
                      Required for identity verification
                    </span>
                  </div>

                  <button
                    id="forgot-submit"
                    type="submit"
                    className="al-submit"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <span className="al-spinner" />
                      : <><span>Send Reset Link</span><ArrowRight size={16} /></>}
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
