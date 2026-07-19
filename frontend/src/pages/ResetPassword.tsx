import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AmbientOrbs from '../components/AmbientOrbs';
import FloatingLabelInput from '../components/FloatingLabelInput';
import './Auth.css';

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 25 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if we actually have a session or recovery token hash in URL
  useEffect(() => {
    // Supabase usually sets the session in the background when clicking a recovery link
    // We can also verify it here, but it's not strictly necessary for rendering the form
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Instead of a toast system (which isn't implemented in the project yet),
      // we can redirect to dashboard with a small delay or directly
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
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
        <span className="wordmark">FinScenario</span>
      </div>

      <motion.div
        className="auth-card glass-panel-strong"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
      >
        <div className="auth-header">
          <h2>Update your password.</h2>
          <p>Please enter your new password below.</p>
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
            label="New Password"
            type="password"
            id="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <FloatingLabelInput
            label="Confirm Password"
            type="password"
            id="confirm-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="auth-actions mt-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ResetPassword;
