import React, { useState, useContext, useMemo } from 'react';
import { AppCtx } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Btn, Card, SectionHeader, Select, EmptyState, Field, Input } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { DownloadIcon } from '../shared/Icons';
import { formatNumber, formatPercent, formatDate, daysBetween, today } from '../../utils/helpers';
import { StoriesViewer, parseImageUrls } from '../shared/StoriesViewer';
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

const emptyForm = {
  date: today(),
  impressions: 0, reactions: 0, comments: 0,
  saves: 0, shares: 0, profileViews: 0,
  linkClicks: 0, dmsFromPost: 0, leadsFromPost: 0,
};

function parseLinkedInText(raw: string): Partial<typeof emptyForm> {
  const text = raw.replace(/,/g, '').toLowerCase();
  const extract = (...keywords: string[]): number => {
    for (const kw of keywords) {
      const escaped = kw.replace(/\s+/g, '[\\s\\S]{0,6}');
      let m = text.match(new RegExp(`(\\d+)[^\\d]{0,12}${escaped}`));
      if (m) return parseInt(m[1]);
      m = text.match(new RegExp(`${escaped}[^\\d]{0,12}(\\d+)`));
      if (m) return parseInt(m[1]);
    }
    return 0;
  };
  return {
    impressions:   extract('impressions', 'views', 'reach'),
    reactions:     extract('reactions', 'likes', 'like'),
    comments:      extract('comments', 'comment'),
    saves:         extract('saves', 'save', 'bookmarks', 'bookmark'),
    shares:        extract('reposts', 'repost', 'shares', 'share'),
    profileViews:  extract('profile views', 'profile view'),
    linkClicks:    extract('link clicks', 'link click', 'clicks'),
    dmsFromPost:   extract('dms', 'direct messages'),
    leadsFromPost: extract('leads'),
  };
}

