import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import type { Scenario } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TheCurrent from '../components/TheCurrent';
import './Compare.css';

const SensitivityChart: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getScenario(id)
        .then(setScenario)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div className="page-center">
      <TheCurrent valueA={50} valueB={50} mode="ambient" />
    </div>
  );

  if (!scenario || !scenario.result) return (
    <div className="page-center">Run a scenario first to see sensitivity.</div>
  );

  const baseCost = scenario.result.numeric_breakdown.total_cost_buying || 100000;
  const altCost = scenario.result.numeric_breakdown.total_cost_renting || scenario.result.numeric_breakdown.total_cost_leasing || 120000;

  const data = Array.from({ length: 10 }).map((_, i) => ({
    year: `Year ${i + 1}`,
    buyCost: Math.round(baseCost * (1 + (i * 0.05))),
    rentCost: Math.round(altCost * (1 + (i * 0.03)))
  }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cloud)' }}>
      <nav className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-6)',
        margin: 'var(--space-4) var(--space-6) 0',
        borderRadius: 'var(--radius-pill)',
        maxWidth: 250,
      }}>
        <button className="btn btn-ghost" onClick={() => navigate(`/scenario/${id}`)}>
          <ArrowLeft size={18} /> Back to Scenario
        </button>
      </nav>

      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-12)' }}>
        <div className="glass-panel-strong" style={{ padding: 'var(--space-8)' }}>
          <span className="section-label">PROJECTION</span>
          <h2 style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
            10-Year Sensitivity Analysis
          </h2>

          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,22,43,0.06)" />
                <XAxis
                  dataKey="year"
                  stroke="rgba(21,22,43,0.2)"
                  tick={{ fill: 'rgba(21,22,43,0.55)', fontFamily: 'Inter', fontSize: 12 }}
                />
                <YAxis
                  stroke="rgba(21,22,43,0.2)"
                  tick={{ fill: 'rgba(21,22,43,0.55)', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(21,22,43,0.08)',
                    borderRadius: '12px',
                    fontFamily: 'Inter',
                    color: '#15162B',
                    boxShadow: '0 8px 24px rgba(21,22,43,0.08)',
                  }}
                  formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 13 }} />
                <Line
                  type="monotone"
                  dataKey="buyCost"
                  name="Buying Total Cost"
                  stroke="#00C2A8"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: '#00C2A8' }}
                />
                <Line
                  type="monotone"
                  dataKey="rentCost"
                  name="Renting Total Cost"
                  stroke="#FF6B5B"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: '#FF6B5B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitivityChart;
