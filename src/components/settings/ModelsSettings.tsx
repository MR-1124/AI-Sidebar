// ─────────────────────────────────────────────────────────────
// ModelsSettings — Manage global model generation preferences
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { HardDrive, Settings2, Sliders } from 'lucide-react';

export function ModelsSettings() {
  const settings = useSettingsStore(s => s.settings);
  const updateModel = useSettingsStore(s => s.updateModel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Model Parameters
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Adjust default parameters for text generation. These apply globally unless overridden by a specific prompt.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Temperature */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Temperature: {settings.model.defaultTemperature.toFixed(2)}</label>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Controls randomness (0 = strict, 2 = creative)</span>
            </div>
            <input 
              type="range" 
              min="0" max="2" step="0.05"
              value={settings.model.defaultTemperature}
              onChange={(e) => updateModel({ defaultTemperature: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Top P */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Top P: {settings.model.defaultTopP.toFixed(2)}</label>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nucleus sampling threshold</span>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={settings.model.defaultTopP}
              onChange={(e) => updateModel({ defaultTopP: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Max Tokens */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Max Tokens</label>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Maximum length of the generated response</span>
            </div>
            <input 
              type="number" 
              min="1" max="128000" step="1"
              value={settings.model.defaultMaxTokens}
              onChange={(e) => updateModel({ defaultMaxTokens: parseInt(e.target.value, 10) })}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
