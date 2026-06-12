// ─────────────────────────────────────────────────────────────
// ShortcutsSettings — View and edit keyboard shortcuts
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { Command } from 'lucide-react';
import { DEFAULT_SHORTCUTS } from '../../lib/constants';

export function ShortcutsSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Keyboard Shortcuts
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Boost your productivity with keyboard shortcuts. Customization is coming soon.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEFAULT_SHORTCUTS.map(shortcut => (
            <div key={shortcut.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{shortcut.label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{shortcut.description}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {shortcut.keys.map(key => (
                  <kbd key={key} style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)'
                  }}>
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
