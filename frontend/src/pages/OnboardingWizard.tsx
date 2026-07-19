import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../api';
import AmbientOrbs from '../components/AmbientOrbs';
import TheCurrent from '../components/TheCurrent';
import FloatingLabelInput from '../components/FloatingLabelInput';
import './Onboarding.css';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } },
};

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Form State
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [income, setIncome] = useState('');
  const [housing, setHousing] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [debt, setDebt] = useState('');
  const [risk, setRisk] = useState<number>(1);
  const [rateAlerts, setRateAlerts] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalSteps = 8;

  const nextStep = () => { setDirection(1); setStep(s => Math.min(s + 1, totalSteps)); };
  const prevStep = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const toggleGoal = (goal: string) => {
    setGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return country.trim().length > 0 && state.trim().length > 0;
      case 2: return income !== '';
      case 3: return housing !== '';
      case 4: return goals.length > 0;
      case 5: return debt !== '';
      default: return true;
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const riskLabels = ['cautious', 'balanced', 'growth'];
      await api.updateProfile({
        location: [country, state, zipCode].filter(Boolean).join(', '),
        income_band: income || undefined,
        housing_situation: housing || undefined,
        financial_goals: goals.length > 0 ? goals : undefined,
        debt_situation: debt || undefined,
        risk_tolerance: riskLabels[risk] || 'balanced',
        notification_prefs: {
          rate_change_alerts: rateAlerts,
          scenario_check_in_reminders: checkInReminders,
        },
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
      // Still navigate — profile save is best-effort during onboarding
    } finally {
      setSaving(false);
    }
    navigate('/dashboard');
  };

  // Slide transition variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.96,
    }),
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="wizard-content center-text">
            <h2>Welcome to FinScenario</h2>
            <p className="mt-4">
              We'll ask a few quick questions so your scenarios are personalized from the start.
              Nothing here is sensitive — no account numbers, no documents, and you can change or delete any of it later.
            </p>
          </div>
        );
      case 1:
        return (
          <div className="wizard-content">
            <h2>Where are you located?</h2>
            <p className="sub-label">Helps us estimate cost-of-living and accurate tax rates.</p>
            <div className="wizard-input-wrap mt-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <FloatingLabelInput
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <FloatingLabelInput
                    label="State / Province"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <FloatingLabelInput
                    label="ZIP / Postal"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="wizard-content">
            <h2>Household income range?</h2>
            <p className="sub-label">Used for affordability estimates.</p>
            <div className="chip-grid">
              {['Under $60k', '$60k – $90k', '$90k – $150k', 'Over $150k', 'Prefer not to say'].map(opt => (
                <motion.button
                  key={opt}
                  className={`chip ${income === opt ? 'active' : ''}`}
                  onClick={() => setIncome(opt)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >{opt}</motion.button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="wizard-content">
            <h2>Current housing situation</h2>
            <div className="chip-grid">
              {['Rent', 'Own', 'Living with family / Other'].map(opt => (
                <motion.button
                  key={opt}
                  className={`chip ${housing === opt ? 'active' : ''}`}
                  onClick={() => setHousing(opt)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >{opt}</motion.button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="wizard-content">
            <h2>Primary financial goals</h2>
            <p className="sub-label">Select all that apply.</p>
            <div className="chip-grid">
              {['Buying a home', 'Buying/leasing a car', 'Paying off debt', 'Growing savings/investments', 'Just exploring'].map(opt => (
                <motion.button
                  key={opt}
                  className={`chip ${goals.includes(opt) ? 'active' : ''}`}
                  onClick={() => toggleGoal(opt)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >{opt}</motion.button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="wizard-content">
            <h2>Any existing debt?</h2>
            <p className="sub-label">Optional. Helps tailor debt-payoff scenarios.</p>
            <div className="chip-grid">
              {['None', 'Credit Cards', 'Student Loans', 'Auto Loan', 'Prefer not to say'].map(opt => (
                <motion.button
                  key={opt}
                  className={`chip ${debt === opt ? 'active' : ''}`}
                  onClick={() => setDebt(opt)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >{opt}</motion.button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="wizard-content">
            <h2>Risk tolerance</h2>
            <p className="sub-label">Sets default assumptions for investment returns.</p>
            <div className="slider-container">
              <input
                type="range"
                min="0" max="2"
                value={risk}
                onChange={(e) => setRisk(parseInt(e.target.value))}
                className="risk-slider"
              />
              <div className="slider-labels">
                <span className={risk === 0 ? 'active' : ''}>Cautious</span>
                <span className={risk === 1 ? 'active' : ''}>Balanced</span>
                <span className={risk === 2 ? 'active' : ''}>Growth</span>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="wizard-content">
            <h2>Stay on track</h2>
            <p className="sub-label">Want reminders when rates change significantly?</p>
            <div className="toggle-list">
              <label className="toggle-row">
                <span>Rate change alerts</span>
                <input type="checkbox" checked={rateAlerts} onChange={(e) => setRateAlerts(e.target.checked)} className="toggle-input" />
              </label>
              <label className="toggle-row">
                <span>Scenario check-in reminders</span>
                <input type="checkbox" checked={checkInReminders} onChange={(e) => setCheckInReminders(e.target.checked)} className="toggle-input" />
              </label>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="wizard-content center-text completion-screen">
            <div className="completion-current">
              <TheCurrent valueA={45000} valueB={38000} mode="interactive" labelA="Path A" labelB="Path B" />
            </div>
            <h2 className="mt-6">All set.</h2>
            <p className="mt-2">
              We've already pulled today's average rates to help you get started.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="onboarding-page flex-center"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AmbientOrbs intensity={0.5} />

      <motion.div
        className="wizard-container glass-panel-strong"
        layout
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* ── Progress Dots ── */}
        <div className="progress-dots">
          {Array.from({ length: totalSteps + 1 }).map((_, i) => (
            <motion.div
              key={i}
              className={`progress-dot ${i <= step ? 'filled' : ''} ${i === step ? 'current' : ''}`}
              animate={{
                scale: i === step ? 1.3 : 1,
                backgroundColor: i <= step ? 'var(--teal)' : 'var(--ink-faint)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          ))}
        </div>

        {/* ── Step Content (Morph Transition) ── */}
        <div className="wizard-body">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="step-wrapper"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer Navigation ── */}
        <div className="wizard-footer">
          {step > 0 && step < totalSteps && (
            <button className="btn btn-ghost" onClick={prevStep}>
              <ArrowLeft size={18} /> Back
            </button>
          )}

          <div style={{ flex: 1 }} />

          {step < totalSteps && (
            <button
              className="btn btn-primary"
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              {step === 0 ? "Let's go" : 'Continue'} <ArrowRight size={18} />
            </button>
          )}

          {step === totalSteps && (
            <button className="btn btn-primary" onClick={handleComplete} disabled={saving}>
              {saving ? 'Saving…' : 'Start exploring'} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingWizard;
