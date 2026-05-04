'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Eye, EyeOff, ArrowRight, Mail, Lock, User, Shield,
  Calendar, Key, Check, AlertCircle, ChevronLeft,
} from 'lucide-react';
import {
  loginUser, verifyLoginOTP, resendLoginOTP,
  registerUser, verifySignupOTP, resendSignupOTP, getMe,
} from '../../lib/authApi';
import { setToken, getToken, clearToken } from '../../lib/auth';
import { BrandPanel } from './BrandPanel';
import './Auth.css';

/* ─────────────────────────────────────────────────────────
   OTP Input — 6-box grid
   ───────────────────────────────────────────────────────── */
function OTPInput({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { setTimeout(() => inputs.current[0]?.focus(), 100); }, []);

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = digit || ' ';
    onChange(arr.join(''));
    if (digit && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0);
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = value.padEnd(6, ' ').split('');
      if (arr[i].trim()) { arr[i] = ' '; onChange(arr.join('')); }
      else if (i > 0) { arr[i - 1] = ' '; onChange(arr.join('')); setTimeout(() => inputs.current[i - 1]?.focus(), 0); }
    } else if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) inputs.current[i + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ' '));
    setTimeout(() => inputs.current[Math.min(pasted.length, 5)]?.focus(), 0);
  };
  return (
    <div className="otp-grid">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i} ref={(el) => { inputs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          className={`otp-box ${value[i]?.trim() ? 'filled' : ''}`}
          value={value[i]?.trim() || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste} disabled={disabled} autoComplete="one-time-code" />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   URL token reader
   ───────────────────────────────────────────────────────── */
function SearchParamsReader({ onToken }: { onToken: (t: string) => void }) {
  const params = useSearchParams();
  useEffect(() => { const t = params?.get('token'); if (t) onToken(t); }, [params, onToken]);
  return null;
}



/* ─────────────────────────────────────────────────────────
   MAIN AUTH PAGE
   ───────────────────────────────────────────────────────── */
export default function AuthPage() {
  const router = useRouter();
  const pathname = usePathname();
  const view: 'login' | 'signup' = pathname?.includes('/signup') ? 'signup' : 'login';

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formReady, setFormReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('      ');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  useEffect(() => { const t = setTimeout(() => setFormReady(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getMe().then(() => router.replace('/dashboard')).catch(() => clearToken());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { setStep('form'); setOtp('      '); setError(''); setSuccessMsg(''); }, [view]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('verified') === '1') {
      setSuccessMsg('Account verified! You can now sign in.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const switchView = useCallback((target: 'login' | 'signup') => {
    if (view === target || isTransitioning) return;
    setIsTransitioning(true); setFormReady(false);
    setTimeout(() => {
      router.push(target === 'login' ? '/auth/login' : '/auth/signup');
      setTimeout(() => { setIsTransitioning(false); setFormReady(true); }, 50);
    }, 240);
  }, [view, isTransitioning, router]);

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60);
    const iv = setInterval(() => setResendCooldown((c) => {
      if (c <= 1) { clearInterval(iv); return 0; } return c - 1;
    }), 1000);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setIsLoading(true);
    try { await loginUser(email, password); setOtp('      '); setStep('otp'); startResendCooldown(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Login failed.'); }
    finally { setIsLoading(false); }
  };

  const handleLoginOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\s/g, '');
    if (code.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    setError(''); setIsLoading(true);
    try { const res = await verifyLoginOTP(email, code); setToken(res.data.data.payload.token); router.replace('/dashboard'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Invalid code.'); }
    finally { setIsLoading(false); }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password || !confirmPassword || !dateOfBirth) { setError('Please fill in all required fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setIsLoading(true);
    try {
      await registerUser({
        displayName, email, password, confirmPassword, dateOfBirth,
        ...(inviteToken.trim() ? { inviteToken: inviteToken.trim() } : {})
      });
      setOtp('      '); setStep('otp'); startResendCooldown();
    }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Registration failed.'); }
    finally { setIsLoading(false); }
  };

  const handleSignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\s/g, '');
    if (code.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    setError(''); setIsLoading(true);
    try { await verifySignupOTP(email, code); router.push('/auth/login?verified=1'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Invalid code.'); }
    finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      if (view === 'login') await resendLoginOTP(email); else await resendSignupOTP(email);
      startResendCooldown(); setError('');
    }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to resend.'); }
  };

  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let s = 0;
    if (pass.length >= 8) s++; if (/[A-Z]/.test(pass)) s++; if (/[0-9]/.test(pass)) s++; if (/[^A-Za-z0-9]/.test(pass)) s++;
    return { score: s, label: ['', 'Weak', 'Fair', 'Strong', 'Elite'][s], color: ['', '#f87171', '#fbbf24', '#34d399', '#22d3ee'][s] };
  };
  const strength = getStrength(password);
  const otpReady = otp.replace(/\s/g, '').length === 6;

  return (
    <div className="al-root">
      <div className="al-noise" />
      <Suspense fallback={null}><SearchParamsReader onToken={setInviteToken} /></Suspense>

      <div className="al-container">

        {/* ════════════ LEFT: Form panel ════════════ */}
        <div className="al-left">


          {/* Scrollable form body */}
          <div className={`al-body ${formReady ? 'ready' : ''}`}>

            {/* ── FORM STEP ── */}
            {step === 'form' && (
              <div className={`al-form-view ${isTransitioning ? 'exit' : ''}`}>
                <div className="al-form-head">
                  <h1 className="al-title">
                    {view === 'login'
                      ? <><b>Log in</b> to ByteBoom</>
                      : <><b>Create</b> your account</>}
                  </h1>
                  <p className="al-subtitle">
                    {view === 'login'
                      ? 'Enter your credentials to access your trading dashboard'
                      : 'Set up your ByteBoom trading profile to get started'}
                  </p>
                </div>

                {successMsg && (
                  <div className="al-alert al-alert-ok">
                    <Check size={13} /><span>{successMsg}</span>
                  </div>
                )}
                {error && (
                  <div className="al-alert al-alert-err">
                    <AlertCircle size={13} /><span>{error}</span>
                  </div>
                )}

                {/* ── LOGIN FORM ── */}
                {view === 'login' && (
                  <form className="al-form" onSubmit={handleLoginSubmit}>
                    <div className="al-field">
                      <label className="al-label">Email</label>
                      <div className="al-input-wrap">
                        <Mail size={15} className="al-icon" />
                        <input type="email" className="al-input al-input-icon"
                          placeholder="Email Address" value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email" required />
                      </div>
                    </div>

                    <div className="al-field">
                      <label className="al-label">Password</label>
                      <div className="al-input-wrap">
                        <Lock size={15} className="al-icon" />
                        <input type={showPassword ? 'text' : 'password'}
                          className="al-input al-input-icon al-input-pr"
                          placeholder="Password" value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password" required />
                        <button type="button" className="al-eye" tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <a href="/auth/forgot-password" className="al-forgot">Forgot password?</a>

                    <button type="submit" className="al-submit" disabled={isLoading}>
                      {isLoading ? <span className="al-spinner" /> : <><span>Login</span><ArrowRight size={16} /></>}
                    </button>

                    <div className="al-divider"><span>or</span></div>

                    <p className="al-switch">
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => switchView('signup')}>Sign Up</button>
                    </p>
                  </form>
                )}

                {/* ── SIGNUP FORM ── */}
                {view === 'signup' && (
                  <form className="al-form" onSubmit={handleSignupSubmit}>
                    <div className="al-field">
                      <label className="al-label">Full name</label>
                      <div className="al-input-wrap">
                        <User size={15} className="al-icon" />
                        <input type="text" className="al-input al-input-icon"
                          placeholder="John Doe" value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          autoComplete="name" required />
                      </div>
                    </div>

                    <div className="al-field">
                      <label className="al-label">Email address</label>
                      <div className="al-input-wrap">
                        <Mail size={15} className="al-icon" />
                        <input type="email" className="al-input al-input-icon"
                          placeholder="you@example.com" value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email" required />
                      </div>
                    </div>

                    <div className="al-field">
                      <label className="al-label">Date of birth</label>
                      <div className="al-input-wrap">
                        <Calendar size={15} className="al-icon" />
                        <input type="date" className="al-input al-input-icon al-input-date"
                          value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
                      </div>
                    </div>

                    <div className="al-fields-row">
                      <div className="al-field">
                        <label className="al-label">Password</label>
                        <div className="al-input-wrap">
                          <Lock size={15} className="al-icon" />
                          <input type={showPassword ? 'text' : 'password'}
                            className="al-input al-input-icon al-input-pr"
                            placeholder="Create password" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password" required />
                          <button type="button" className="al-eye" tabIndex={-1}
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {password && (
                          <div className="al-strength">
                            <div className="al-strength-bars">
                              {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`al-bar ${i <= strength.score ? 'on' : ''}`}
                                  style={{ background: i <= strength.score ? strength.color : undefined }} />
                              ))}
                            </div>
                            <span className="al-strength-lbl" style={{ color: strength.color }}>{strength.label}</span>
                          </div>
                        )}
                      </div>

                      <div className="al-field">
                        <label className="al-label">Confirm</label>
                        <div className="al-input-wrap">
                          <Shield size={15} className="al-icon" />
                          <input type={showConfirmPassword ? 'text' : 'password'}
                            className="al-input al-input-icon al-input-pr"
                            placeholder="Repeat password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password" required />
                          <button type="button" className="al-eye" tabIndex={-1}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                          <span className="al-field-err">No match</span>
                        )}
                        {confirmPassword && password === confirmPassword && (
                          <span className="al-field-ok"><Check size={11} /> Match</span>
                        )}
                      </div>
                    </div>

                    <div className="al-field">
                      <label className="al-label">
                        Invite token <span className="al-optional">optional</span>
                      </label>
                      <div className="al-input-wrap">
                        <Key size={15} className="al-icon" />
                        <input type="text" className="al-input al-input-icon"
                          placeholder="Enter invite code if you have one"
                          value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} />
                      </div>
                    </div>

                    <button type="submit" className="al-submit" disabled={isLoading}>
                      {isLoading ? <span className="al-spinner" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
                    </button>

                    <p className="al-switch">
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchView('login')}>Log In</button>
                    </p>
                  </form>
                )}
              </div>
            )}

            {/* ── OTP STEP ── */}
            {step === 'otp' && (
              <div className="al-otp-card">
                <button className="al-back" type="button"
                  onClick={() => { setStep('form'); setError(''); setOtp('      '); }}>
                  <ChevronLeft size={14} /> Back
                </button>

                <div className="al-otp-icon-wrap">
                  <div className="al-otp-icon"><Mail size={24} /></div>
                </div>

                <h2 className="al-title" style={{ textAlign: 'center' }}>
                  {view === 'login' ? 'Verify your identity' : 'Verify your email'}
                </h2>
                <p className="al-subtitle" style={{ textAlign: 'center', marginBottom: 8 }}>
                  We sent a 6-digit code to
                </p>
                <p className="al-otp-email">{email}</p>

                <form className="al-otp-form" onSubmit={view === 'login' ? handleLoginOTP : handleSignupOTP}>
                  <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
                  {error && (
                    <div className="al-alert al-alert-err"><AlertCircle size={13} /><span>{error}</span></div>
                  )}
                  <button type="submit" className="al-submit" disabled={isLoading || !otpReady}>
                    {isLoading
                      ? <span className="al-spinner" />
                      : <><span>{view === 'login' ? 'Verify & Sign In' : 'Verify Account'}</span><Check size={16} /></>}
                  </button>
                </form>

                <p className="al-resend">
                  Didn&apos;t receive it?{' '}
                  <button type="button" className="al-resend-btn"
                    onClick={handleResend} disabled={resendCooldown > 0}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </p>
              </div>
            )}

          </div>{/* /al-body */}

          <p className="al-copyright">© 2026 ByteBoom. All rights reserved.</p>
        </div>

        {/* ════════════ RIGHT: Brand panel ════════════ */}
        <BrandPanel />

      </div>
    </div>
  );
}
