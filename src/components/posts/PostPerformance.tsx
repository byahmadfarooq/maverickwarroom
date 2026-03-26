import React, { useState, useContext, useMemo } from 'react';
import { AppCtx } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Btn, Card, SectionHeader, Select, EmptyState, Field, Input } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { DownloadIcon, FilterIcon, CalendarIcon } from '../shared/Icons';
import { formatNumber, formatPercent, formatDate, daysBetween, today } from '../../utils/helpers';
import type { Post, TrackingEntry, Client } from '../../types';

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  borderBottom: `1px solid ${colors.border}`,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: colors.textPrimary,
  borderBottom: `1px solid ${colors.border}`,
};

const metricBoxStyle: React.CSSProperties = {
  background: colors.bg, border: `1px solid ${colors.border}`,
  borderRadius: radius.md, padding: '8px 12px',
};

const TRACKING_INTERVALS = [7, 30, 60, 90] as const;

function getIntervalLabel(days: number): string {
  return `${days}d`;
}

function getTrackingEntryForInterval(post: Post, intervalDays: number): TrackingEntry | undefined {
  if (!post.publishedDate) return undefined;
  const targetDate = new Date(post.publishedDate);
  targetDate.setDate(targetDate.getDate() + intervalDays);
  const targetStr = targetDate.toISOString().split('T')[0];

  // Find closest entry within 3 days of the target
  let closest: TrackingEntry | undefined;
  let closestDiff = Infinity;
  for (const entry of post.trackingLog) {
    const diff = Math.abs(daysBetween(entry.date, targetStr));
    if (diff < closestDiff && diff <= 3) {
      closest = entry;
      closestDiff = diff;
    }
  }
  return closest;
}

