import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@htask/shared';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { defaultHomePath } from '@/lib/auth';
import './login.css';

type AuthView = 'in' | 'up';
type SubmitPhase = 'idle' | 'loading' | 'done';

const EYE_OPEN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function SpinnerIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LoginPage() {
  const [view, setView] = useState<AuthView>('in');
  const [loginError, setLoginError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginPhase, setLoginPhase] = useState<SubmitPhase>('idle');
  const [registerPhase, setRegisterPhase] = useState<SubmitPhase>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = (location.state as { message?: string } | null)?.message;
  const setUser = useAuthStore((s) => s.setUser);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'manager@htask.io', password: 'Manager@123' },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '' },
  });

  const switchView = (next: AuthView) => {
    setView(next);
    setLoginError('');
    setRegisterError('');
    setRegisterMessage('');
    setLoginPhase('idle');
    setRegisterPhase('idle');
  };

  const onLogin = async (data: LoginInput) => {
    if (loginPhase === 'loading') return;

    setLoginPhase('loading');
    setLoginError('');

    try {
      const res = await authApi.login(data.email, data.password);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      setLoginPhase('done');

      window.setTimeout(() => {
        navigate(defaultHomePath(res.data.user));
      }, 700);
    } catch {
      setLoginPhase('idle');
      setLoginError('Invalid email or password');
    }
  };

  const onRegister = async (data: RegisterInput) => {
    if (registerPhase === 'loading') return;

    setRegisterPhase('loading');
    setRegisterError('');
    setRegisterMessage('');

    try {
      const res = await authApi.register(data);
      setRegisterPhase('done');
      setRegisterMessage(res.data.message);
      registerForm.reset();
    } catch (err: unknown) {
      setRegisterPhase('idle');
      const apiMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
              ?.message
          : undefined;
      setRegisterError(apiMessage ?? 'Could not create account. Try a different email.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden>
        <div className="login-sheen" />
        <div className="login-ember" />
        <div className="login-vlines" />
      </div>

      <div className="login-scroll-wrap">
        <div className="login-card">
          <div className="login-logo" aria-hidden>
            H
          </div>

          <h1 className="login-title">Welcome to Htask</h1>
          <p className="login-tag">Enterprise Task &amp; Workflow Management</p>

          <div className="login-seg" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'in'}
              className={view === 'in' ? 'on' : ''}
              onClick={() => switchView('in')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'up'}
              className={view === 'up' ? 'on' : ''}
              onClick={() => switchView('up')}
            >
              Create account
            </button>
          </div>

          {view === 'in' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate>
              <div className="login-field">
                <label htmlFor="login-email">Email</label>
                <div className="login-input-wrap">
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="login-field-error">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="login-field">
                <label htmlFor="login-password">Password</label>
                <div className="login-input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="has-eye"
                    placeholder="Enter your password"
                    {...loginForm.register('password')}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? EYE_OPEN : EYE_OFF}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="login-field-error">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="login-meta">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Remember me
                </label>
                <a className="login-link" href="#" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>

              {flashMessage && <p className="login-success">{flashMessage}</p>}
              {loginError && <p className="login-error">{loginError}</p>}

              <button
                type="submit"
                className={`login-btn${loginPhase === 'loading' ? ' loading' : ''}${loginPhase === 'done' ? ' done' : ''}`}
                disabled={loginPhase === 'loading' || loginPhase === 'done'}
              >
                <span className="lbl">Sign in</span>
                <span className="spin">
                  <SpinnerIcon />
                </span>
                <span className="ck">
                  <CheckIcon />
                </span>
              </button>

              <p className="login-foot">
                New to Htask?{' '}
                <button type="button" className="linkish" onClick={() => switchView('up')}>
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} noValidate>
              <div className="login-field">
                <div className="login-row2">
                  <div>
                    <label htmlFor="first-name">First name</label>
                    <div className="login-input-wrap">
                      <input
                        id="first-name"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Gopinath"
                        {...registerForm.register('firstName')}
                      />
                    </div>
                    {registerForm.formState.errors.firstName && (
                      <p className="login-field-error">{registerForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="last-name">Last name</label>
                    <div className="login-input-wrap">
                      <input
                        id="last-name"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Kathirvel"
                        {...registerForm.register('lastName')}
                      />
                    </div>
                    {registerForm.formState.errors.lastName && (
                      <p className="login-field-error">{registerForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="register-email">Work email</label>
                <div className="login-input-wrap">
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...registerForm.register('email')}
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="login-field-error">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <p className="login-hint">
                We&apos;ll email you a temporary password to sign in. New accounts are added as team members.
              </p>

              {registerError && <p className="login-error">{registerError}</p>}
              {registerMessage && <p className="login-success">{registerMessage}</p>}

              <button
                type="submit"
                className={`login-btn${registerPhase === 'loading' ? ' loading' : ''}${registerPhase === 'done' ? ' done' : ''}`}
                disabled={registerPhase === 'loading' || registerPhase === 'done'}
              >
                <span className="lbl">Create account</span>
                <span className="spin">
                  <SpinnerIcon />
                </span>
                <span className="ck">
                  <CheckIcon />
                </span>
              </button>

              <p className="login-foot">
                Already have an account?{' '}
                <button type="button" className="linkish" onClick={() => switchView('in')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
