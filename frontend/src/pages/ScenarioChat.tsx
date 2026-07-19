import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import { api } from '../api';
import type { Scenario } from '../api';
import TheCurrent from '../components/TheCurrent';
import AmbientOrbs from '../components/AmbientOrbs';
import './ScenarioChat.css';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
};

const AnimatedNumber = ({ value, isCurrency = true }: { value: number; isCurrency?: boolean }) => {
  const spring = useSpring(value, { mass: 1, stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) => {
    const formatted = current.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return isCurrency ? `$${formatted}` : formatted;
  });

  useEffect(() => { spring.set(value); }, [spring, value]);

  return <motion.span className="mono-nums">{display}</motion.span>;
};

const ScenarioChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      api.getScenario(id)
        .then(setScenario)
        .catch(err => {
          console.error("Failed to load scenario", err);
          setScenario({
            id,
            user_id: 'user_123',
            type: 'rent_vs_buy',
            inputs: [],
            conversation: [
              { role: 'assistant', content: 'Hi! Tell me about the home you\'re looking to buy, or the place you currently rent.' }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scenario?.conversation, isSending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !scenario) return;

    const userText = input;
    setInput('');
    setIsSending(true);

    setScenario(prev => prev ? {
      ...prev,
      conversation: [...prev.conversation, { role: 'user', content: userText }]
    } : prev);

    try {
      const updatedScenario = await api.sendMessage(scenario.id, userText);
      setScenario(updatedScenario);
    } catch (err) {
      console.error("Failed to send message", err);
      setScenario(prev => prev ? {
        ...prev,
        conversation: [...prev.conversation, { role: 'assistant', content: 'Sorry, I encountered an error. Is the backend running?' }]
      } : prev);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <TheCurrent valueA={50} valueB={50} mode="ambient" />
      </div>
    );
  }

  if (!scenario) {
    return <div className="page-center">Scenario not found</div>;
  }

  const isRentVsBuy = scenario.type === 'rent_vs_buy';
  const result = scenario.result;

  let leftMetricLabel = "Option A";
  let leftMetricValue = 0;
  let rightMetricLabel = "Option B";
  let rightMetricValue = 0;

  if (result) {
    if (isRentVsBuy) {
      leftMetricLabel = "Total Rent Cost";
      leftMetricValue = result.numeric_breakdown?.total_cost_renting || 0;
      rightMetricLabel = "Total Buy Cost";
      rightMetricValue = result.numeric_breakdown?.total_cost_buying || 0;
    } else if (scenario.type === 'lease_vs_buy_car') {
      leftMetricLabel = "Total Lease Cost";
      leftMetricValue = result.numeric_breakdown?.total_cost_leasing || 0;
      rightMetricLabel = "Total Buy Cost";
      rightMetricValue = result.numeric_breakdown?.total_cost_buying || 0;
    } else if (scenario.type === 'debt_vs_invest') {
      leftMetricLabel = "Debt-First Net Worth";
      leftMetricValue = result.numeric_breakdown?.strategy_debt_first?.final_net_worth || 0;
      rightMetricLabel = "Invest-First Net Worth";
      rightMetricValue = result.numeric_breakdown?.strategy_invest_first?.final_net_worth || 0;
    }
  }

  const leftWins = leftMetricValue < rightMetricValue;

  // Inline number formatting for chat messages
  const formatMessageContent = (content: string) => {
    return content.replace(
      /\$[\d,]+(\.\d{2})?/g,
      (match) => `<span class="mono-nums">${match}</span>`
    );
  };

  return (
    <motion.div
      className="scenario-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AmbientOrbs intensity={0.5} />
      
      <div className="scenario-header">
        <div className="container">
          <nav className="scenario-nav glass-panel">
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <div className="nav-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/scenario/${scenario.id}/sensitivity`)}>
                Sensitivity
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                Export
              </button>
            </div>
          </nav>
        </div>
      </div>

      <div className="scenario-main">
        <div className="scenario-layout container">
          {/* ── Chat Pane ── */}
          <div className="chat-pane glass-panel-strong">
            <div className="chat-history">
              <AnimatePresence initial={false}>
                {scenario.conversation.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`message ${msg.role}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <div
                      className="message-bubble"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {isSending && (
                <div className="message assistant">
                  <div className="message-bubble thinking-bubble">
                    <TheCurrent valueA={40} valueB={60} mode="ambient" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSend}>
              <input
                type="text"
                className="chat-input"
                placeholder="e.g., What if I put 10% down instead?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
              />
              <button type="submit" className="btn btn-primary send-btn" disabled={isSending || !input.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* ── Results Pane ── */}
          <div className="results-pane">
            <div className="results-card glass-panel-strong">
              <span className="section-label">VERDICT</span>
              <h3>Scenario Results</h3>

              {result ? (
                <div className="results-content">
                  <div className="results-current">
                    <TheCurrent
                      valueA={leftMetricValue}
                      valueB={rightMetricValue}
                      labelA={leftMetricLabel}
                      labelB={rightMetricLabel}
                      mode="interactive"
                    />
                  </div>

                  <div className="divider" />

                  <div className="results-metrics">
                    <div className={`metric-box ${leftWins ? 'metric-winner' : 'metric-loser'}`}>
                      <span className="metric-label">{leftMetricLabel}</span>
                      <span className="metric-value mono-nums">
                        <AnimatedNumber value={leftMetricValue} />
                      </span>
                    </div>
                    <div className={`metric-box ${!leftWins ? 'metric-winner' : 'metric-loser'}`}>
                      <span className="metric-label">{rightMetricLabel}</span>
                      <span className="metric-value mono-nums">
                        <AnimatedNumber value={rightMetricValue} />
                      </span>
                    </div>
                  </div>

                  <div className="summary-text">
                    {result.summary}
                  </div>

                  <div className="divider" />

                  <div className="assumptions-section">
                    <span className="section-label">ASSUMPTIONS</span>
                    <ul className="assumptions-list">
                      {result.assumptions_used.map((a, i) => (
                        <li key={i}>
                          <span className="assumption-name">{a.field_name}</span>
                          <span className="assumption-value mono-nums">{String(a.value)}</span>
                          {a.source === 'live_data' && a.citation && (
                            <span className="citation-badge" title={a.citation}>Live Rate</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="empty-results">
                  <p>Provide more details to see the calculation results.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScenarioChat;
