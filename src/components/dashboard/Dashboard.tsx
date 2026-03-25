import React from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card, Btn, Badge } from '../shared/FormElements';
import { formatCurrency, formatNumber, isThisMonth, isLastNDays, isOverdue, isThisWeek, timeAgo } from '../../utils/helpers';
import { DollarIcon, UsersIcon, TargetIcon, FileTextIcon, SendIcon, InboxIcon, PlusIcon, AlertIcon } from '../shared/Icons';

export const Dashboard: React.FC = () => {
  const { prospects, inbound, clients, posts, settings, setActiveSection, loadSampleData } = useApp();
  const activeClients = clients.filter((c) => c.status === 'active');
  const mrr = activeClients.reduce((s, c) => s + c.retainer, 0);
  const pipelineValue = prospects.filter((p) => p.status !== 'lost').reduce((s, p) => s + p.dealValue, 0);
  const postsThisMonth = posts.filter((p) => p.publishedDate && isThisMonth(p.publishedDate)).length;

  // Last 7 days
  const recentProspectActivities = prospects.flatMap((p) => p.activities.filter((a) => isLastNDays(a.date, 7)));
  const dmsSent7d = recentProspectActivities.filter((a) => a.type === 'dm_sent' || a.type === 'follow_up').length;
  const replies7d = recentProspectActivities.filter((a) => a.type === 'they_replied').length;
  const callsBooked7d = recentProspectActivities.filter((a) => a.type === 'call_scheduled').length;

  const inbound7d = inbound.filter((l) => isLastNDays(l.dateReceived, 7));
  const newLeads7d = inbound7d.length;
  const qualifiedLeads7d = inbound7d.filter((l) => l.status === 'qualified' || l.status === 'call_booked').length;
  const inboundCalls7d = inbound7d.filter((l) => l.status === 'call_booked').length;

  const publishedPosts7d = posts.filter((p) => p.publishedDate && isLastNDays(p.publishedDate, 7));
  const totalImpressions7d = publishedPosts7d.reduce((s, p) => s + p.impressions, 0);
  const totalEngagement7d = publishedPosts7d.reduce((s, p) => s + p.reactions + p.comments, 0);
  const avgPerPost7d = publishedPosts7d.length ? Math.round(totalImpressions7d / publishedPosts7d.length) : 0;

  // Needs attention
  const overdueFollowups = prospects.filter((p) => isOverdue(p.nextFollowUp) && p.status !== 'won' && p.status !== 'lost');
  const clientsNoPostsThisWeek = activeClients.filter((c) => {
    const clientPosts = posts.filter((p) => p.clientId === c.id && p.publishedDate && isThisWeek(p.publishedDate));
    return clientPosts.length === 0;
  });
  const unrespondedLeads = inbound.filter((l) => l.status === 'new');

  // Recent activity feed
  type FeedItem = { icon: string; text: string; time: string };
  const feed: FeedItem[] = [];
  prospects.forEach((p) => p.activities.forEach((a) => {
    feed.push({ icon: '📤', text: `${a.type.replace(/_/g, ' ')} — ${p.name}`, time: a.date });
  }));
  posts.filter((p) => p.publishedDate).forEach((p) => {
    feed.push({ icon: '📝', text: `Published: ${p.title}`, time: p.publishedDate! });
  });
  feed.sort((a, b) => b.time.localeCompare(a.time));
  const recentFeed = feed.slice(0, 10);

  const isEmpty = prospects.length === 0 && clients.length === 0 && posts.length === 0;

  const statCards = [
    { label: 'Total MRR', value: formatCurrency(mrr, settings.currency), icon: DollarIcon, color: colors.success },
    { label: 'Active Clients', value: activeClients.length.toString(), icon: UsersIcon, color: colors.info },
    { label: 'Pipeline Value', value: formatCurrency(pipelineValue, settings.currency), icon: TargetIcon, color: colors.accent },
    { label: 'Posts This Month', value: postsThisMonth.toString(), icon: FileTextIcon, color: '#A855F7' },
  ];

  return (
    <div>
      {isEmpty && (
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: 32, borderColor: colors.accent + '44' }}>
          <h3 style={{ margin: '0 0 8px', color: colors.textPrimary }}>Welcome to your Command Center</h3>
          <p style={{ color: colors.textSecondary, margin: '0 0 16px' }}>Get started by loading sample data or adding your first records.</p>
          <Btn onClick={loadSampleData}>Load Sample Data</Btn>
        </Card>
      )}

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((s) => (
          <Card key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>{s.value}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Activity Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: colors.textSecondary, fontWeight: 600 }}>OUTBOUND (7 DAYS)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['DMs Sent', dmsSent7d], ['Replies', replies7d], ['Calls', callsBooked7d]].map(([l, v]) => (
              <div key={l as string}><div style={{ fontSize: 20, fontWeight: 700 }}>{v as number}</div><div style={{ fontSize: 11, color: colors.textSecondary }}>{l as string}</div></div>
            ))}
          </div>
        </Card>
        <Card>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: colors.textSecondary, fontWeight: 600 }}>INBOUND (7 DAYS)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['Leads', newLeads7d], ['Qualified', qualifiedLeads7d], ['Calls', inboundCalls7d]].map(([l, v]) => (
              <div key={l as string}><div style={{ fontSize: 20, fontWeight: 700 }}>{v as number}</div><div style={{ fontSize: 11, color: colors.textSecondary }}>{l as string}</div></div>
            ))}
          </div>
        </Card>
        <Card>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: colors.textSecondary, fontWeight: 600 }}>CONTENT (7 DAYS)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['Impressions', formatNumber(totalImpressions7d)], ['Engagement', formatNumber(totalEngagement7d)], ['Avg/Post', formatNumber(avgPerPost7d)]].map(([l, v]) => (
              <div key={l as string}><div style={{ fontSize: 20, fontWeight: 700 }}>{v as string}</div><div style={{ fontSize: 11, color: colors.textSecondary }}>{l as string}</div></div>
            ))}
          </div>
        </Card>
      </div>

      {/* Needs Attention */}
      {(overdueFollowups.length > 0 || clientsNoPostsThisWeek.length > 0 || unrespondedLeads.length > 0) && (
        <Card style={{ marginBottom: 24, borderColor: colors.warning + '44' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: colors.warning, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertIcon size={14} /> NEEDS ATTENTION
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {overdueFollowups.map((p) => (
              <div key={p.id} style={{ fontSize: 13, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color={colors.error}>Overdue</Badge> Follow up with {p.name} ({p.company})
              </div>
            ))}
            {clientsNoPostsThisWeek.map((c) => (
              <div key={c.id} style={{ fontSize: 13, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color={colors.warning}>No Posts</Badge> {c.name} has no posts this week
              </div>
            ))}
            {unrespondedLeads.map((l) => (
              <div key={l.id} style={{ fontSize: 13, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color={colors.info}>New Lead</Badge> {l.name} ({l.company}) — not yet responded
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Recent Activity */}
        <Card>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: colors.textSecondary, fontWeight: 600 }}>RECENT ACTIVITY</h4>
          {recentFeed.length === 0 ? (
            <div style={{ color: colors.textSecondary, fontSize: 13, padding: 16, textAlign: 'center' }}>No activity yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentFeed.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0', borderBottom: i < recentFeed.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <span>{item.icon}</span>
                  <span style={{ flex: 1, color: colors.textPrimary }}>{item.text}</span>
                  <span style={{ fontSize: 11, color: colors.textSecondary, whiteSpace: 'nowrap' }}>{timeAgo(item.time)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: colors.textSecondary, fontWeight: 600 }}>QUICK ACTIONS</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Add Prospect', section: 'outbound' as const, icon: SendIcon },
              { label: 'Log Inbound Lead', section: 'inbound' as const, icon: InboxIcon },
              { label: 'Add Client', section: 'clients' as const, icon: UsersIcon },
              { label: 'Schedule Post', section: 'content' as const, icon: FileTextIcon },
            ].map((a) => (
              <Btn key={a.label} variant="secondary" onClick={() => setActiveSection(a.section)} style={{ width: '100%', justifyContent: 'flex-start' }}>
                <a.icon size={14} /> {a.label}
              </Btn>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
