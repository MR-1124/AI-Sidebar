// ─────────────────────────────────────────────────────────────
// ExportSettings — Import/Export data as JSON
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Download, Upload, Check } from 'lucide-react';
import { db } from '../../db/database';

export function ExportSettings() {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const conversations = await db.conversations.toArray();
      const messages = await db.messages.toArray();
      const folders = await db.folders.toArray();
      
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        conversations,
        messages,
        folders,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `aiside_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Check console.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Data Export & Import
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Backup your conversations or transfer them to another device.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ 
            padding: 20, 
            background: 'var(--bg-elevated)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Export JSON</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Download all chats, folders, and messages.</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || exported}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: exported ? 'var(--success)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: (exporting || exported) ? 'default' : 'pointer',
                fontWeight: 500,
              }}
            >
              {exported ? <Check size={16} /> : <Download size={16} />}
              {exported ? 'Exported' : exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>

          <div style={{ 
            padding: 20, 
            background: 'var(--bg-elevated)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: 0.6,
            pointerEvents: 'none'
          }}>
            <div>
              <h3 style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Import JSON</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Restore from a previous backup. (Coming soon)</p>
            </div>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'not-allowed',
                fontWeight: 500,
              }}
            >
              <Upload size={16} />
              Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
