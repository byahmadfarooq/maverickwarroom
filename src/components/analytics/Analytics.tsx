import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card } from '../shared/FormElements';
import { formatCurrency, formatNumber, formatPercent, isLastNDays, daysBetween } from '../../utils/helpers';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = [colors.accent, colors.info, colors.success, colors.warning, '#A855F7', '#EC4899'];

type Range = '7d' | '30d' | '90d' | 'all';

export const Analytics: React.FC = () => {
  const { prospects, inbound, clients, posts, settings } = useApp();
  const [range, setRange] = useState<Range>('30d');

  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 99999;
  const inRange = (d: string | null) => d ? (range === 'all' || isLastNDays(d, rangeDays)) : false;

  const activeClients = clients.filter((c) => c.status === 'active');
  const mrr = activeClients.reduce((s, c) => s + c.retainer, 0);
  const publishedPosts = posts.filter((p) => p.status === 'published' && inRange(p.publishedDate));
  const totalImpressions = publishedPosts.reduce((s, p) => s + p.impressions, 0);
  const totalEngagement = publishedPosts.reduce((s, p) => s + p.reactions + p.comments, 0);

  // Revenue
  const revenueByClient = activeClients.map((c) => ({ name: c.name, value: c.retainer }));
  const churnedMrr = clients.filter((c) => c.status === 'churned' && inRange(c.churnDate)).reduce((s, c) => s + c.retainer, 0);

  // Pipeline
  const pipelineValue = prospects.filter((p) => p.status !== 'lost' && p.status !== 'won').reduce((s, p) => s + p.dealValue, 0);
  const stages = ['research', 'dm_sent', 'replied', 'call_booked', 'proposal_sent', 'negotiating', 'won'] as const;
  const funnelData = stages.map((s) => ({
    stage: s.replace(/_/g, ' '),
    count: prospects.filter((p) => p.status === s).length,
    value: prospects.filter((p) => p.status === s).reduce((sum, p) => sum + p.dealValue, 0),
  }));
  const wonProspects = prospects.filter((p) => p.status === 'won');
  const avgSalesCycle = wonProspects.length > 0
    ? Math.round(wonProspects.reduce((s, p) => s + daysBetween(p.firstContactDate, p.updatedAt.split('T')[0]), 0) / wonProspects.length)
    : 0;
  const winRate = (() => {
    const closed = prospects.filter((p) => p.status === 'won' || p.status === 'lost').length;
    return closed > 0 ? wonProspects.length / closed : 0;
  })();

  // Content
  const avgImpPerPost = publishedPosts.length ? Math.round(totalImpressions / publishedPosts.length) : 0;
  const avgEngRate = totalImpressions > 0 ? totalEngagement / totalImpressions : 0;

  // Pillar performance
  const pillarMap: Record<string, { impressions: number; engagement: number; count: number }> = {};
  publishedPosts.forEach((p) => {
    const key = p.pillar || 'Other';
    if (!pillarMap[key]) pillarMap[key] = { impressions: 0, engagement: 0, count: 0 };
    pillarMap[key].impressions += p.impressions;
    pillarMap[key].engagement += p.reactions + p.comments;
    pillarMap[key].count++;
  });
  const pillarData = Object.entries(pillarMap).map(([name, d]) => ({ name, ...d }));

  // Outbound
  const allOutboundActs = prospects.flatMap((p) => p.activities.filter((a) => inRange(a.date)));
  const dmsSent = allOutboundActs.filter((a) => a.type === 'dm_sent' || a.type === 'follow_up').length;
  const replies = allOutboundActs.filter((a) => a.type === 'they_replied').length;
  const callsBooked = allOutboundActs.filter((a) => a.type === 'call_scheduled').length;
  const proposalsSent = allOutboundActs.filter((a) => a.type === 'proposal_sent').length;

  // Inbound
  const inboundInRange = inbound.filter((l) => inRange(l.dateReceived));
  const inboundBySource: Record<string, number> = {};
  inboundInRange.forEach((l) => { inboundBySource[l.source] = (inboundBySource[l.source] || 0) + 1; });
  const inboundSourceData = Object.entries(inboundBySource).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  const inboundConversion = (() => {
    const closed = inboundInRange.filter((l) => l.status === 'won' || l.status === 'lost').length;
    const won = inboundInRange.filter((l) => l.status === 'won').length;
    return closed > 0 ? won / closed : 0;
  })();

  // Client Health
  const retentionRate = clients.length > 0 ? activeClients.length / clients.length : 0;
  const clientsByStatus = [
    { name: 'Active', value: activeClients.length },
    { name: 'Paused', value: clients.filter((c) => c.status === 'paused').length },
    { name: 'Churned', value: clients.filter((c) => c.status === 'churned').length },
  ].filter((d) => d.value > 0);

  const churnReasons: Record<string, number> = {};
  clients.filter((c) => c.churnReason).forEach((c) => { churnReasons[c.churnReason!] = (churnReasons[c.churnReason!] || 0) + 1; });
  const churnReasonData = Object.entries(churnReasons).map(([name, value]) => ({ name, value }));

  // Goals
  const goals = settings.goals;
  const goalItems = [
    { label: 'MRR', current: mrr, target: goals.monthlyMrr, format: (n: number) => formatCurrency(n) },
    { label: 'Clients', current: activeClients.length, target: goals.monthlyNewClients, format: (n: number) => n.toString() },
    { label: 'Weekly DMs', current: dmsSent, target: goals.weeklyDms, format: (n: number) => n.toString() },
    { label: 'Weekly Posts', current: publishedPosts.length, target: goals.weeklyPosts, format: (n: number) => n.toString() },
    { label: 'Impressions', current: totalImpressions, target: goals.monthlyImpressions, format: (n: number) => formatNumber(n) },
  ];

  const tooltipStyle = { background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary };

  return (
    <div>
      {/* Date Range */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['90d', 'Last 90 Days'], ['all', 'All Time']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setRange(k)} style={{
            padding: '6px 14px', border: `1px solid ${range === k ? colors.accent : colors.border}`,
            borderRadius: 6, background: range === k ? colors.accent + '15' : colors.surface,
            color: range === k ? colors.accent : colors.textSecondary, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
          }}>{l}</button>
        ))}
      </div>

      {/* Revenue */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Revenue</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Current MRR', value: formatCurrency(mrr), color: colors.success },
          { label: 'Pipeline', value: formatCurrency(pipelineValue), color: colors.accent },
          { label: 'Churned MRR', value: formatCurrency(churnedMrr), color: colors.error },
        ].map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
          </Card>
        ))}
      </div>
      {revenueByClient.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <Card>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: colors.textSecondary }}>REVENUE BY CLIENT</h4>
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={revenueByClient} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                    {revenueByClient.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: colors.textSecondary }}>PIPELINE FUNNEL</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {funnelData.map((d, i) => {
                const maxCount = Math.max(...funnelData.map((f) => f.count), 1);
                return (
                  <div key={d.stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 80, fontSize: 11, color: colors.textSecondary, textAlign: 'right' }}>{d.stage}</span>
                    <div style={{ flex: 1, height: 20, background: colors.bg, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(d.count / maxCount) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, width: 30 }}>{d.count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Pipeline Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Win Rate', value: formatPercent(winRate) },
          { label: 'Avg Sales Cycle', value: `${avgSalesCycle}d` },
          { label: 'DMs Sent', value: dmsSent },
          { label: 'Reply Rate', value: formatPercent(dmsSent > 0 ? replies / dmsSent : 0) },
          { label: 'Calls Booked', value: callsBooked },
          { label: 'Proposals Sent', value: proposalsSent },
        ].map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
          </Card>
        ))}
      </div>

      {/* Content Performance */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Content Performance</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Impressions', value: formatNumber(totalImpressions) },
          { label: 'Engagement', value: formatNumber(totalEngagement) },
          { label: 'Posts Published', value: publishedPosts.length },
          { label: 'Avg/Post', value: formatNumber(avgImpPerPost) },
          { label: 'Avg Eng Rate', value: formatPercent(avgEngRate) },
        ].map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
          </Card>
        ))}
      </div>
      {pillarData.length > 0 && (
        <Card style={{ marginBottom: 32 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: colors.textSecondary }}>PERFORMANCE BY PILLAR</h4>
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={pillarData}>
                <XAxis dataKey="name" stroke={colors.textSecondary} fontSize={11} />
                <YAxis stroke={colors.textSecondary} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="impressions" fill={colors.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" fill={colors.info} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Inbound */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Inbound</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Inbound Leads', value: inboundInRange.length },
            { label: 'Conversion Rate', value: formatPercent(inboundConversion) },
          ].map((m) => (
            <Card key={m.label}>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
            </Card>
          ))}
        </div>
        {inboundSourceData.length > 0 && (
          <Card>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: colors.textSecondary }}>BY SOURCE</h4>
            <div style={{ height: 150 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={inboundSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label>
                    {inboundSourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Client Health */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Client Health</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card><div style={{ fontSize: 11, color: colors.textSecondary }}>Retention Rate</div><div style={{ fontSize: 22, fontWeight: 700, color: colors.success }}>{formatPercent(retentionRate)}</div></Card>
          <Card><div style={{ fontSize: 11, color: colors.textSecondary }}>Active Clients</div><div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>{activeClients.length}</div></Card>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {clientsByStatus.length > 0 && (
            <Card>
              <h4 style={{ margin: '0 0 4px', fontSize: 12, color: colors.textSecondary }}>BY STATUS</h4>
              <div style={{ height: 120 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={clientsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} label>
                      {clientsByStatus.map((_, i) => <Cell key={i} fill={[colors.success, colors.warning, colors.error][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          {churnReasonData.length > 0 && (
            <Card>
              <h4 style={{ margin: '0 0 4px', fontSize: 12, color: colors.textSecondary }}>CHURN REASONS</h4>
              <div style={{ height: 120 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={churnReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} label>
                      {churnReasonData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Goal Tracking */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Goal Tracking</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {goalItems.map((g) => {
          const pct = g.target > 0 ? Math.min(g.current / g.target, 1) : 0;
          const onTrack = pct >= 0.7;
          return (
            <Card key={g.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: colors.textSecondary }}>{g.label}</span>
                <span style={{ fontSize: 12, color: onTrack ? colors.success : colors.warning }}>{onTrack ? 'On Track' : 'Behind'}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                {g.format(g.current)} <span style={{ fontSize: 12, fontWeight: 400, color: colors.textSecondary }}>/ {g.format(g.target)}</span>
              </div>
              <div style={{ height: 6, background: colors.bg, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct * 100}%`, background: onTrack ? colors.success : colors.warning, borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
