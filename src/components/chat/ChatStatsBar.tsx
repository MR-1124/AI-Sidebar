import React, { useMemo } from 'react';
import { useChatStore } from '../../stores/chat-store';
import { getAllProviderInfo } from '../../providers/registry';
import { BarChart2, Coins } from 'lucide-react';
import { formatTokenCount, formatCost } from '../../lib/utils';
import type { Message } from '../../types/chat';

export function ChatStatsBar() {
  const messages = useChatStore(s => s.messages);
  const providers = getAllProviderInfo();

  const stats = useMemo(() => {
    let totalTokens = 0;
    let totalCost = 0;
    const providerStats: Record<string, number> = {};

    messages.forEach((m: Message) => {
      if (m.role === 'assistant' && m.totalTokens) {
        totalTokens += m.totalTokens;
        if (m.estimatedCost) {
          totalCost += m.estimatedCost;
        }

        if (m.providerId) {
          providerStats[m.providerId] = (providerStats[m.providerId] || 0) + m.totalTokens;
        }
      }
    });

    return { totalTokens, totalCost, providerStats };
  }, [messages]);

  if (stats.totalTokens === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '8px 16px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)' }}>
        <BarChart2 size={14} style={{ color: 'var(--accent)' }} />
        <span>Total Tokens: {formatTokenCount(stats.totalTokens)}</span>
      </div>
      
      {stats.totalCost > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--success)' }}>
          <Coins size={14} />
          <span>Estimated Cost: {formatCost(stats.totalCost)}</span>
        </div>
      )}

      <div style={{ width: 1, height: 12, background: 'var(--border)', margin: '0 4px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {Object.entries(stats.providerStats).map(([providerId, tokens]) => {
          const providerInfo = providers.find(p => p.id === providerId);
          return (
            <div key={providerId} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>{providerInfo?.name || providerId}:</span>
              <span style={{ fontWeight: 500 }}>{formatTokenCount(tokens)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
