import React from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, Btn, Badge, StatCard } from '../shared/FormElements';
import {
  formatCurrency, formatDualCurrency, formatNumber, formatPercent,
  isThisMonth, isLastNDays, isOverdue, isThisWeek, timeAgo,
} from '../../utils/helpers';
import {
  DollarIcon, UsersIcon, TargetIcon, FileTextIcon, SendIcon,
  InboxIcon, PlusIcon, AlertIcon, TrendingUpIcon,
} from '../shared/Icons';

const TasksIconSmall: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 20, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ProgressBar: React.FC<{ value: number; max: number; color: string; label: string; displayValue: string }> = ({
  value, max, color, label, displayValue,
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: colors.textPrimary }}>{label}</span>
        <span style={{ fontSize: 12, color: colors.textSecondary }}>
          {displayValue} / {max.toLocaleString()}
        </span>
      </div>
      <div style={{
        height: 8,
        borderRadius: radius.full,
        background: colors.surfaceHover,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: radius.full,
          background: pct >= 100 ? colors.success : color,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
        {formatPercent(max > 0 ? value / max : 0)} Complete
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const {
    prospects, inbound, clients, posts, tasks, settings,
    setActiveSection, loadSampleData,
  } = useApp();

  const exchangeRate = settings.finance?.exchangeRate || 280;
  const activeClients = clients.filter((c) => c.status === 'active');
  const mrr = activeClients.reduce((s, c) => s + c.retainer, 0);
  const pipelineValue = prospects.filter((p) => p.status !== 'lost').reduce((s, p) => s + p.dealValue, 0);
  const postsThisMonth = posts.filter((p) => p.publishedDate && isThisMonth(p.publishedDate)).length;

  // Last 7 days metrics
  const recentProspectActivities = prospects.flatMap((p) =>
    p.activities.filter((a) => isLastNDays(a.date, 7))
  );
  const dmsSent7d = recentProspectActivities.filter(
    (a) => a.type === 'dm_sent' || a.type === 'follow_up'
  ).length;
  const replies7d = recentProspectActivities.filter((a) => a.type === 'they_replied').length;
  const callsBooked7d = recentProspectActivities.filter((a) => a.type === 'call_scheduled').length;

  const inbound7d = inbound.filter((l) => isLastNDays(l.dateReceived, 7));
  const newLeads7d = inbound7d.length;
  const qualifiedLeads7d = inbound7d.filter(
    (l) => l.status === 'qualified' || l.status === 'call_booked'
  ).length;
  const inboundCalls7d = inbound7d.filter((l) => l.status === 'call_booked').length;

  const publishedPosts7d = posts.filter((p) => p.publishedDate && isLastNDays(p.publishedDate, 7));
  const totalImpressions7d = publishedPosts7d.reduce((s, p) => s + p.impressions, 0);
  const totalEngagement7d = publishedPosts7d.reduce((s, p) => s + p.reactions + p.comments, 0);
  const avgPerPost7d = publishedPosts7d.length
    ? Math.round(totalImpressions7d / publishedPosts7d.length)
    : 0;

  // Needs attention
  const overdueFollowups = prospects.filter(
    (p) => isOverdue(p.nextFollowUp) && p.status !== 'won' && p.status !== 'lost'
  );
  const clientsNoPostsThisWeek = activeClients.filter((c) => {
    const clientPosts = posts.filter(
      (p) => p.clientId === c.id && p.publishedDate && isThisWeek(p.publishedDate)
    );
    return clientPosts.length === 0;
  });
  const unrespondedLeads = inbound.filter((l) => l.status === 'new');
  const hasAttentionItems = overdueFollowups.length > 0 || clientsNoPostsThisWeek.length > 0 || unrespondedLeads.length > 0;

  // Recent activity feed
  type FeedItem = { icon: React.ReactNode; text: string; time: string; color: string };
  const feed: FeedItem[] = [];
  prospects.forEach((p) =>
    p.activities.forEach((a) => {
      feed.push({
        icon: <SendIcon size={14} style={{ color: colors.accent }} />,
        text: `${a.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} - ${p.name}`,
        time: a.date,
        color: colors.accent,
      });
    })
  );
  inbound.forEach((l) =>
    l.activities.forEach((a) => {
      feed.push({
        icon: <InboxIcon size={14} style={{ color: colors.info }} />,
        text: `${a.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} - ${l.name}`,
        time: a.date,
        color: colors.info,
      });
    })
  );
  posts
    .filter((p) => p.publishedDate)
    .forEach((p) => {
      feed.push({
        icon: <FileTextIcon size={14} style={{ color: colors.purple }} />,
        text: `Published: ${p.title}`,
        time: p.publishedDate!,
        color: colors.purple,
      });
    });
  feed.sort((a, b) => b.time.localeCompare(a.time));
  const recentFeed = feed.slice(0, 10);

  // Goal progress
  const goals = settings.goals;
  const weeklyDmsSent = recentProspectActivities.filter(
    (a) => a.type === 'dm_sent'
  ).length;
  const weeklyPostsPublished = posts.filter(
    (p) => p.publishedDate && isThisWeek(p.publishedDate)
  ).length;
  const monthlyImpressions = posts
    .filter((p) => p.publishedDate && isThisMonth(p.publishedDate))
    .reduce((s, p) => s + p.impressions, 0);
  const monthlyNewClients = clients.filter(
    (c) => c.status === 'active' && isThisMonth(c.startDate)
  ).length;

  const isEmpty = prospects.length === 0 && clients.length === 0 && posts.length === 0 && tasks.length === 0;

  // Quick actions
  const quickActions: { label: string; section: Parameters<typeof setActiveSection>[0]; icon: React.ReactNode; color: string }[] = [
    { label: 'Add Prospect', section: 'outbound', icon: <SendIcon size={16} style={{ color: colors.accent }} />, color: colors.accent },
    { label: 'Log Inbound Lead', section: 'inbound', icon: <InboxIcon size={16} style={{ color: colors.info }} />, color: colors.info },
    { label: 'Add Client', section: 'clients', icon: <UsersIcon size={16} style={{ color: colors.success }} />, color: colors.success },
    { label: 'Schedule Post', section: 'content', icon: <FileTextIcon size={16} style={{ color: colors.purple }} />, color: colors.purple },
    { label: 'New Task', section: 'tasks', icon: <TasksIconSmall size={16} style={{ color: colors.warning }} />, color: colors.warning },
  ];

  const metricCellStyle: React.CSSProperties = {
    textAlign: 'center' as const,
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome / Empty State */}
      {isEmpty && (
        <Card glass glow style={{
          marginBottom: 24,
          textAlign: 'center',
          padding: '48px 32px',
          borderColor: colors.accent + '33',
          background: `linear-gradient(135deg, ${colors.surface}, ${colors.bg})`,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: radius.xl,
            background: colors.accentMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <TrendingUpIcon size={28} style={{ color: colors.accent }} />
          </div>
          <h2 style={{
            margin: '0 0 8px',
            fontSize: 22,
            fontWeight: 700,
            color: colors.textPrimary,
            letterSpacing: -0.3,
          }}>
            Welcome To Your War Room
          </h2>
          <p style={{
            color: colors.textSecondary,
            margin: '0 0 24px',
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Your LinkedIn command center is ready. Load sample data to explore, or start adding your own records.
          </p>
          <Btn onClick={loadSampleData} size="lg">
            <PlusIcon size={16} /> Load Sample Data
          </Btn>
        </Card>
      )}

      {/* Top Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <StatCard
          label="Total MRR"
          value={formatCurrency(mrr, settings.currency)}
          sub={formatDualCurrency(mrr, exchangeRate)}
          color={colors.success}
          icon={<DollarIcon size={18} style={{ color: colors.success }} />}
        />
        <StatCard
          label="Active Clients"
          value={activeClients.length}
          sub={`${clients.length} total clients`}
          color={colors.info}
          icon={<UsersIcon size={18} style={{ color: colors.info }} />}
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue, settings.currency)}
          sub={formatDualCurrency(pipelineValue, exchangeRate)}
          color={colors.accent}
          icon={<TargetIcon size={18} style={{ color: colors.accent }} />}
        />
        <StatCard
          label="Posts This Month"
          value={postsThisMonth}
          sub={`${posts.length} total posts`}
          color={colors.purple}
          icon={<FileTextIcon size={18} style={{ color: colors.purple }} />}
        />
      </div>

      {/* Second Row - 7 Day Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Outbound 7-Day */}
        <Card glass>
          <h4 style={{
            margin: '0 0 16px',
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Outbound (7 Days)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {([
              ['DMs Sent', dmsSent7d, colors.accent],
              ['Replies', replies7d, colors.success],
              ['Calls Booked', callsBooked7d, colors.purple],
            ] as const).map(([label, value, color]) => (
              <div key={label} style={metricCellStyle}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, letterSpacing: -0.5 }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Inbound 7-Day */}
        <Card glass>
          <h4 style={{
            margin: '0 0 16px',
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Inbound (7 Days)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {([
              ['New Leads', newLeads7d, colors.info],
              ['Qualified', qualifiedLeads7d, colors.warning],
              ['Calls Booked', inboundCalls7d, colors.purple],
            ] as const).map(([label, value, color]) => (
              <div key={label} style={metricCellStyle}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, letterSpacing: -0.5 }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Content 7-Day */}
        <Card glass>
          <h4 style={{
            margin: '0 0 16px',
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Content (7 Days)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {([
              ['Impressions', formatNumber(totalImpressions7d), colors.accent],
              ['Engagement', formatNumber(totalEngagement7d), colors.success],
              ['Avg / Post', formatNumber(avgPerPost7d), colors.info],
            ] as const).map(([label, value, color]) => (
              <div key={label} style={metricCellStyle}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, letterSpacing: -0.5 }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Needs Attention */}
      {hasAttentionItems && (
        <Card style={{
          marginBottom: 24,
          borderColor: colors.warning + '55',
          borderWidth: 1,
          background: `linear-gradient(135deg, ${colors.surface}, ${colors.warningMuted}22)`,
        }}>
          <h4 style={{
            margin: '0 0 16px',
            fontSize: 13,
            color: colors.warning,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            letterSpacing: 0.3,
          }}>
            <AlertIcon size={16} style={{ color: colors.warning }} /> Needs Attention
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overdueFollowups.map((p) => (
              <div key={p.id} style={{
                fontSize: 13,
                color: colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: colors.errorMuted,
                borderRadius: radius.md,
                border: `1px solid ${colors.error}22`,
              }}>
                <Badge color={colors.error}>Overdue</Badge>
                <span>Follow up with <strong>{p.name}</strong> ({p.company})</span>
              </div>
            ))}
            {clientsNoPostsThisWeek.map((c) => (
              <div key={c.id} style={{
                fontSize: 13,
                color: colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: colors.warningMuted,
                borderRadius: radius.md,
                border: `1px solid ${colors.warning}22`,
              }}>
                <Badge color={colors.warning}>No Posts</Badge>
                <span><strong>{c.name}</strong> has no posts this week</span>
              </div>
            ))}
            {unrespondedLeads.map((l) => (
              <div key={l.id} style={{
                fontSize: 13,
                color: colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: colors.infoMuted,
                borderRadius: radius.md,
                border: `1px solid ${colors.info}22`,
              }}>
                <Badge color={colors.info}>New Lead</Badge>
                <span><strong>{l.name}</strong> ({l.company}) - Not yet responded</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Two-Column Bottom: Recent Activity + Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Recent Activity Feed */}
        <Card glass>
          <h4 style={{
            margin: '0 0 16px',
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Recent Activity
          </h4>
          {recentFeed.length === 0 ? (
            <div style={{
              color: colors.textMuted,
              fontSize: 13,
              padding: '32px 16px',
              textAlign: 'center',
              background: colors.bg,
              borderRadius: radius.md,
              border: `1px dashed ${colors.border}`,
            }}>
              No activity yet. Start tracking your outreach to see updates here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentFeed.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  padding: '10px 0',
                  borderBottom: i < recentFeed.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: radius.md,
                    background: colors.surfaceHover,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <span style={{ flex: 1, color: colors.textPrimary, lineHeight: 1.4 }}>{item.text}</span>
                  <span style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {timeAgo(item.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card glass>
          <h4 style={{
            margin: '0 0 16px',
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Quick Actions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map((a) => (
              <Btn
                key={a.label}
                variant="secondary"
                onClick={() => setActiveSection(a.section)}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  gap: 10,
                  padding: '11px 14px',
                  borderColor: colors.border,
                  transition: 'all 0.15s ease',
                }}
              >
                {a.icon} {a.label}
              </Btn>
            ))}
          </div>
        </Card>
      </div>

      {/* Goal Progress */}
      {goals && (
        <Card glass style={{ marginBottom: 24 }}>
          <h4 style={{
            margin: '0 0 20px',
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <TargetIcon size={14} style={{ color: colors.accent }} /> Goal Progress
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 32px',
          }}>
            <ProgressBar
              label="Monthly MRR"
              value={mrr}
              max={goals.monthlyMrr}
              color={colors.success}
              displayValue={formatCurrency(mrr, settings.currency)}
            />
            <ProgressBar
              label="Monthly New Clients"
              value={monthlyNewClients}
              max={goals.monthlyNewClients}
              color={colors.info}
              displayValue={monthlyNewClients.toString()}
            />
            <ProgressBar
              label="Weekly DMs"
              value={weeklyDmsSent}
              max={goals.weeklyDms}
              color={colors.accent}
              displayValue={weeklyDmsSent.toString()}
            />
            <ProgressBar
              label="Weekly Posts"
              value={weeklyPostsPublished}
              max={goals.weeklyPosts}
              color={colors.purple}
              displayValue={weeklyPostsPublished.toString()}
            />
            <ProgressBar
              label="Monthly Impressions"
              value={monthlyImpressions}
              max={goals.monthlyImpressions}
              color={colors.warning}
              displayValue={formatNumber(monthlyImpressions)}
            />
          </div>
        </Card>
      )}
    </div>
  );
};
