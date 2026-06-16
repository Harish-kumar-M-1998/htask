import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@htask/shared';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { defaultHomePath } from '@/lib/auth';
import './login.css';

type SubmitPhase = 'idle' | 'loading' | 'done';

function EyeIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24" aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <rect className="ring" x="3" y="3" width="58" height="58" rx="18" />
      <path className="h-mark" d="M22 20h5v9h10v-9h5v24h-5v-10H27v10h-5z" />
    </svg>
  );
}

export function LoginPage() {
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'manager@htask.io', password: 'Manager@123' },
  });

  const onSubmit = async (data: LoginInput) => {
    if (phase === 'loading') return;

    setPhase('loading');
    setError('');

    try {
      const res = await authApi.login(data.email, data.password);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      setPhase('done');

      window.setTimeout(() => {
        navigate(defaultHomePath(res.data.user));
      }, 700);
    } catch {
      setPhase('idle');
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden />

      <div className="login-wrap">
        <div className="login-logo">
          <LogoMark />
        </div>

        <h1 className="login-title">Welcome to Htask</h1>
        <p className="login-tag">Enterprise Task &amp; Workflow Management</p>

        <form className="login-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="login-field f1">
            <label htmlFor="email">Email</label>
            <div className="login-ul">
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="login-field-error">{errors.email.message}</p>
            )}
          </div>

          <div className="login-field f2">
            <label htmlFor="password">Password</label>
            <div className="login-ul">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                className="login-eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                <EyeIcon />
              </button>
            </div>
            {errors.password && (
              <p className="login-field-error">{errors.password.message}</p>
            )}
          </div>

          <div className="login-row">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className={`login-btn${phase === 'loading' ? ' loading' : ''}${phase === 'done' ? ' done' : ''}`}
            disabled={phase === 'loading' || phase === 'done'}
          >
            <span className="lbl">Sign in</span>
            <span className="sheen" aria-hidden />
            <span className="spin">
              <SpinnerIcon />
            </span>
            <span className="ck">
              <CheckIcon />
            </span>
          </button>
        </form>

        <div className="login-bot">
          New to Htask?{' '}
          <a href="#" onClick={(e) => e.preventDefault()}>
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