function getTrackingEntryForInterval(post: Post, intervalDays: number): TrackingEntry | undefined {
  if (!post.publishedDate) return undefined;
  const targetDate = new Date(post.publishedDate);
  targetDate.setDate(targetDate.getDate() + intervalDays);
  const targetStr = targetDate.toISOString().split('T')[0];
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
  const [trackingForm, setTrackingForm] = useState({ ...emptyForm });
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [storiesPost, setStoriesPost] = useState<Post | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [parsedOk, setParsedOk] = useState(false);

  const publishedPosts = useMemo(() => {
    let filtered = posts.filter((p: Post) => p.status === 'published');
    if (clientFilter === 'personal') {
      filtered = filtered.filter((p: Post) => p.clientId === 'personal');
    } else if (clientFilter !== 'all') {
      filtered = filtered.filter((p: Post) => p.clientId === clientFilter);
    }
    if (dateFrom) filtered = filtered.filter((p: Post) => (p.publishedDate || '') >= dateFrom);
    if (dateTo) filtered = filtered.filter((p: Post) => (p.publishedDate || '') <= dateTo);
    return filtered.sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''));
  }, [posts, clientFilter, dateFrom, dateTo]);

  const topPosts = useMemo(() => {
    return [...publishedPosts].sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  }, [publishedPosts]);

  const clientList = useMemo(() => {
    const uniqueIds = new Set(posts.map((p: Post) => p.clientId).filter((id) => id !== 'personal'));
    return clients.filter((c: Client) => uniqueIds.has(c.id));
  }, [posts, clients]);

  const openTrackingModal = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackingForm({
      date: today(),
      impressions: post.impressions,
      reactions: post.reactions,
      comments: post.comments,
      saves: post.saves,
      shares: post.shares,
      profileViews: post.profileViews,
      linkClicks: post.linkClicks,
      dmsFromPost: post.dmsFromPost,
      leadsFromPost: post.leadsFromPost,
    });
    setTrackingModalPost(post.id);
    setPasteText('');
    setParsedOk(false);
  };

  const handleAddTracking = (): void => {
    if (!trackingModalPost) return;
    const post = posts.find((p: Post) => p.id === trackingModalPost);
    if (!post) return;

    const entry: TrackingEntry = {
      id: Math.random().toString(36).slice(2),
      date: trackingForm.date || today(),
      impressions: trackingForm.impressions,
      reactions: trackingForm.reactions,
      comments: trackingForm.comments,
      saves: trackingForm.saves,
      shares: trackingForm.shares,
      profileViews: trackingForm.profileViews,
      linkClicks: trackingForm.linkClicks,
      dmsFromPost: trackingForm.dmsFromPost,
      leadsFromPost: trackingForm.leadsFromPost,
    };

    // Update the post's top-level metrics to the max seen across all entries
    updatePost(trackingModalPost, {
      trackingLog: [...post.trackingLog, entry],
      impressions: Math.max(post.impressions, trackingForm.impressions),
      reactions: Math.max(post.reactions, trackingForm.reactions),
      comments: Math.max(post.comments, trackingForm.comments),
      saves: Math.max(post.saves, trackingForm.saves),
      shares: Math.max(post.shares, trackingForm.shares),
      profileViews: Math.max(post.profileViews, trackingForm.profileViews),
      linkClicks: Math.max(post.linkClicks, trackingForm.linkClicks),
      dmsFromPost: Math.max(post.dmsFromPost, trackingForm.dmsFromPost),
      leadsFromPost: Math.max(post.leadsFromPost, trackingForm.leadsFromPost),
    });
    toast('Analytics entry saved', 'success');
    setTrackingModalPost(null);
    setTrackingForm({ ...emptyForm });
  };

  const handleExport = (): void => {
    const lines: string[] = [
      'Title,Client,Published Date,Impressions,Reactions,Comments,Saves,Shares,Profile Views,Link Clicks,DMs,Leads,Tracking Entries',
    ];
    publishedPosts.forEach((p: Post) => {
      const client = p.clientId === 'personal' ? 'Personal' : (clients.find((c: Client) => c.id === p.clientId)?.name || '--');
      const trackingStr = p.trackingLog.map((t) =>
        `${t.date}: imp=${t.impressions} react=${t.reactions} cmt=${t.comments} saves=${t.saves ?? 0}`
      ).join(' | ');
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

  const setField = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = key === 'date' ? e.target.value : (parseInt(e.target.value) || 0);
    setTrackingForm((f) => ({ ...f, [key]: val }));
  };

  const renderPostCard = (post: Post): React.ReactNode => {
    const client = post.clientId === 'personal' ? null : clients.find((c: Client) => c.id === post.clientId);
    const isExpanded = expandedPostId === post.id;
    const engTotal = post.reactions + post.comments + post.saves + post.shares;
    const engRate = post.impressions > 0 ? engTotal / post.impressions : 0;

    return (
      <Card key={post.id} style={{ marginBottom: 12 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          {/* Click area to expand */}
          <div
            style={{ flex: 1, cursor: 'pointer' }}
            onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
              {post.title}
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>
              {post.clientId === 'personal' ? 'Personal' : client?.name || '--'}
              {post.publishedDate && ` · ${formatDate(post.publishedDate)}`}
              {post.trackingLog.length > 0 && (
                <span style={{
                  marginLeft: 8, background: colors.accentMuted, color: colors.accent,
                  padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                }}>
                  {post.trackingLog.length} log{post.trackingLog.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Right side: impressions + action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: 'right', marginRight: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.accent, lineHeight: 1.1 }}>
                {formatNumber(post.impressions)}
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>impressions</div>
            </div>
            {post.imageUrl && parseImageUrls(post.imageUrl).length > 0 && (
              <Btn
                variant="secondary" size="sm"
                onClick={(e) => { e.stopPropagation(); setStoriesPost(post); }}
                style={{ whiteSpace: 'nowrap' }}
                title="View images"
              >
                🖼 View
              </Btn>
            )}
            <Btn size="sm" onClick={(e) => openTrackingModal(post, e)} style={{ whiteSpace: 'nowrap' }}>
              + Log Analytics
            </Btn>
          </div>
        </div>

        {/* Metrics Grid (always visible) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 6, marginTop: 12 }}>
          {[
            { label: 'Reactions', value: post.reactions },
            { label: 'Comments', value: post.comments },
            { label: 'Saves', value: post.saves },
            { label: 'Shares', value: post.shares },
            { label: 'Profile Views', value: post.profileViews },
            { label: 'Link Clicks', value: post.linkClicks },
            { label: 'DMs', value: post.dmsFromPost },
            { label: 'Leads', value: post.leadsFromPost },
            { label: 'Eng. Rate', value: formatPercent(engRate) },
          ].map((m) => (
            <div key={m.label} style={metricBoxStyle}>
              <div style={{ fontSize: 9, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        <div
          style={{ marginTop: 10, fontSize: 11, color: colors.textMuted, cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
        >
          {isExpanded ? '▲ Hide history' : '▼ Show tracking history'}
        </div>

        {/* Expanded: Tracking history */}
        {isExpanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Interval Snapshots
            </h4>
            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Interval', 'Date', 'Imp.', 'React.', 'Cmt.', 'Saves', 'Shares', 'DMs', 'Leads'].map((h) => (
                      <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRACKING_INTERVALS.map((interval) => {
                    const entry = getTrackingEntryForInterval(post, interval);
                    return (
                      <tr key={interval}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{interval}d</td>
                        <td style={{ ...tdStyle, color: colors.textSecondary }}>{entry ? formatDate(entry.date) : '--'}</td>
                        <td style={tdStyle}>{entry ? formatNumber(entry.impressions) : '--'}</td>
                        <td style={tdStyle}>{entry ? entry.reactions : '--'}</td>
                        <td style={tdStyle}>{entry ? entry.comments : '--'}</td>
                        <td style={tdStyle}>{entry ? (entry.saves ?? '--') : '--'}</td>
                        <td style={tdStyle}>{entry ? (entry.shares ?? '--') : '--'}</td>
                        <td style={tdStyle}>{entry ? (entry.dmsFromPost ?? '--') : '--'}</td>
                        <td style={tdStyle}>{entry ? (entry.leadsFromPost ?? '--') : '--'}</td>
                      </tr>
                    );
                  })}
                  {(() => {
                    const latest = getLatestEntry(post);
                    return (
                      <tr style={{ background: colors.surfaceAlt }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: colors.accent }}>Latest</td>
                        <td style={{ ...tdStyle, color: colors.textSecondary }}>{latest ? formatDate(latest.date) : '--'}</td>
                        <td style={tdStyle}>{latest ? formatNumber(latest.impressions) : '--'}</td>
                        <td style={tdStyle}>{latest ? latest.reactions : '--'}</td>
                        <td style={tdStyle}>{latest ? latest.comments : '--'}</td>
                        <td style={tdStyle}>{latest ? (latest.saves ?? '--') : '--'}</td>
                        <td style={tdStyle}>{latest ? (latest.shares ?? '--') : '--'}</td>
                        <td style={tdStyle}>{latest ? (latest.dmsFromPost ?? '--') : '--'}</td>
                        <td style={tdStyle}>{latest ? (latest.leadsFromPost ?? '--') : '--'}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {post.trackingLog.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  All Entries ({post.trackingLog.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[...post.trackingLog].sort((a, b) => a.date.localeCompare(b.date)).map((entry) => {
                    const daysSince = post.publishedDate ? daysBetween(post.publishedDate, entry.date) : 0;
                    return (
                      <div key={entry.id} style={{
                        display: 'flex', gap: 10, padding: '6px 10px', background: colors.bg,
                        borderRadius: radius.sm, fontSize: 12, alignItems: 'center', flexWrap: 'wrap',
                      }}>
                        <span style={{ color: colors.textSecondary, minWidth: 80, flexShrink: 0 }}>{formatDate(entry.date)}</span>
                        <span style={{ color: colors.textMuted, minWidth: 46, flexShrink: 0 }}>Day {daysSince}</span>
                        <span style={{ color: colors.textPrimary }}>
                          {formatNumber(entry.impressions)} imp · {entry.reactions} react · {entry.comments} cmt
                          {entry.saves ? ` · ${entry.saves} saves` : ''}
                          {entry.shares ? ` · ${entry.shares} shares` : ''}
                          {entry.dmsFromPost ? ` · ${entry.dmsFromPost} DMs` : ''}
                          {entry.leadsFromPost ? ` · ${entry.leadsFromPost} leads` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

      {/* Stories / Image Viewer */}
      {storiesPost && storiesPost.imageUrl && (
        <StoriesViewer
          images={parseImageUrls(storiesPost.imageUrl)}
          title={storiesPost.title}
          onClose={() => setStoriesPost(null)}
        />
      )}

      {/* Log Analytics Modal */}
      <Modal
        open={trackingModalPost !== null}
        onClose={() => setTrackingModalPost(null)}
        title="Log Analytics"
        width={500}
      >
        {(() => {
          const post = posts.find((p: Post) => p.id === trackingModalPost);
          return (
            <>
              {post && (
                <div style={{ marginBottom: 14, padding: '8px 12px', background: colors.surfaceAlt, borderRadius: radius.md, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: colors.textPrimary }}>{post.title}</span>
                  {post.publishedDate && (
                    <span style={{ color: colors.textSecondary, marginLeft: 8 }}>· published {formatDate(post.publishedDate)}</span>
                  )}
                </div>
              )}

              {/* Paste from LinkedIn */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Paste from LinkedIn
                  </span>
                  {parsedOk && (
                    <span style={{ fontSize: 11, color: colors.success, fontWeight: 600 }}>Parsed ✓</span>
                  )}
                </div>
                <textarea
                  value={pasteText}
                  placeholder={"Paste your LinkedIn post analytics text here and fields will auto-fill…"}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setPasteText(raw);
                    if (raw.trim()) {
                      const parsed = parseLinkedInText(raw);
                      const hasData = Object.values(parsed).some((v) => (v as number) > 0);
                      if (hasData) {
                        setTrackingForm((f) => ({ ...f, ...parsed }));
                        setParsedOk(true);
                      } else {
                        setParsedOk(false);
                      }
                    } else {
                      setParsedOk(false);
                    }
                  }}
                  style={{
                    width: '100%', minHeight: 70, resize: 'vertical', boxSizing: 'border-box',
                    background: colors.bg, border: `1px solid ${parsedOk ? colors.success : colors.border}`,
                    borderRadius: radius.md, color: colors.textPrimary, fontSize: 12,
                    padding: '8px 10px', fontFamily: 'inherit', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              <Field label="Snapshot Date" required>
                <Input type="date" value={trackingForm.date} onChange={setField('date')} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <Field label="Impressions" required>
                  <Input type="number" value={trackingForm.impressions} onChange={setField('impressions')} />
                </Field>
                <Field label="Reactions" required>
                  <Input type="number" value={trackingForm.reactions} onChange={setField('reactions')} />
                </Field>
                <Field label="Comments" required>
                  <Input type="number" value={trackingForm.comments} onChange={setField('comments')} />
                </Field>
                <Field label="Saves">
                  <Input type="number" value={trackingForm.saves} onChange={setField('saves')} />
                </Field>
                <Field label="Shares">
                  <Input type="number" value={trackingForm.shares} onChange={setField('shares')} />
                </Field>
                <Field label="Profile Views">
                  <Input type="number" value={trackingForm.profileViews} onChange={setField('profileViews')} />
                </Field>
                <Field label="Link Clicks">
                  <Input type="number" value={trackingForm.linkClicks} onChange={setField('linkClicks')} />
                </Field>
                <Field label="DMs from Post">
                  <Input type="number" value={trackingForm.dmsFromPost} onChange={setField('dmsFromPost')} />
                </Field>
                <Field label="Leads from Post">
                  <Input type="number" value={trackingForm.leadsFromPost} onChange={setField('leadsFromPost')} />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <Btn variant="secondary" onClick={() => setTrackingModalPost(null)}>Cancel</Btn>
                <Btn onClick={handleAddTracking}>Save Entry</Btn>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
};
