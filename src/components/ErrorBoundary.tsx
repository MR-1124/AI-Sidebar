// ─────────────────────────────────────────────────────────────
// Error Boundary — Catches React rendering errors gracefully
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const { compact, fallbackMessage } = this.props;
      const message = fallbackMessage || 'Something went wrong';

      if (compact) {
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg-tertiary, #2a2a2a)',
            borderRadius: '8px',
            color: 'var(--text-secondary, #999)',
            fontSize: '13px',
          }}>
            <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{message}</span>
            <button
              onClick={this.handleRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: 'var(--bg-secondary, #333)',
                border: '1px solid var(--border, #444)',
                borderRadius: '4px',
                color: 'var(--text-primary, #eee)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        );
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '40px 24px',
          background: 'var(--bg-primary, #1a1a1a)',
          color: 'var(--text-primary, #eee)',
          minHeight: '200px',
        }}>
          <AlertTriangle size={40} style={{ color: '#f59e0b' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
              {message}
            </h3>
            {this.state.error && (
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--text-secondary, #999)',
                maxWidth: '400px',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--accent, #6366f1)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
