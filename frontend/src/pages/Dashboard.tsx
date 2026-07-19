import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Car, TrendingUp } from 'lucide-react';
import { api } from '../api';
import type { Scenario, ScenarioType } from '../api';
import { useAuth } from '../lib/AuthContext';
import GlassNavbar from '../components/GlassNavbar';
import TheCurrent from '../components/TheCurrent';
import TiltCard from '../components/TiltCard';
import './Dashboard.css';

const pageVariants: any = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const itemVariants: any = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const scenarioTypes: { type: ScenarioType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: 'rent_vs_buy', label: 'Rent vs Buy', desc: 'Compare renting to buying a home', icon: <Home size={22} /> },
  { type: 'lease_vs_buy_car', label: 'Lease vs Buy', desc: 'Auto lease vs. purchase', icon: <Car size={22} /> },
  { type: 'debt_vs_invest', label: 'Debt vs Invest', desc: 'Pay off debt or invest the money', icon: <TrendingUp size={22} /> },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listScenarios()
      .then(setScenarios)
      .catch(err => console.error("Failed to load scenarios:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateScenario = async (type: ScenarioType) => {
    try {
      const scenario = await api.createScenario(type);
      navigate(`/scenario/${scenario.id}`);
    } catch (err) {
      console.error("Failed to create scenario:", err);
      const mockId = Math.random().toString(36).substring(7);
      navigate(`/scenario/${mockId}`);
    }
  };

  const getTitle = (type: string) =>
    type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getValues = (s: Scenario) => {
    if (!s.result) return { left: 0, right: 0 };
    const nb = s.result.numeric_breakdown;
    if (s.type === 'rent_vs_buy') {
      return { left: nb.total_cost_renting || 0, right: nb.total_cost_buying || 0 };
    } else if (s.type === 'lease_vs_buy_car') {
      return { left: nb.total_cost_leasing || 0, right: nb.total_cost_buying || 0 };
    } else if (s.type === 'debt_vs_invest') {
      return {
        left: nb.strategy_debt_first?.final_net_worth || 0,
        right: nb.strategy_invest_first?.final_net_worth || 0,
      };
    }
    return { left: 0, right: 0 };
  };

  const getRecommendation = (s: Scenario) => {
    const { left, right } = getValues(s);
    if (left === 0 && right === 0) return null;
    return {
      label: left > right ? 'Option B saves' : 'Option A saves',
      amount: Math.abs(left - right),
    };
  };

  return (
    <motion.div
      className="dashboard-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <GlassNavbar
        variant="app"
        rightContent={
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/settings')}>
            Settings
          </button>
        }
      />

      <main className="container dash-main">
        {/* ── Header ── */}
        <motion.header className="dash-header" variants={itemVariants}>
          <h1>{user?.user_metadata?.first_name ? `${user.user_metadata.first_name}'s scenarios` : 'Your scenarios'}</h1>
          <p>Pick up where you left off, or start a new comparison.</p>
        </motion.header>

        {/* ── New Scenario Tiles (Bento) ── */}
        <motion.div className="new-scenario-section" variants={itemVariants}>
          <span className="section-label">START NEW</span>
          <div className="scenario-tiles">
            {scenarioTypes.map((st) => (
              <TiltCard
                key={st.type}
                className="scenario-tile glass-panel"
              >
                <motion.button
                  className="tile-btn"
                  onClick={() => handleCreateScenario(st.type)}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="tile-icon">{st.icon}</span>
                  <span className="tile-label">{st.label}</span>
                  <span className="tile-desc">{st.desc}</span>
                </motion.button>
              </TiltCard>
            ))}
          </div>
        </motion.div>

        <div className="divider" style={{ margin: `${`var(--space-8)`} 0` }} />

        {/* ── Saved Scenarios ── */}
        <section className="saved-scenarios">
          <span className="section-label">SAVED SCENARIOS</span>
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={`skel-${i}`}
                  className="scenario-row-skeleton glass-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="skel-bar skel-w40" />
                  <div className="skel-bar skel-w60" />
                </motion.div>
              ))
            ) : scenarios.length === 0 ? (
              <motion.div
                key="empty"
                className="empty-state"
                variants={itemVariants}
              >
                <p>No scenarios yet — start with one above.</p>
                <motion.span
                  className="empty-arrow"
                  aria-hidden="true"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ↑
                </motion.span>
              </motion.div>
            ) : (
              scenarios.map((s) => {
                const rec = getRecommendation(s);
                const vals = getValues(s);
                return (
                  <motion.div
                    key={s.id}
                    className="scenario-row glass-panel"
                    variants={itemVariants}
                    layout
                    whileHover={{
                      y: -2,
                      boxShadow: '0 12px 40px rgba(21, 22, 43, 0.10)',
                    }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => navigate(`/scenario/${s.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="row-left">
                      <TheCurrent valueA={vals.left} valueB={vals.right} mode="compact" />
                      <div className="row-info">
                        <h3 className="row-title">{getTitle(s.type)}</h3>
                        <span className="row-date text-xs mono-nums">
                          {new Date(s.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="row-right">
                      {rec && (
                        <>
                          <span className="row-tag text-teal">{rec.label}</span>
                          <span className="row-amount mono-nums">
                            ${rec.amount.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </section>
      </main>
    </motion.div>
  );
};

export default Dashboard;
