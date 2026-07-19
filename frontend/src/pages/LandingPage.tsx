import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { EyeOff, FileText, Shield, Trash2, ArrowRight } from 'lucide-react';
import GlassNavbar from '../components/GlassNavbar';
import AmbientOrbs from '../components/AmbientOrbs';
import TheCurrent from '../components/TheCurrent';
import TiltCard from '../components/TiltCard';
import './LandingPage.css';

/* ── Kinetic word entrance ── */
const KineticWord: React.FC<{ word: string; index: number }> = ({ word, index }) => {
  const offsets = [
    { x: -30, y: 20, rotate: -3 },
    { x: 20, y: -15, rotate: 2 },
    { x: -10, y: 25, rotate: -1 },
    { x: 15, y: -20, rotate: 3 },
    { x: -25, y: 10, rotate: -2 },
  ];
  const o = offsets[index % offsets.length];

  return (
    <motion.span
      className="kinetic-word"
      initial={{ opacity: 0, x: o.x, y: o.y, rotate: o.rotate }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 14,
        delay: 0.15 + index * 0.08,
      }}
    >
      {word}{' '}
    </motion.span>
  );
};

/* ── Trust icon with SVG draw-in ── */
const TrustItem: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className="trust-item"
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
    >
      <span className="trust-icon">{icon}</span>
      <span>{text}</span>
    </motion.div>
  );
};

/* ── How It Works step content ── */
const steps = [
  {
    label: 'DESCRIBE',
    title: 'Tell us your situation',
    description: 'Chat naturally about your financial question — renting vs buying, leasing vs financing, paying off debt vs investing.',
  },
  {
    label: 'CALCULATE',
    title: 'We research & run the math',
    description: 'Live market rates are pulled. Deterministic formulas run — never guessing, never hallucinating numbers.',
  },
  {
    label: 'DECIDE',
    title: 'See which path wins',
    description: 'A clear recommendation with every number cited. Adjust variables to explore what-if scenarios.',
  },
];

const LandingPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Hero demo state
  const [price, setPrice] = useState(35000);
  const leaseCost = Math.round(price * 0.45);
  const buyCost = Math.round(price * 0.62);

  // Scroll-pinned "How it works"
  const hiwRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: hiwProgress } = useScroll({
    target: hiwRef,
    offset: ['start start', 'end start'],
  });
  const hiwX = useTransform(hiwProgress, [0, 1], ['0%', '-66.666%']);

  // Final CTA orb intensity
  const finalRef = useRef<HTMLDivElement>(null);
  const finalInView = useInView(finalRef, { once: false, margin: '-100px' });

  const headlineWords = ['Which', 'path', 'actually', 'wins?'];

  return (
    <div className="landing-page">
      <AmbientOrbs intensity={finalInView ? 1.3 : 1} />

      <div className="landing-content">
        <GlassNavbar variant="landing" />

        <main>
          {/* ── Hero ── */}
          <section className="hero container">
            <div className="hero-text">
              <h1>
                {headlineWords.map((word, i) => (
                  <KineticWord key={word} word={word} index={i} />
                ))}
              </h1>
              <motion.p
                className="hero-sub"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                See the real cost of lease vs. buy, rent vs. own, or paying down
                debt vs. investing — without linking your bank account.
              </motion.p>
              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                <Link to="/signup" className="btn btn-primary btn-lg" id="hero-cta">
                  See your number <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" className="link-underline hero-link">
                  or watch a live example
                </a>
              </motion.div>
            </div>

            <motion.div
              className="hero-demo"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0, 0, 0.2, 1] }}
            >
              <TiltCard className="hero-demo-card glass-panel">
                <div className="demo-header">
                  <span className="section-label">LIVE SCENARIO</span>
                  <h3>Lease vs Buy</h3>
                </div>
                <div className="demo-slider-row">
                  <label>Vehicle Price</label>
                  <div className="demo-slider-wrap">
                    <span className="mono-nums demo-price">${price.toLocaleString()}</span>
                    <input
                      type="range"
                      min={15000}
                      max={80000}
                      step={1000}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="demo-slider"
                    />
                  </div>
                </div>
                <TheCurrent
                  valueA={leaseCost}
                  valueB={buyCost}
                  labelA="Lease 36mo"
                  labelB="Buy 60mo"
                  mode="interactive"
                />
              </TiltCard>
            </motion.div>
          </section>

          {/* ── Trust Strip ── */}
          <section className="trust-strip">
            <div className="container trust-row">
              <TrustItem icon={<EyeOff size={18} />} text="No bank login" />
              <TrustItem icon={<FileText size={18} />} text="No documents uploaded" />
              <TrustItem icon={<Shield size={18} />} text="Every number cited" />
              <TrustItem icon={<Trash2 size={18} />} text="Delete your data anytime" />
            </div>
          </section>

          {/* ── How It Works — Scroll-Pinned Horizontal ── */}
          <section id="how-it-works" className="hiw-section" ref={hiwRef}>
            <div className="hiw-sticky">
              <div className="container">
                <span className="section-label">HOW IT WORKS</span>
                <h2>Three steps to clarity</h2>
              </div>
              <div className="hiw-track-wrapper">
                <motion.div className="hiw-track" style={{ x: shouldReduceMotion ? 0 : hiwX }}>
                  {steps.map((step, i) => (
                    <div className="hiw-slide" key={i}>
                      <TiltCard className="hiw-card glass-panel-strong">
                        <span className="hiw-step-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="section-label">{step.label}</span>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                      </TiltCard>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── Example Scenarios ── */}
          <section className="examples-section container">
            <h2>Example scenarios</h2>
            <div className="examples-grid">
              {[
                { title: 'Rent vs Buy — Austin, TX', verdict: 'Buying saves $47,200 over 7 years', a: 312000, b: 264800 },
                { title: 'Lease vs Buy — Honda CR-V', verdict: 'Buying costs $3,100 less over 5 years', a: 24100, b: 21000 },
                { title: 'Pay Off Student Loans vs Invest', verdict: 'Investing earns $12,400 more at 7% avg return', a: 42000, b: 54400 },
              ].map((ex, i) => (
                <TiltCard className="example-card glass-panel" key={i}>
                  <span className="section-label">EXAMPLE</span>
                  <h4>{ex.title}</h4>
                  <div className="example-current">
                    <TheCurrent valueA={ex.a} valueB={ex.b} mode="compact" />
                  </div>
                  <p className="example-verdict mono-nums">{ex.verdict}</p>
                </TiltCard>
              ))}
            </div>
          </section>

          {/* ── Privacy ── */}
          <section className="privacy-section container">
            <TiltCard className="privacy-card glass-panel-strong">
              <h3>Your data stays yours</h3>
              <p>
                FinScenario never connects to your bank. We don't ask for account
                numbers or documents. Every piece of data you enter can be edited or
                permanently deleted at any time. The numbers come from public market
                data, cited with their source and date.
              </p>
            </TiltCard>
          </section>

          {/* ── Final CTA Band ── */}
          <section className="final-cta" ref={finalRef}>
            <div className="container final-cta-inner">
              <h2>Ready to see which path wins?</h2>
              <Link to="/signup" className="btn btn-primary btn-lg" id="final-cta">
                See your number <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="landing-footer">
          <div className="divider" />
          <div className="container">
            <p>© 2026 FinScenario. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
