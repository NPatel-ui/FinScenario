import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxAngle?: number;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', maxAngle = 7 }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxAngle, -maxAngle]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxAngle, maxAngle]);

  return (
    <motion.div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        perspective: 1200,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 50px rgba(21, 22, 43, 0.12)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
};

export default TiltCard;
