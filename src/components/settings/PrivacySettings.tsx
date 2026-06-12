// ─────────────────────────────────────────────────────────────
// PrivacySettings — Data management and security
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Shield, Trash2, AlertTriangle, Check } from 'lucide-react';
import { db } from '../../db/database';
import { useChatStore } from '../../stores/chat-store';
import { useModelStore } from '../../stores/model-store';

export function PrivacySettings() {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to delete all chat history? This cannot be undone.')) return;
    
    setClearing(true);
    try {
      await db.conversations.clear();
      await db.messages.clear();
      useChatStore.getState().loadConversations();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch (e) {
      console.error('Failed to clear history:', e);
      alert('Failed to clear history. Check console.');
    } finally {
      setClearing(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the model cache? It will be re-downloaded.')) return;
    
    try {
      await db.modelCache.clear();
      useModelStore.getState().loadModels();
      alert('Cache cleared successfully.');
    } catch (e) {
      console.error('Failed to clear cache:', e);
      alert('Failed to clear cache.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Privacy & Data
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Manage your local data. All your conversations and API keys are stored locally on your device.
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
              <h3 style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Clear Chat History</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Permanently delete all conversations and messages.</p>
            </div>
            <button
              onClick={handleClearHistory}
              disabled={clearing || cleared}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: cleared ? 'var(--success)' : 'rgba(239, 68, 68, 0.1)',
                color: cleared ? '#fff' : '#ef4444',
                border: cleared ? '1px solid var(--success)' : '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                cursor: (clearing || cleared) ? 'default' : 'pointer',
                fontWeight: 500,
              }}
            >
              {cleared ? <Check size={16} /> : <Trash2 size={16} />}
              {cleared ? 'Cleared' : clearing ? 'Clearing...' : 'Clear History'}
            </button>
          </div>

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
              <h3 style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Clear Model Cache</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Delete cached model lists and pricing data.</p>
            </div>
            <button
              onClick={handleClearCache}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ padding: 16, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 12 }}>
        <AlertTriangle size={20} color="#eab308" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your API keys are encrypted at rest using a key derived from your browser environment. They are never sent to any server except the official AI providers when generating responses.
        </p>
      </div>
    </div>
  );
}
