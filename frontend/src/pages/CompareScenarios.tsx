import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import type { Scenario } from '../api';
import TheCurrent from '../components/TheCurrent';
import './Compare.css';

const CompareScenarios: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');

  useEffect(() => {
    api.listScenarios()
      .then(data => {
        setScenarios(data);
        if (data.length >= 2) {
          setLeftId(data[0].id);
          setRightId(data[1].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-center">
      <TheCurrent valueA={50} valueB={50} mode="ambient" />
    </div>
  );

  const leftScenario = scenarios.find(s => s.id === leftId);
  const rightScenario = scenarios.find(s => s.id === rightId);

  const getTitle = (type: string) =>
    type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getValues = (s?: Scenario) => {
    if (!s?.result) return { left: 0, right: 0 };
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

  const leftVals = getValues(leftScenario);
  const rightVals = getValues(rightScenario);

  return (
    <div className="compare-page">
      <nav className="compare-nav glass-panel">
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> Back
        </button>
      </nav>

      <div className="container compare-main">
        <h1>Compare scenarios</h1>
        <p className="mt-2 text-muted">Place two scenarios side by side to see which wins.</p>

        <div className="compare-selectors">
          <div className="compare-select-group">
            <span className="section-label">SCENARIO A</span>
            <select
              className="compare-select"
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
            >
              <option value="">Select a scenario</option>
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>{getTitle(s.type)} — {new Date(s.updated_at).toLocaleDateString()}</option>
              ))}
            </select>
          </div>
          <div className="compare-select-group">
            <span className="section-label">SCENARIO B</span>
            <select
              className="compare-select"
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
            >
              <option value="">Select a scenario</option>
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>{getTitle(s.type)} — {new Date(s.updated_at).toLocaleDateString()}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="compare-columns">
          <div className="compare-col glass-panel-strong">
            {leftScenario ? (
              <>
                <span className="section-label">SCENARIO A</span>
                <h3>{getTitle(leftScenario.type)}</h3>
                <div className="compare-current">
                  <TheCurrent
                    valueA={leftVals.left}
                    valueB={leftVals.right}
                    mode="interactive"
                  />
                </div>
                <div className="divider" />
                <p className="compare-summary">{leftScenario.result?.summary || 'No results yet.'}</p>
              </>
            ) : <p className="compare-empty">Select a scenario</p>}
          </div>

          <div className="compare-divider">
            <div className="divider-vertical" />
          </div>

          <div className="compare-col glass-panel-strong">
            {rightScenario ? (
              <>
                <span className="section-label">SCENARIO B</span>
                <h3>{getTitle(rightScenario.type)}</h3>
                <div className="compare-current">
                  <TheCurrent
                    valueA={rightVals.left}
                    valueB={rightVals.right}
                    mode="interactive"
                  />
                </div>
                <div className="divider" />
                <p className="compare-summary">{rightScenario.result?.summary || 'No results yet.'}</p>
              </>
            ) : <p className="compare-empty">Select a scenario</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareScenarios;
