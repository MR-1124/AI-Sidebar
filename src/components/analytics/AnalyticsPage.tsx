// ─────────────────────────────────────────────────────────────
// AnalyticsPage — Usage statistics and cost estimates
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo } from 'react';
import { X, DollarSign, Zap, MessageSquare, BarChart2 } from 'lucide-react';
import { useUIStore } from '../../stores/ui-store';
import { useUsageStore } from '../../stores/usage-store';
import { formatCost, formatTokenCount } from '../../lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export function AnalyticsPage() {
  const { setView } = useUIStore();
  const { totalCost, totalTokens, records, loadUsageSummary } = useUsageStore();

  useEffect(() => {
    loadUsageSummary();
  }, [loadUsageSummary]);

  // Aggregate daily data
  const dailyData = useMemo(() => {
    const map: Record<string, any> = {};
    records.forEach(r => {
      const d = new Date(r.createdAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[dateStr]) {
        map[dateStr] = { date: dateStr, cost: 0, tokens: 0, messages: 0 };
      }
      map[dateStr].cost += r.estimatedCost;
      map[dateStr].tokens += r.totalTokens;
      map[dateStr].messages += 1;
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [records]);

  // Aggregate model data
  const modelData = useMemo(() => {
    const map: Record<string, any> = {};
    records.forEach(r => {
      if (!map[r.modelId]) {
        map[r.modelId] = { name: r.modelId, cost: 0, tokens: 0 };
      }
      map[r.modelId].cost += r.estimatedCost;
      map[r.modelId].tokens += r.totalTokens;
    });
    return Object.values(map).sort((a: any, b: any) => b.cost - a.cost);
  }, [records]);

  // Provider Data
  const providerData = useMemo(() => {
    const map: Record<string, any> = {};
    records.forEach(r => {
      if (!map[r.providerId]) {
        map[r.providerId] = { name: r.providerId, cost: 0 };
      }
      map[r.providerId].cost += r.estimatedCost;
    });
    return Object.values(map).sort((a: any, b: any) => b.cost - a.cost);
  }, [records]);

  const totalMessages = records.length;
  const avgCostPerMsg = totalMessages > 0 ? totalCost / totalMessages : 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: 'var(--bg-primary)',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 50,
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 64,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Analytics & Usage</h1>
        <button
          onClick={() => setView('chat')}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
        >
          <X size={18} />
        </button>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Overview</h2>
            <p style={{ color: 'var(--text-muted)' }}>Estimated API costs and token usage across all providers.</p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginBottom: 40,
          }}>
            <StatCard 
              icon={<DollarSign size={20} />} 
              title="Total Estimated Cost" 
              value={formatCost(totalCost)} 
              color="var(--success)" 
            />
            <StatCard 
              icon={<Zap size={20} />} 
              title="Total Tokens" 
              value={formatTokenCount(totalTokens)} 
              color="var(--accent)" 
            />
            <StatCard 
              icon={<MessageSquare size={20} />} 
              title="Total Messages" 
              value={totalMessages.toLocaleString()} 
              color="#f59e0b" 
            />
            <StatCard 
              icon={<BarChart2 size={20} />} 
              title="Avg Cost / Msg" 
              value={formatCost(avgCostPerMsg)} 
              color="#8b5cf6" 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Area Chart: Usage Over Time */}
            <div style={{
              padding: '24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>Cost Over Time</h3>
              <div style={{ width: '100%', height: 300 }}>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `$${value.toFixed(4)}`} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(4)}`, 'Cost']}
                      />
                      <Area type="monotone" dataKey="cost" stroke="var(--success)" fillOpacity={1} fill="url(#colorCost)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartMessage />
                )}
              </div>
            </div>

            {/* Pie Chart: Provider Breakdown */}
            <div style={{
              padding: '24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>Cost by Provider</h3>
              <div style={{ width: '100%', height: 300 }}>
                {providerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="cost"
                      >
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(4)}`, 'Cost']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartMessage />
                )}
              </div>
            </div>
          </div>

          {/* Bar Chart: Models Breakdown */}
          <div style={{
            padding: '24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>Token Usage by Model</h3>
            <div style={{ width: '100%', height: 300 }}>
              {modelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={150} />
                    <Tooltip 
                      cursor={{ fill: 'var(--bg-hover)' }}
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      formatter={(value: any) => [Number(value).toLocaleString(), 'Tokens']}
                    />
                    <Bar dataKey="tokens" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                      {modelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartMessage />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) {
  return (
    <div style={{
      padding: '24px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-full)',
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function EmptyChartMessage() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      No usage data available yet.
    </div>
  );
}
