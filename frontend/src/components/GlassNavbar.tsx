import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

interface GlassNavbarProps {
  rightContent?: React.ReactNode;
  variant?: 'landing' | 'app';
}

/* Logo glyph: two converging flowing lines */
const LogoGlyph = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="wordmark-icon">
    <path
      d="M4 4C4 4 8 10 12 12C16 14 20 20 20 20"
      stroke="var(--teal)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M20 4C20 4 16 10 12 12C8 14 4 20 4 20"
      stroke="var(--coral)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const GlassNavbar: React.FC<GlassNavbarProps> = ({
  rightContent,
  variant = 'landing',
}) => {
  const [scrollY, setScrollY] = useState(0);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollProgress = Math.min(scrollY / 100, 1);
  const blurAmount = 12 + scrollProgress * 12;
  const bgOpacity = 0.4 + scrollProgress * 0.3;
  const paddingH = 32 - scrollProgress * 8;
  const marginH = 24 + scrollProgress * 0;

  return (
    <motion.nav
      className="glass-navbar"
      style={{
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        background: `rgba(255, 255, 255, ${bgOpacity})`,
        paddingLeft: paddingH,
        paddingRight: paddingH,
      }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
    >
      <Link to="/" className="wordmark" style={{ textDecoration: 'none' }}>
        <LogoGlyph />
        FinScenario
      </Link>

      <div className="nav-right">
        {rightContent || (
          session ? (
            <button onClick={handleSignOut} className="btn btn-outline btn-sm">
              Sign Out
            </button>
          ) : variant === 'landing' ? (
            <Link to="/login" className="btn btn-outline btn-sm" id="nav-login-btn">
              Log In
            </Link>
          ) : null
        )}
      </div>
    </motion.nav>
  );
};

export default GlassNavbar;
