import React, { useState, useContext, useMemo } from 'react';
import { AppCtx } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, StatCard, SectionHeader, TabBar, Badge } from '../shared/FormElements';
import { DollarIcon, TrendingUpIcon, UsersIcon, BarChartIcon } from '../shared/Icons';
import { formatCurrency, formatNumber, formatPercent, formatDate, daysBetween, today } from '../../utils/helpers';
import type { Prospect, InboundLead, Client, Post } from '../../types';

const COLORS = [colors.accent, colors.info, colors.success, colors.warning, colors.purple, colors.pink];

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  borderBottom: `1px solid ${colors.border}`,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: colors.textPrimary,
  borderBottom: `1px solid ${colors.border}`,
};

const BarViz: React.FC<{ items: { label: string; value: number; color: string }[]; maxVal?: number }> = ({ items, maxVal }) => {
  const max = maxVal ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 100, fontSize: 12, color: colors.textSecondary, textAlign: 'right', flexShrink: 0 }}>
            {item.label}
          </span>
          <div style={{ flex: 1, height: 22, background: colors.bg, borderRadius: radius.sm, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.max((item.value / max) * 100, 0)}%`,
              background: item.color, borderRadius: radius.sm, transition: 'width 0.3s',
              minWidth: item.value > 0 ? 4 : 0,
            }} />
          </div>
          <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: colors.textPrimary, textAlign: 'right' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'content', label: 'Content' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'clients', label: 'Clients' },
];

export const Analytics: React.FC = () => {
  const { prospects, inbound, clients, posts, tasks, settings } = useContext(AppCtx);
  const [tab, setTab] = useState<string>('overview');

  const computed = useMemo(() => {
    const activeClients = clients.filter((c: Client) => c.status === 'active');
    const churnedClients = clients.filter((c: Client) => c.status === 'churned');
    const mrr = activeClients.reduce((s: number, c: Client) => s + (c.billingType === 'retainer' ? c.retainer : 0), 0);
    const oneTimeRev = activeClients.reduce((s: number, c: Client) => s + (c.billingType === 'one_time' ? c.projectValue : 0), 0);
    const totalRevenue = mrr + oneTimeRev;
    const publishedPosts = posts.filter((p: Post) => p.status === 'published');
    const totalImpressions = publishedPosts.reduce((s: number, p: Post) => s + p.impressions, 0);

    // Outbound stages
    const outboundStages = ['research', 'dm_sent', 'replied', 'call_booked', 'proposal_sent', 'negotiating', 'won', 'lost'] as const;
    const outboundByStage = outboundStages.map((stage) => ({
      label: stage.replace(/_/g, ' '),
      count: prospects.filter((p: Prospect) => p.status === stage).length,
    }));

    // Inbound stages
    const inboundStages = ['new', 'contacted', 'qualified', 'call_booked', 'proposal_sent', 'won', 'lost', 'not_qualified'] as const;
    const inboundByStage = inboundStages.map((stage) => ({
      label: stage.replace(/_/g, ' '),
      count: inbound.filter((l: InboundLead) => l.status === stage).length,
    }));

    // Outbound metrics
    const wonProspects = prospects.filter((p: Prospect) => p.status === 'won');
    const lostProspects = prospects.filter((p: Prospect) => p.status === 'lost');
    const closedOutbound = wonProspects.length + lostProspects.length;
    const outboundConversion = closedOutbound > 0 ? wonProspects.length / closedOutbound : 0;
    const avgTimeToClose = wonProspects.length > 0
      ? Math.round(wonProspects.reduce((s: number, p: Prospect) => s + daysBetween(p.firstContactDate, p.updatedAt.split('T')[0]), 0) / wonProspects.length)
      : 0;
    const activePipelineValue = prospects
      .filter((p: Prospect) => p.status !== 'won' && p.status !== 'lost')
      .reduce((s: number, p: Prospect) => s + p.dealValue, 0);

    // Inbound metrics
    const wonInbound = inbound.filter((l: InboundLead) => l.status === 'won');
    const lostInbound = inbound.filter((l: InboundLead) => l.status === 'lost');
    const closedInbound = wonInbound.length + lostInbound.length;
    const inboundConversion = closedInbound > 0 ? wonInbound.length / closedInbound : 0;
    const avgTimeToQualify = (() => {
      const qualified = inbound.filter((l: InboundLead) => l.status !== 'new');
      if (qualified.length === 0) return 0;
      return Math.round(qualified.reduce((s: number, l: InboundLead) => s + daysBetween(l.dateReceived, l.lastActionDate || l.dateReceived), 0) / qualified.length);
    })();

    // Content analytics
    const personalPosts = publishedPosts.filter((p: Post) => p.clientId === 'personal');
    const clientPosts = publishedPosts.filter((p: Post) => p.clientId !== 'personal');
    const postsByStatus: Record<string, number> = {};
    posts.forEach((p: Post) => {
      postsByStatus[p.status] = (postsByStatus[p.status] || 0) + 1;
    });

    const topPosts = [...publishedPosts].sort((a, b) => b.impressions - a.impressions).slice(0, 10);

    // Content velocity: posts published per week over last 12 weeks
    const weeksBack = 12;
    const now = new Date();
    let totalPostsLast12Weeks = 0;
    for (const p of publishedPosts) {
      if (p.publishedDate) {
        const diff = (now.getTime() - new Date(p.publishedDate).getTime()) / (7 * 86400000);
        if (diff <= weeksBack) totalPostsLast12Weeks++;
      }
    }
    const postsPerWeek = weeksBack > 0 ? totalPostsLast12Weeks / weeksBack : 0;

    // Client analytics
    const mrrByClient = activeClients
      .filter((c: Client) => c.billingType === 'retainer')
      .map((c: Client) => ({ name: c.name, value: c.retainer }))
      .sort((a, b) => b.value - a.value);

    const clientTenure = activeClients.map((c: Client) => ({
      name: c.name,
      months: Math.max(Math.round(daysBetween(c.startDate, today()) / 30), 1),
    })).sort((a, b) => b.months - a.months);

    const churnRate = clients.length > 0 ? churnedClients.length / clients.length : 0;

    return {
      activeClients, churnedClients, mrr, totalRevenue, publishedPosts, totalImpressions,
      outboundByStage, inboundByStage,
      wonProspects, outboundConversion, avgTimeToClose, activePipelineValue,
      wonInbound, inboundConversion, avgTimeToQualify,
      personalPosts, clientPosts, postsByStatus, topPosts, postsPerWeek,
      mrrByClient, clientTenure, churnRate,
    };
  }, [prospects, inbound, clients, posts, tasks, settings]);

  const renderOverview = (): React.ReactNode => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Total Revenue"
          value={formatCurrency(computed.totalRevenue)}
          color={colors.success}
          icon={<DollarIcon size={18} style={{ color: colors.success }} />}
        />
        <StatCard
          label="Total Clients"
          value={computed.activeClients.length}
          sub={`${clients.length} all-time`}
          color={colors.info}
          icon={<UsersIcon size={18} style={{ color: colors.info }} />}
        />
        <StatCard
          label="Total Posts"
          value={computed.publishedPosts.length}
          sub={`${posts.length} total (all statuses)`}
          color={colors.accent}
          icon={<BarChartIcon size={18} style={{ color: colors.accent }} />}
        />
        <StatCard
          label="Total Impressions"
          value={formatNumber(computed.totalImpressions)}
          color={colors.purple}
          icon={<TrendingUpIcon size={18} style={{ color: colors.purple }} />}
        />
      </div>

      {/* Pipeline Conversion Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <Card>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Outbound Funnel
          </h4>
          <BarViz
            items={computed.outboundByStage.map((s, i) => ({
              label: s.label, value: s.count, color: COLORS[i % COLORS.length],
            }))}
          />
        </Card>
        <Card>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Inbound Funnel
          </h4>
          <BarViz
            items={computed.inboundByStage.map((s, i) => ({
              label: s.label, value: s.count, color: COLORS[i % COLORS.length],
            }))}
          />
        </Card>
      </div>

      {/* Monthly Growth */}
      <Card>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Key Metrics
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { label: 'Win Rate (Outbound)', value: formatPercent(computed.outboundConversion) },
            { label: 'Win Rate (Inbound)', value: formatPercent(computed.inboundConversion) },
            { label: 'Pipeline Value', value: formatCurrency(computed.activePipelineValue) },
            { label: 'Churn Rate', value: formatPercent(computed.churnRate) },
            { label: 'Posts / Week', value: computed.postsPerWeek.toFixed(1) },
          ].map((m) => (
            <div key={m.label} style={{ padding: 12, background: colors.bg, borderRadius: radius.md }}>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );

  const renderContent = (): React.ReactNode => (
    <>
      {/* Personal vs Client split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Personal Posts" value={computed.personalPosts.length} color={colors.accent} />
        <StatCard label="Client Posts" value={computed.clientPosts.length} color={colors.info} />
        <StatCard
          label="Personal Impressions"
          value={formatNumber(computed.personalPosts.reduce((s, p) => s + p.impressions, 0))}
          color={colors.accent}
        />
        <StatCard
          label="Client Impressions"
          value={formatNumber(computed.clientPosts.reduce((s, p) => s + p.impressions, 0))}
          color={colors.info}
        />
      </div>

      {/* Posts by Status */}
      <Card style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Posts by Status
        </h4>
        <BarViz
          items={Object.entries(computed.postsByStatus).map(([status, count], i) => ({
            label: status.replace(/_/g, ' '),
            value: count,
            color: COLORS[i % COLORS.length],
          }))}
        />
      </Card>

      {/* Content Velocity */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Content Velocity
          </h4>
          <span style={{ fontSize: 22, fontWeight: 700, color: colors.accent }}>
            {computed.postsPerWeek.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 400, color: colors.textSecondary }}>posts/week</span>
          </span>
        </div>
      </Card>

      {/* Top Performing Posts */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Top Performing Posts
          </h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Impressions</th>
                <th style={thStyle}>Reactions</th>
                <th style={thStyle}>Comments</th>
                <th style={thStyle}>Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              {computed.topPosts.map((p: Post, idx: number) => {
                const client = clients.find((c: Client) => c.id === p.clientId);
                const engRate = p.impressions > 0 ? (p.reactions + p.comments) / p.impressions : 0;
                return (
                  <tr key={p.id}>
                    <td style={{ ...tdStyle, color: colors.textMuted, width: 30 }}>{idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </td>
                    <td style={{ ...tdStyle, color: colors.textSecondary }}>
                      {p.clientId === 'personal' ? 'Personal' : client?.name || '--'}
                    </td>
                    <td style={tdStyle}>{formatNumber(p.impressions)}</td>
                    <td style={tdStyle}>{p.reactions}</td>
                    <td style={tdStyle}>{p.comments}</td>
                    <td style={{ ...tdStyle, color: engRate > 0.03 ? colors.success : colors.textPrimary }}>
                      {formatPercent(engRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderPipeline = (): React.ReactNode => (
    <>
      {/* Outbound */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Outbound Pipeline</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Prospects" value={prospects.length} color={colors.textPrimary} />
        <StatCard label="Won Deals" value={computed.wonProspects.length} color={colors.success} />
        <StatCard label="Conversion Rate" value={formatPercent(computed.outboundConversion)} color={colors.accent} />
        <StatCard label="Avg Days to Close" value={`${computed.avgTimeToClose}d`} color={colors.info} />
        <StatCard label="Active Pipeline" value={formatCurrency(computed.activePipelineValue)} color={colors.warning} />
      </div>

      <Card style={{ marginBottom: 28 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Prospects by Stage
        </h4>
        <BarViz
          items={computed.outboundByStage.map((s, i) => ({
            label: s.label, value: s.count, color: COLORS[i % COLORS.length],
          }))}
        />
      </Card>

      {/* Inbound */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Inbound Pipeline</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Leads" value={inbound.length} color={colors.textPrimary} />
        <StatCard label="Won Leads" value={computed.wonInbound.length} color={colors.success} />
        <StatCard label="Conversion Rate" value={formatPercent(computed.inboundConversion)} color={colors.accent} />
        <StatCard label="Avg Days to Qualify" value={`${computed.avgTimeToQualify}d`} color={colors.info} />
      </div>

      <Card style={{ marginBottom: 28 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Leads by Stage
        </h4>
        <BarViz
          items={computed.inboundByStage.map((s, i) => ({
            label: s.label, value: s.count, color: COLORS[i % COLORS.length],
          }))}
        />
      </Card>

      {/* Combined */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              Combined Pipeline Value
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>
              {formatCurrency(computed.activePipelineValue)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Total Active Deals</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>
              {prospects.filter((p: Prospect) => p.status !== 'won' && p.status !== 'lost').length +
                inbound.filter((l: InboundLead) => l.status !== 'won' && l.status !== 'lost' && l.status !== 'not_qualified').length}
            </div>
          </div>
        </div>
      </Card>
    </>
  );

  const renderClients = (): React.ReactNode => (
    <>
      {/* Active vs Churned */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Active Clients" value={computed.activeClients.length} color={colors.success} />
        <StatCard label="Churned Clients" value={computed.churnedClients.length} color={colors.error} />
        <StatCard label="Total Clients" value={clients.length} color={colors.textPrimary} />
        <StatCard label="Churn Rate" value={formatPercent(computed.churnRate)} color={computed.churnRate > 0.2 ? colors.error : colors.success} />
      </div>

      {/* MRR Breakdown */}
      <Card style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          MRR Breakdown by Client
        </h4>
        {computed.mrrByClient.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
            No retainer clients.
          </div>
        ) : (
          <>
            <BarViz
              items={computed.mrrByClient.map((c, i) => ({
                label: c.name, value: c.value, color: COLORS[i % COLORS.length],
              }))}
            />
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Total MRR</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.success }}>
                {formatCurrency(computed.mrrByClient.reduce((s, c) => s + c.value, 0))}
              </span>
            </div>
          </>
        )}
      </Card>

      {/* Client Tenure */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Client Tenure
          </h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Months Active</th>
                <th style={thStyle}>Tenure</th>
              </tr>
            </thead>
            <tbody>
              {computed.clientTenure.map((c) => {
                const maxMonths = Math.max(...computed.clientTenure.map((x) => x.months), 1);
                return (
                  <tr key={c.name}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                    <td style={tdStyle}>{c.months} mo</td>
                    <td style={{ ...tdStyle, width: '40%' }}>
                      <div style={{ height: 16, background: colors.bg, borderRadius: radius.sm, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${(c.months / maxMonths) * 100}%`,
                          background: colors.success, borderRadius: radius.sm, transition: 'width 0.3s',
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Comprehensive business intelligence" />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && renderOverview()}
      {tab === 'content' && renderContent()}
      {tab === 'pipeline' && renderPipeline()}
      {tab === 'clients' && renderClients()}
    </div>
  );
};
