// ─────────────────────────────────────────────────────────────
// Permission Modal — Custom modal for browser action permissions
// Replaces window.confirm() with a styled, informative dialog
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { Shield, MousePointer, Type, Globe, Eye } from 'lucide-react';

interface PermissionModalProps {
  action: string;
  target: string;
  value: string;
  onAllow: () => void;
  onAllowAll: () => void;
  onDeny: () => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  click: <MousePointer size={18} />,
  type: <Type size={18} />,
  navigate: <Globe size={18} />,
  scroll: <Eye size={18} />,
};

export function PermissionModal({ action, target, value, onAllow, onAllowAll, onDeny }: PermissionModalProps) {
  const denyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    denyRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDeny();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onDeny]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--bg-secondary, #1e1e1e)',
        border: '1px solid var(--border, #333)',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '380px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#eab308',
          }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #eee)' }}>
              Browser Action Permission
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #888)' }}>
              AI wants to interact with the page
            </p>
          </div>
        </div>

        {/* Action Details */}
        <div style={{
          background: 'var(--bg-tertiary, #2a2a2a)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary, #888)' }}>
              {ACTION_ICONS[action] || <MousePointer size={18} />}
            </span>
            <span style={{ color: 'var(--text-primary, #eee)', fontWeight: 500, textTransform: 'capitalize' }}>
              {action}
            </span>
          </div>
          {target && target !== 'N/A' && (
            <div style={{ marginBottom: '4px', color: 'var(--text-secondary, #aaa)' }}>
              <span style={{ fontWeight: 500 }}>Target:</span>{' '}
              <code style={{
                background: 'var(--bg-primary, #1a1a1a)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                {target}
              </code>
            </div>
          )}
          {value && value !== 'N/A' && (
            <div style={{ color: 'var(--text-secondary, #aaa)' }}>
              <span style={{ fontWeight: 500 }}>Value:</span>{' '}
              <span style={{ wordBreak: 'break-all' }}>{value.length > 100 ? value.slice(0, 100) + '…' : value}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            ref={denyRef}
            onClick={onDeny}
            style={{
              flex: 1,
              padding: '8px',
              background: 'var(--bg-tertiary, #333)',
              border: '1px solid var(--border, #444)',
              borderRadius: '8px',
              color: 'var(--text-primary, #eee)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Deny
          </button>
          <button
            onClick={onAllow}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#22c55e',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Allow Once
          </button>
          <button
            onClick={onAllowAll}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              color: '#6366f1',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Allow All
          </button>
        </div>
      </div>
    </div>
  );
}
