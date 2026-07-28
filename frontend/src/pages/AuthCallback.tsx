import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { api } from '../api';
import AmbientOrbs from '../components/AmbientOrbs';
import './Auth.css';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        // Wait for session to be established
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          if (isMounted) navigate('/login');
          return;
        }

        if (session) {
          try {
            const profile = await api.getProfile();
            // Check if it's a new profile (e.g. no location or income band)
            if (!profile.location && !profile.income_band && !profile.housing_situation) {
              if (isMounted) navigate('/dashboard');
            } else {
              if (isMounted) navigate('/dashboard');
            }
          } catch (err: any) {
            console.error("Profile fetch failed:", err);
            if (isMounted) setAuthError(err.message || "Failed to load user profile.");
          }
        } else {
          if (isMounted) navigate('/login');
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        if (isMounted) navigate('/login');
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AmbientOrbs intensity={0.6} />
      <div className="auth-logo">
        <span className="wordmark">FinScenario</span>
      </div>
      <motion.div
        className="auth-card glass-panel-strong"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      >
        <div className="auth-header" style={{ textAlign: 'center', marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {authError ? (
            <>
              <h2 style={{ color: 'var(--red-11)' }}>Authentication Error</h2>
              <p style={{ color: 'var(--red-11)', marginTop: '8px' }}>{authError}</p>
              <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '16px' }}>Return to Login</button>
            </>
          ) : (
            <>
              <h2>Verifying...</h2>
              <p>Please wait while we complete your sign in.</p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthCallback;
