import React, { useEffect, useRef, useMemo } from 'react';
import { motion, useSpring, useReducedMotion, useMotionValue, useTransform } from 'framer-motion';
import './TheCurrent.css';

interface TheCurrentProps {
  valueA: number;
  valueB: number;
  labelA?: string;
  labelB?: string;
  mode?: 'interactive' | 'ambient' | 'compact';
}

/* Generates a wave-like SVG path for the liquid surface */
function wavePath(width: number, fillY: number, time: number, amplitude: number): string {
  const points: string[] = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const y = fillY + Math.sin((i / segments) * Math.PI * 2 + time) * amplitude
                    + Math.sin((i / segments) * Math.PI * 3 + time * 1.3) * (amplitude * 0.5);
    points.push(`${x},${y}`);
  }
  return `M0,${fillY + amplitude + 10} L${points.map(p => `L${p}`).join(' ')} L${width},${fillY + amplitude + 10} Z`;
}

const Bubble: React.FC<{ tubeWidth: number; tubeHeight: number; delay: number }> = ({ tubeWidth, tubeHeight, delay }) => {
  const size = 2 + Math.random() * 3;
  const x = 4 + Math.random() * (tubeWidth - 8);
  return (
    <motion.circle
      cx={x}
      cy={tubeHeight}
      r={size}
      fill="rgba(255,255,255,0.5)"
      initial={{ cy: tubeHeight, opacity: 0.5 }}
      animate={{ cy: -10, opacity: 0 }}
      transition={{
        duration: 2.5 + Math.random() * 2,
        delay: delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

const TheCurrent: React.FC<TheCurrentProps> = ({
  valueA,
  valueB,
  labelA = 'Option A',
  labelB = 'Option B',
  mode = 'interactive',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const svgRefA = useRef<SVGPathElement>(null);
  const svgRefB = useRef<SVGPathElement>(null);

  const maxVal = Math.max(valueA, valueB, 1);
  const fillRatioA = valueA / maxVal;
  const fillRatioB = valueB / maxVal;

  const springA = useSpring(fillRatioA, { stiffness: 45, damping: 12, mass: 1.2 });
  const springB = useSpring(fillRatioB, { stiffness: 45, damping: 12, mass: 1.2 });

  useEffect(() => { springA.set(fillRatioA); }, [fillRatioA, springA]);
  useEffect(() => { springB.set(fillRatioB); }, [fillRatioB, springB]);

  const aWins = valueA < valueB;
  const bWins = valueB < valueA;
  const tied = valueA === valueB;

  // Dimensions based on mode
  const dims = useMemo(() => {
    if (mode === 'compact') return { w: 20, h: 48, gap: 6, radius: 8 };
    if (mode === 'ambient') return { w: 16, h: 40, gap: 5, radius: 6 };
    return { w: 56, h: 180, gap: 20, radius: 22 };
  }, [mode]);

  // Wave animation loop for interactive & ambient modes
  useEffect(() => {
    if (shouldReduceMotion || mode === 'compact') return;

    const animate = () => {
      timeRef.current += 0.04;
      const t = timeRef.current;

      if (svgRefA.current) {
        const currentA = springA.get();
        const fillY = dims.h * (1 - currentA);
        const amp = mode === 'ambient' ? 2 : 3;
        svgRefA.current.setAttribute('d', wavePath(dims.w, fillY, t, amp));
      }

      if (svgRefB.current) {
        const currentB = springB.get();
        const fillY = dims.h * (1 - currentB);
        const amp = mode === 'ambient' ? 2 : 3;
        svgRefB.current.setAttribute('d', wavePath(dims.w, fillY, t + 1.5, amp));
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, dims, shouldReduceMotion, springA, springB]);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // ─── Compact Mode ─────────────────────────────────────────
  if (mode === 'compact') {
    const hA = dims.h * fillRatioA;
    const hB = dims.h * fillRatioB;
    return (
      <div className="current-compact" aria-label={`${labelA} vs ${labelB}`}>
        <div className="current-compact-tubes">
          <div className="current-compact-tube" style={{ height: dims.h }}>
            <div
              className={`current-compact-fill ${aWins ? 'fill-teal' : bWins ? 'fill-coral' : 'fill-neutral'}`}
              style={{ height: hA }}
            />
          </div>
          <div className="current-compact-tube" style={{ height: dims.h }}>
            <div
              className={`current-compact-fill ${bWins ? 'fill-teal' : aWins ? 'fill-coral' : 'fill-neutral'}`}
              style={{ height: hB }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Ambient Mode ─────────────────────────────────────────
  if (mode === 'ambient') {
    const totalW = dims.w * 2 + dims.gap;
    return (
      <div className="current-ambient" aria-label="Computing scenario...">
        <svg width={totalW} height={dims.h} viewBox={`0 0 ${totalW} ${dims.h}`}>
          {/* Tube A */}
          <rect x={0} y={0} width={dims.w} height={dims.h} rx={dims.radius}
                fill="rgba(21,22,43,0.04)" />
          <clipPath id="clipAmbA">
            <rect x={0} y={0} width={dims.w} height={dims.h} rx={dims.radius} />
          </clipPath>
          <g clipPath="url(#clipAmbA)">
            <path ref={svgRefA} fill="rgba(0,194,168,0.3)" />
          </g>

          {/* Tube B */}
          <rect x={dims.w + dims.gap} y={0} width={dims.w} height={dims.h} rx={dims.radius}
                fill="rgba(21,22,43,0.04)" />
          <clipPath id="clipAmbB">
            <rect x={dims.w + dims.gap} y={0} width={dims.w} height={dims.h} rx={dims.radius} />
          </clipPath>
          <g clipPath="url(#clipAmbB)" transform={`translate(${dims.w + dims.gap}, 0)`}>
            <path ref={svgRefB} fill="rgba(255,107,91,0.3)" />
          </g>
        </svg>
      </div>
    );
  }

  // ─── Interactive Mode (Hero) ──────────────────────────────
  const totalW = dims.w * 2 + dims.gap;
  const bubbleCountA = 4;
  const bubbleCountB = 4;
  const clipIdA = 'clipTubeA';
  const clipIdB = 'clipTubeB';

  return (
    <div className="current-interactive">
      <div className="current-tubes-wrapper">
        <svg
          width={totalW}
          height={dims.h}
          viewBox={`0 0 ${totalW} ${dims.h}`}
          className="current-svg"
        >
          <defs>
            <clipPath id={clipIdA}>
              <rect x={0} y={0} width={dims.w} height={dims.h} rx={dims.radius} />
            </clipPath>
            <clipPath id={clipIdB}>
              <rect x={dims.w + dims.gap} y={0} width={dims.w} height={dims.h} rx={dims.radius} />
            </clipPath>
            {/* Glow filters */}
            <filter id="glowTeal" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowCoral" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Tube A ── */}
          <rect x={0} y={0} width={dims.w} height={dims.h} rx={dims.radius}
                fill="rgba(21,22,43,0.04)" stroke="rgba(21,22,43,0.08)" strokeWidth="1" />
          <g clipPath={`url(#${clipIdA})`}>
            <path
              ref={svgRefA}
              fill={aWins ? 'rgba(0,194,168,0.45)' : bWins ? 'rgba(255,107,91,0.25)' : 'rgba(21,22,43,0.1)'}
            />
            {/* Meniscus glow line */}
            <motion.line
              x1={2} x2={dims.w - 2}
              y1={dims.h * (1 - fillRatioA)}
              y2={dims.h * (1 - fillRatioA)}
              stroke={aWins ? 'var(--teal)' : 'rgba(255,107,91,0.5)'}
              strokeWidth={aWins ? 2 : 1}
              opacity={0.7}
              filter={aWins ? 'url(#glowTeal)' : undefined}
            />
            {/* Bubbles */}
            {!shouldReduceMotion && Array.from({ length: bubbleCountA }).map((_, i) => (
              <Bubble key={`bA${i}`} tubeWidth={dims.w} tubeHeight={dims.h} delay={i * 0.8} />
            ))}
          </g>
          {/* Winner halo */}
          {aWins && (
            <motion.rect
              x={-3} y={-3}
              width={dims.w + 6} height={dims.h + 6}
              rx={dims.radius + 3}
              fill="none"
              stroke="var(--teal)"
              strokeWidth={2}
              opacity={0.4}
              animate={shouldReduceMotion ? {} : { opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* ── Tube B ── */}
          <g transform={`translate(${dims.w + dims.gap}, 0)`}>
            <rect x={0} y={0} width={dims.w} height={dims.h} rx={dims.radius}
                  fill="rgba(21,22,43,0.04)" stroke="rgba(21,22,43,0.08)" strokeWidth="1" />
            <g clipPath={`url(#${clipIdB})`}>
              <path
                ref={svgRefB}
                fill={bWins ? 'rgba(0,194,168,0.45)' : aWins ? 'rgba(255,107,91,0.25)' : 'rgba(21,22,43,0.1)'}
              />
              <motion.line
                x1={2} x2={dims.w - 2}
                y1={dims.h * (1 - fillRatioB)}
                y2={dims.h * (1 - fillRatioB)}
                stroke={bWins ? 'var(--teal)' : 'rgba(255,107,91,0.5)'}
                strokeWidth={bWins ? 2 : 1}
                opacity={0.7}
                filter={bWins ? 'url(#glowTeal)' : undefined}
              />
              {!shouldReduceMotion && Array.from({ length: bubbleCountB }).map((_, i) => (
                <Bubble key={`bB${i}`} tubeWidth={dims.w} tubeHeight={dims.h} delay={i * 0.7 + 0.3} />
              ))}
            </g>
            {bWins && (
              <motion.rect
                x={-3} y={-3}
                width={dims.w + 6} height={dims.h + 6}
                rx={dims.radius + 3}
                fill="none"
                stroke="var(--teal)"
                strokeWidth={2}
                opacity={0.4}
                animate={shouldReduceMotion ? {} : { opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </g>
        </svg>
      </div>

      {/* Labels */}
      <div className="current-labels">
        <div className={`current-label ${aWins ? 'label-winner' : bWins ? 'label-loser' : ''}`}>
          <span className="current-label-name">{labelA}</span>
          <span className="current-label-value mono-nums">{formatCurrency(valueA)}</span>
        </div>
        <div className={`current-label ${bWins ? 'label-winner' : aWins ? 'label-loser' : ''}`}>
          <span className="current-label-name">{labelB}</span>
          <span className="current-label-value mono-nums">{formatCurrency(valueB)}</span>
        </div>
      </div>
    </div>
  );
};

export default TheCurrent;
