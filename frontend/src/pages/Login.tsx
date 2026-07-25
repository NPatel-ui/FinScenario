import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, getURL } from '../lib/supabase';
import AmbientOrbs from '../components/AmbientOrbs';
import FloatingLabelInput from '../components/FloatingLabelInput';
import './Auth.css';

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 25 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email first.');
        } else {
          setError(authError.message);
        }
        return;
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (resendError) {
      setError(resendError.message);
    } else {
      setError('Verification email resent. Please check your inbox.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <motion.div
      className="auth-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AmbientOrbs intensity={0.6} />

      <div className="auth-logo">
        <Link to="/" className="wordmark" style={{ textDecoration: 'none' }}>
          FinScenario
        </Link>
      </div>

      <motion.div
        className="auth-card glass-panel-strong"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
      >
        <div className="auth-header">
          <h2>Good to see you again.</h2>
          <p>Log in to your account.</p>
        </div>

        {error && (
          <div className="auth-error" style={{
            background: 'rgba(255, 107, 91, 0.1)',
            border: '1px solid rgba(255, 107, 91, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)',
            color: 'var(--coral)',
            fontSize: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <span>{error}</span>
            {error === 'Please verify your email first.' && (
              <button
                type="button"
                onClick={handleResendVerification}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'inherit', textDecoration: 'underline',
                  cursor: 'pointer', textAlign: 'left', font: 'inherit'
                }}
              >
                Resend verification email
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <FloatingLabelInput
            label="Email"
            type="email"
            id="login-email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div style={{ position: 'relative' }}>
            <FloatingLabelInput
              label="Password"
              type="password"
              id="login-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Link to="/forgot-password" style={{
              position: 'absolute', right: '0', bottom: '-22px',
              fontSize: '0.75rem', color: 'var(--ink-muted)'
            }}>
              Forgot password?
            </Link>
          </div>

          <div className="auth-actions mt-4">
            <button
              type="submit"
              className="btn btn-primary w-full"
              id="login-submit"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </div>
        </form>

        <div className="auth-divider" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          margin: 'var(--space-5) 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--ink-faint)' }} />
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--ink-faint)' }} />
        </div>

        <button
          className="btn btn-outline w-full"
          onClick={handleGoogleLogin}
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          Continue with Google
        </button>

        <div className="auth-footer">
          <p>New here? <Link to="/signup">Create an account</Link></p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;
