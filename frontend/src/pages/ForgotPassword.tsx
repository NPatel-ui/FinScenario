import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setConfirmationSent(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
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
            <h2>Check your email</h2>
            <p style={{ marginTop: 'var(--space-3)' }}>
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
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
          <h2>Reset your password.</h2>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
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

        <form onSubmit={handleSubmit} className="auth-form">
          <FloatingLabelInput
            label="Email"
            type="email"
            id="reset-email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="auth-actions mt-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Sending link…' : 'Send reset link'}
            </button>
          </div>
        </form>

        <div className="auth-footer" style={{ marginTop: 'var(--space-5)' }}>
          <p>Remember your password? <Link to="/login">Log in</Link></p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;