function getLatestEntry(post: Post): TrackingEntry | undefined {
  if (post.trackingLog.length === 0) return undefined;
  return [...post.trackingLog].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export const PostPerformance: React.FC = () => {
  const { posts, clients, updatePost, toast } = useContext(AppCtx);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [trackingModalPost, setTrackingModalPost] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({ impressions: 0, reactions: 0, comments: 0 });
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const publishedPosts = useMemo(() => {
    let filtered = posts.filter((p: Post) => p.status === 'published');

    if (clientFilter === 'personal') {
      filtered = filtered.filter((p: Post) => p.clientId === 'personal');
    } else if (clientFilter !== 'all') {
      filtered = filtered.filter((p: Post) => p.clientId === clientFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter((p: Post) => (p.publishedDate || '') >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((p: Post) => (p.publishedDate || '') <= dateTo);
    }

    return filtered.sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''));
  }, [posts, clientFilter, dateFrom, dateTo]);

  const topPosts = useMemo(() => {
    return [...publishedPosts].sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  }, [publishedPosts]);

  const clientList = useMemo(() => {
    const uniqueIds = new Set(posts.map((p: Post) => p.clientId).filter((id) => id !== 'personal'));
    return clients.filter((c: Client) => uniqueIds.has(c.id));
  }, [posts, clients]);

  const handleAddTracking = (): void => {
    if (!trackingModalPost) return;
    const entry: TrackingEntry = {
      id: Math.random().toString(36).slice(2),
      date: today(),
      impressions: trackingForm.impressions,
      reactions: trackingForm.reactions,
      comments: trackingForm.comments,
    };
    const post = posts.find((p: Post) => p.id === trackingModalPost);
    if (!post) return;
    updatePost(trackingModalPost, {
      trackingLog: [...post.trackingLog, entry],
      impressions: Math.max(post.impressions, trackingForm.impressions),
      reactions: Math.max(post.reactions, trackingForm.reactions),
      comments: Math.max(post.comments, trackingForm.comments),
    });
    toast('Tracking entry added', 'success');
    setTrackingModalPost(null);
    setTrackingForm({ impressions: 0, reactions: 0, comments: 0 });
  };

  const handleExport = (): void => {
    const lines: string[] = [
      'Title,Client,Published Date,Impressions,Reactions,Comments,Saves,Shares,Profile Views,Link Clicks,DMs,Leads,Tracking Entries',
    ];
    publishedPosts.forEach((p: Post) => {
      const client = p.clientId === 'personal' ? 'Personal' : (clients.find((c: Client) => c.id === p.clientId)?.name || '--');
      const trackingStr = p.trackingLog.map((t) => `${t.date}: imp=${t.impressions} react=${t.reactions} cmt=${t.comments}`).join(' | ');
      lines.push([
        `"${p.title.replace(/"/g, '""')}"`,
        `"${client}"`,
        p.publishedDate || '',
        p.impressions, p.reactions, p.comments, p.saves, p.shares,
        p.profileViews, p.linkClicks, p.dmsFromPost, p.leadsFromPost,
        `"${trackingStr}"`,
      ].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post-performance-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported post performance data', 'success');
  };

  const renderPostCard = (post: Post): React.ReactNode => {
    const client = post.clientId === 'personal' ? null : clients.find((c: Client) => c.id === post.clientId);
    const isExpanded = expandedPostId === post.id;
    const engTotal = post.reactions + post.comments + post.saves + post.shares;
    const engRate = post.impressions > 0 ? engTotal / post.impressions : 0;

    return (
      <Card key={post.id} style={{ marginBottom: 12 }}>
        {/* Header */}
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
              {post.title}
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>
              {post.clientId === 'personal' ? 'Personal' : client?.name || '--'}
              {post.publishedDate && ` \u00b7 ${formatDate(post.publishedDate)}`}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>
              {formatNumber(post.impressions)}
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>impressions</div>
          </div>
        </div>

        {/* Metrics Grid (always visible) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Impressions', value: formatNumber(post.impressions) },
            { label: 'Reactions', value: post.reactions },
            { label: 'Comments', value: post.comments },
            { label: 'Saves', value: post.saves },
            { label: 'Shares', value: post.shares },
            { label: 'Profile Views', value: post.profileViews },
            { label: 'Link Clicks', value: post.linkClicks },
            { label: 'DMs', value: post.dmsFromPost },
            { label: 'Leads', value: post.leadsFromPost },
          ].map((m) => (
            <div key={m.label} style={metricBoxStyle}>
              <div style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Expanded: Tracking Intervals + Log */}
        {isExpanded && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
            {/* Tracking intervals table */}
            <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Performance Tracking
            </h4>
            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, fontSize: 10 }}>Interval</th>
                    <th style={{ ...thStyle, fontSize: 10 }}>Date</th>
                    <th style={{ ...thStyle, fontSize: 10 }}>Impressions</th>
                    <th style={{ ...thStyle, fontSize: 10 }}>Reactions</th>
                    <th style={{ ...thStyle, fontSize: 10 }}>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {TRACKING_INTERVALS.map((interval) => {
                    const entry = getTrackingEntryForInterval(post, interval);
                    return (
                      <tr key={interval}>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: 12 }}>{getIntervalLabel(interval)}</td>
                        <td style={{ ...tdStyle, fontSize: 12, color: colors.textSecondary }}>
                          {entry ? formatDate(entry.date) : '--'}
                        </td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>{entry ? formatNumber(entry.impressions) : '--'}</td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>{entry ? entry.reactions : '--'}</td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>{entry ? entry.comments : '--'}</td>
                      </tr>
                    );
                  })}
                  {/* Latest entry */}
                  {(() => {
                    const latest = getLatestEntry(post);
                    return (
                      <tr style={{ background: colors.surfaceAlt }}>
                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: 12, color: colors.accent }}>Latest</td>
                        <td style={{ ...tdStyle, fontSize: 12, color: colors.textSecondary }}>
                          {latest ? formatDate(latest.date) : '--'}
                        </td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>{latest ? formatNumber(latest.impressions) : '--'}</td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>{latest ? latest.reactions : '--'}</td>
                        <td style={{ ...tdStyle, fontSize: 12 }}>{latest ? latest.comments : '--'}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Full tracking log */}
            {post.trackingLog.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  All Tracking Entries ({post.trackingLog.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[...post.trackingLog].sort((a, b) => a.date.localeCompare(b.date)).map((entry) => {
                    const daysSincePublish = post.publishedDate ? daysBetween(post.publishedDate, entry.date) : 0;
                    return (
                      <div key={entry.id} style={{
                        display: 'flex', gap: 12, padding: '6px 10px', background: colors.bg,
                        borderRadius: radius.sm, fontSize: 12, alignItems: 'center',
                      }}>
                        <span style={{ color: colors.textSecondary, width: 90, flexShrink: 0 }}>{formatDate(entry.date)}</span>
                        <span style={{ color: colors.textMuted, width: 50, flexShrink: 0 }}>Day {daysSincePublish}</span>
                        <span style={{ color: colors.textPrimary }}>
                          Imp: {formatNumber(entry.impressions)} | React: {entry.reactions} | Cmt: {entry.comments}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Btn size="sm" onClick={() => {
              setTrackingForm({ impressions: post.impressions, reactions: post.reactions, comments: post.comments });
              setTrackingModalPost(post.id);
            }}>
              Add Tracking Entry
            </Btn>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <SectionHeader
        title="Post Performance"
        subtitle="Track and analyze published content performance"
        actions={
          <Btn variant="secondary" size="sm" onClick={handleExport}>
            <DownloadIcon size={14} /> Export CSV
          </Btn>
        }
      />

      {/* Filter Bar */}
      <Card style={{ marginBottom: 20, padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Client" style={{ marginBottom: 0, minWidth: 160 }}>
            <Select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="personal">Personal</option>
              {clientList.map((c: Client) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="From" style={{ marginBottom: 0, minWidth: 140 }}>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label="To" style={{ marginBottom: 0, minWidth: 140 }}>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
          {(dateFrom || dateTo || clientFilter !== 'all') && (
            <Btn variant="ghost" size="sm" onClick={() => { setClientFilter('all'); setDateFrom(''); setDateTo(''); }}
              style={{ marginBottom: 0 }}>
              Clear Filters
            </Btn>
          )}
        </div>
      </Card>

      {/* Post Cards */}
      {publishedPosts.length === 0 ? (
        <EmptyState message="No published posts match your filters." />
      ) : (
        <>
          <div style={{ marginBottom: 8, fontSize: 13, color: colors.textSecondary }}>
            {publishedPosts.length} published post{publishedPosts.length !== 1 ? 's' : ''}
          </div>
          {publishedPosts.map(renderPostCard)}
        </>
      )}

      {/* Top Posts Table */}
      {topPosts.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>
            Top Posts by Impressions
          </h3>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
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
                  {topPosts.map((p: Post, idx: number) => {
                    const client = p.clientId === 'personal' ? null : clients.find((c: Client) => c.id === p.clientId);
                    const engTotal = p.reactions + p.comments + p.saves + p.shares;
                    const engRate = p.impressions > 0 ? engTotal / p.impressions : 0;
                    return (
                      <tr key={p.id}>
                        <td style={{ ...tdStyle, color: colors.textMuted, width: 30 }}>{idx + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
        </div>
      )}

      {/* Add Tracking Modal */}
      <Modal
        open={trackingModalPost !== null}
        onClose={() => setTrackingModalPost(null)}
        title="Add Tracking Entry"
        width={420}
      >
        <div style={{ marginBottom: 8, fontSize: 13, color: colors.textSecondary }}>
          Recording metrics as of <strong style={{ color: colors.textPrimary }}>{formatDate(today())}</strong>
        </div>
        <Field label="Impressions" required>
          <Input
            type="number"
            value={trackingForm.impressions}
            onChange={(e) => setTrackingForm((f) => ({ ...f, impressions: parseInt(e.target.value) || 0 }))}
          />
        </Field>
        <Field label="Reactions" required>
          <Input
            type="number"
            value={trackingForm.reactions}
            onChange={(e) => setTrackingForm((f) => ({ ...f, reactions: parseInt(e.target.value) || 0 }))}
          />
        </Field>
        <Field label="Comments" required>
          <Input
            type="number"
            value={trackingForm.comments}
            onChange={(e) => setTrackingForm((f) => ({ ...f, comments: parseInt(e.target.value) || 0 }))}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setTrackingModalPost(null)}>Cancel</Btn>
          <Btn onClick={handleAddTracking}>Save Entry</Btn>
        </div>
      </Modal>
    </div>
  );
};
