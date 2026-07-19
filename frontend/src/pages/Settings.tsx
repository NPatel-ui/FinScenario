import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FloatingLabelInput from '../components/FloatingLabelInput';

const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cloud)' }}>
      <nav className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-6)',
        margin: 'var(--space-4) var(--space-6) 0',
        borderRadius: 'var(--radius-pill)',
        maxWidth: 200,
      }}>
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> Back
        </button>
      </nav>

      <div className="container" style={{ paddingTop: 'var(--space-8)', maxWidth: 560 }}>
        <div className="glass-panel-strong" style={{ padding: 'var(--space-8)' }}>
          <h2 style={{ marginBottom: 'var(--space-6)' }}>Account Settings</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <FloatingLabelInput
              label="Email"
              type="text"
              id="settings-email"
              value="user@example.com"
            />

            <FloatingLabelInput
              label="Location"
              type="text"
              id="settings-location"
              value="Austin, TX"
            />

            <div style={{ marginTop: 'var(--space-2)' }}>
              <button className="btn btn-primary">Save Changes</button>
            </div>

            <div style={{
              marginTop: 'var(--space-6)',
              borderTop: '1px solid var(--ink-faint)',
              paddingTop: 'var(--space-6)',
            }}>
              <h4 style={{ color: 'var(--coral)', marginBottom: 'var(--space-4)' }}>Danger Zone</h4>
              <button
                className="btn btn-outline"
                style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
              >
                Delete Account & All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
