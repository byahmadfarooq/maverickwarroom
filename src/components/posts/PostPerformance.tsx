import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, EmptyState } from '../shared/FormElements';
import { SearchIcon } from '../shared/Icons';
import { formatNumber, formatPercent, formatDate } from '../../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar, Legend } from 'recharts';

const COLORS = [colors.accent, colors.info, colors.success, colors.warning, '#A855F7', '#EC4899'];

export const PostPerformance: React.FC = () => {
  const { posts, clients } = useApp();
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const published = posts.filter((p) => p.status === 'published');

  const filtered = published.filter((p) => {
    if (clientFilter !== 'all' && p.clientId !== clientFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''));

  const detail = selectedPost ? posts.find((p) => p.id === selectedPost) : null;
  const detailClient = detail ? clients.find((c) => c.id === detail.clientId) : null;

  // Top performers
  const byImpressions = [...published].sort((a, b) => b.impressions - a.impressions);
  const byEngagement = [...published].sort((a, b) => {
    const rateA = a.impressions > 0 ? (a.reactions + a.comments) / a.impressions : 0;
    const rateB = b.impressions > 0 ? (b.reactions + b.comments) / b.impressions : 0;
    return rateB - rateA;
  });
  const byLeads = [...published].sort((a, b) => b.leadsFromPost - a.leadsFromPost);

  if (selectedPost && detail) {
    const engTotal = detail.reactions + detail.comments + detail.saves + detail.shares;
    const engBreakdown = [
      { name: 'Reactions', value: detail.reactions },
      { name: 'Comments', value: detail.comments },
      { name: 'Saves', value: detail.saves },
      { name: 'Shares', value: detail.shares },
    ].filter((d) => d.value > 0);

    return (
      <div>
        <Btn variant="secondary" size="sm" onClick={() => setSelectedPost(null)} style={{ marginBottom: 16 }}>Back to List</Btn>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: colors.textPrimary }}>{detail.title}</h3>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>{detailClient?.name} &middot; {detail.publishedDate ? formatDate(detail.publishedDate) : ''}</div>
            </div>
            {detail.pillar && <Badge color={colors.accent}>{detail.pillar}</Badge>}
          </div>
          {detail.content && <div style={{ fontSize: 13, color: colors.textPrimary, background: colors.bg, padding: 12, borderRadius: 6, marginTop: 8, whiteSpace: 'pre-wrap' }}>{detail.content}</div>}
        </Card>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Impressions', value: formatNumber(detail.impressions) },
            { label: 'Reactions', value: detail.reactions },
            { label: 'Comments', value: detail.comments },
            { label: 'Saves', value: detail.saves },
            { label: 'Shares', value: detail.shares },
            { label: 'Eng. Rate', value: formatPercent(detail.impressions > 0 ? engTotal / detail.impressions : 0) },
            { label: 'Profile Views', value: detail.profileViews },
            { label: 'Link Clicks', value: detail.linkClicks },
            { label: 'DMs', value: detail.dmsFromPost },
            { label: 'Leads', value: detail.leadsFromPost },
          ].map((m) => (
            <div key={m.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Engagement Breakdown Pie + Tracking Log */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {engBreakdown.length > 0 && (
            <Card>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: colors.textSecondary }}>ENGAGEMENT BREAKDOWN</h4>
              <div style={{ height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={engBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {engBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {detail.trackingLog.length > 0 && (
            <Card>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: colors.textSecondary }}>IMPRESSION GROWTH</h4>
              <div style={{ height: 200 }}>
                <ResponsiveContainer>
                  <LineChart data={detail.trackingLog.sort((a, b) => a.date.localeCompare(b.date))}>
                    <XAxis dataKey="date" stroke={colors.textSecondary} fontSize={11} tickFormatter={(v) => v.slice(5)} />
                    <YAxis stroke={colors.textSecondary} fontSize={11} />
                    <Tooltip contentStyle={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary }} />
                    <Line type="monotone" dataKey="impressions" stroke={colors.accent} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Compare view
  if (showCompare && compareIds.length >= 2) {
    const comparePosts = compareIds.map((id) => posts.find((p) => p.id === id)!).filter(Boolean);
    return (
      <div>
        <Btn variant="secondary" size="sm" onClick={() => { setShowCompare(false); setCompareIds([]); }} style={{ marginBottom: 16 }}>Back to List</Btn>
        <h3 style={{ fontSize: 14, color: colors.textPrimary, marginBottom: 16 }}>Comparing {comparePosts.length} Posts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparePosts.length}, 1fr)`, gap: 16, marginBottom: 24 }}>
          {comparePosts.map((p) => (
            <Card key={p.id}>
              <div style={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, marginBottom: 8 }}>{p.title}</div>
              {[
                ['Impressions', formatNumber(p.impressions)],
                ['Reactions', p.reactions],
                ['Comments', p.comments],
                ['Eng. Rate', formatPercent(p.impressions > 0 ? (p.reactions + p.comments) / p.impressions : 0)],
                ['Leads', p.leadsFromPost],
              ].map(([l, v]) => (
                <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${colors.border}`, fontSize: 12 }}>
                  <span style={{ color: colors.textSecondary }}>{l as string}</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{v as React.ReactNode}</span>
                </div>
              ))}
            </Card>
          ))}
        </div>
        <Card>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: colors.textSecondary }}>COMPARISON CHART</h4>
          <div style={{ height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={comparePosts.map((p) => ({ name: p.title.slice(0, 20), impressions: p.impressions, reactions: p.reactions, comments: p.comments }))}>
                <XAxis dataKey="name" stroke={colors.textSecondary} fontSize={11} />
                <YAxis stroke={colors.textSecondary} fontSize={11} />
                <Tooltip contentStyle={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary }} />
                <Legend />
                <Bar dataKey="impressions" fill={colors.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="reactions" fill={colors.info} radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" fill={colors.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: 10, top: 9, color: colors.textSecondary }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..."
            style={{ width: '100%', padding: '8px 12px 8px 32px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}
          style={{ padding: '8px 12px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary, fontSize: 14, outline: 'none' }}>
          <option value="all">All Clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {compareIds.length >= 2 && <Btn size="sm" onClick={() => setShowCompare(true)}>Compare ({compareIds.length})</Btn>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No published posts to show." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '8px 6px', width: 30 }}></th>
                {['Date', 'Client', 'Title', 'Impressions', 'Reactions', 'Comments', 'Eng. Rate', 'Leads'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: colors.textSecondary, fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                const engRate = p.impressions > 0 ? (p.reactions + p.comments) / p.impressions : 0;
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 6px' }}>
                      <input type="checkbox" checked={compareIds.includes(p.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setCompareIds((ids) => ids.includes(p.id) ? ids.filter((x) => x !== p.id) : [...ids, p.id]);
                        }} />
                    </td>
                    <td style={{ padding: '8px 10px', color: colors.textSecondary }} onClick={() => setSelectedPost(p.id)}>{p.publishedDate ? formatDate(p.publishedDate) : '-'}</td>
                    <td style={{ padding: '8px 10px', color: colors.textPrimary }} onClick={() => setSelectedPost(p.id)}>{client?.name || '-'}</td>
                    <td style={{ padding: '8px 10px', color: colors.textPrimary, fontWeight: 500 }} onClick={() => setSelectedPost(p.id)}>{p.title}</td>
                    <td style={{ padding: '8px 10px', color: colors.textPrimary }} onClick={() => setSelectedPost(p.id)}>{formatNumber(p.impressions)}</td>
                    <td style={{ padding: '8px 10px', color: colors.textPrimary }} onClick={() => setSelectedPost(p.id)}>{p.reactions}</td>
                    <td style={{ padding: '8px 10px', color: colors.textPrimary }} onClick={() => setSelectedPost(p.id)}>{p.comments}</td>
                    <td style={{ padding: '8px 10px', color: colors.textPrimary }} onClick={() => setSelectedPost(p.id)}>{formatPercent(engRate)}</td>
                    <td style={{ padding: '8px 10px', color: p.leadsFromPost > 0 ? colors.success : colors.textSecondary }} onClick={() => setSelectedPost(p.id)}>{p.leadsFromPost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Performers */}
      {published.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 16 }}>Top Performers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {[
              { label: 'Most Impressions', post: byImpressions[0], metric: formatNumber(byImpressions[0]?.impressions || 0) },
              { label: 'Best Engagement', post: byEngagement[0], metric: formatPercent(byEngagement[0]?.impressions ? (byEngagement[0].reactions + byEngagement[0].comments) / byEngagement[0].impressions : 0) },
              { label: 'Most Leads', post: byLeads[0], metric: `${byLeads[0]?.leadsFromPost || 0} leads` },
            ].filter((t) => t.post).map((t) => (
              <Card key={t.label} onClick={() => setSelectedPost(t.post!.id)} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary }}>{t.post!.title}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent, marginTop: 4 }}>{t.metric}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
