import React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface AmbientOrbsProps {
  intensity?: number; // 0-1, controls opacity. Default 1
}

const AmbientOrbs: React.FC<AmbientOrbsProps> = ({ intensity = 1 }) => {
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 20, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 20, damping: 30 });

  const parallax1X = useTransform(smoothX, (v) => v * 0.015);
  const parallax1Y = useTransform(smoothY, (v) => v * 0.015);
  const parallax2X = useTransform(smoothX, (v) => v * -0.01);
  const parallax2Y = useTransform(smoothY, (v) => v * -0.01);
  const parallax3X = useTransform(smoothX, (v) => v * 0.008);
  const parallax3Y = useTransform(smoothY, (v) => v * -0.012);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    mouseX.set(clientX - window.innerWidth / 2);
    mouseY.set(clientY - window.innerHeight / 2);
  };

  const orbOpacity = 0.3 * intensity;

  const driftTransition = (dur: number) =>
    shouldReduceMotion
      ? {}
      : {
          duration: dur,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut',
        };

  return (
    <div className="orbs-container" onMouseMove={handleMouseMove}>
      {/* Orb 1 — Coral, top-right */}
      <motion.div
        className="ambient-orb orb-coral"
        style={{
          top: '-8%',
          right: '-5%',
          opacity: orbOpacity,
          x: parallax1X,
          y: parallax1Y,
        }}
        animate={shouldReduceMotion ? {} : {
          x: [0, 60, -30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={driftTransition(28)}
      />

      {/* Orb 2 — Teal, bottom-left */}
      <motion.div
        className="ambient-orb orb-teal"
        style={{
          bottom: '-10%',
          left: '-8%',
          opacity: orbOpacity * 0.9,
          x: parallax2X,
          y: parallax2Y,
        }}
        animate={shouldReduceMotion ? {} : {
          x: [0, -50, 40, 0],
          y: [0, -30, 50, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={driftTransition(34)}
      />

      {/* Orb 3 — Amber, center */}
      <motion.div
        className="ambient-orb orb-amber"
        style={{
          top: '40%',
          left: '30%',
          opacity: orbOpacity * 0.7,
          x: parallax3X,
          y: parallax3Y,
        }}
        animate={shouldReduceMotion ? {} : {
          x: [0, 40, -60, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.1, 0.85, 1],
        }}
        transition={driftTransition(22)}
      />

      {/* Orb 4 — subtle second coral, bottom-right */}
      <motion.div
        className="ambient-orb"
        style={{
          width: 300,
          height: 300,
          borderRadius: '50%',
          filter: 'blur(100px)',
          background: 'var(--coral)',
          bottom: '20%',
          right: '15%',
          opacity: orbOpacity * 0.5,
        }}
        animate={shouldReduceMotion ? {} : {
          x: [0, -30, 50, 0],
          y: [0, 40, -20, 0],
        }}
        transition={driftTransition(26)}
      />
    </div>
  );
};

export default AmbientOrbs;
