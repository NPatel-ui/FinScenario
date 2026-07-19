import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AmbientOrbs from '../components/AmbientOrbs';
import FloatingLabelInput from '../components/FloatingLabelInput';
import './Auth.css';

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 25 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If email confirmation is required, Supabase returns user but no session
      if (data.user && !data.session) {
        setConfirmationSent(true);
        return;
      }

      // Store name for greeting (also saved in Supabase user metadata)
      if (firstName) {
        localStorage.setItem('username', firstName.trim());
      }

      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
    }
  };

  if (confirmationSent) {
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
          <Link to="/" className="wordmark" style={{ textDecoration: 'none' }}>FinScenario</Link>
        </div>
        <motion.div
          className="auth-card glass-panel-strong"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
        >
          <div className="auth-header">
            <h2>Check your email to verify your account</h2>
            <p style={{ marginTop: 'var(--space-3)' }}>
              We sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account, then come back and log in.
            </p>
          </div>
          <div className="auth-footer">
            <p><Link to="/login">Back to Log In</Link></p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
          <h2>Create your account.</h2>
          <p>Start comparing financial paths in minutes.</p>
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
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="auth-row">
            <FloatingLabelInput
              label="First Name"
              type="text"
              id="signup-first"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <FloatingLabelInput
              label="Last Name"
              type="text"
              id="signup-last"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <FloatingLabelInput
            label="Email"
            type="email"
            id="signup-email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <FloatingLabelInput
            label="Password"
            type="password"
            id="signup-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="auth-actions mt-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
              id="signup-submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
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
          onClick={handleGoogleSignup}
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          Continue with Google
        </button>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Signup;
