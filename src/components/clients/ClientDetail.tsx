import React, { useState } from 'react';
import { colors } from '../../utils/theme';
import { Btn, Badge, StatusBadge, Field, Input, TextArea, Select } from '../shared/FormElements';
import { XIcon, EditIcon, TrashIcon, PlusIcon } from '../shared/Icons';
import { formatCurrency, formatDate, formatNumber, formatPercent, genId, today } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { Client, Post, Activity } from '../../types';

interface Props {
  client: Client;
  posts: Post[];
  onClose: () => void;
  onUpdate: (updates: Partial<Client>) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ClientDetail: React.FC<Props> = ({ client, posts, onClose, onUpdate, onEdit, onDelete }) => {
  const [tab, setTab] = useState<'overview' | 'content' | 'analytics' | 'activity'>('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actType, setActType] = useState<Activity['type']>('meeting');
  const [actDate, setActDate] = useState(today());
  const [actNotes, setActNotes] = useState('');

  const publishedPosts = posts.filter((p) => p.status === 'published');
  const totalImpressions = publishedPosts.reduce((s, p) => s + p.impressions, 0);
  const totalEngagement = publishedPosts.reduce((s, p) => s + p.reactions + p.comments, 0);
  const avgImpressions = publishedPosts.length ? Math.round(totalImpressions / publishedPosts.length) : 0;
  const avgEngRate = totalImpressions > 0 ? totalEngagement / totalImpressions : 0;

  const addActivity = () => {
    const activity: Activity = { id: genId(), date: actDate, type: actType, notes: actNotes };
    onUpdate({ activities: [...client.activities, activity] });
    setShowAddActivity(false);
    setActNotes('');
  };

  // Chart data
  const chartData = publishedPosts
    .filter((p) => p.publishedDate)
    .sort((a, b) => a.publishedDate!.localeCompare(b.publishedDate!))
    .map((p) => ({
      date: p.publishedDate!.slice(5),
      impressions: p.impressions,
      engagement: p.reactions + p.comments,
    }));

  const tabs = ['overview', 'content', 'analytics', 'activity'] as const;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 600, maxWidth: '100vw', height: '100vh',
      background: colors.surface, borderLeft: `1px solid ${colors.border}`, zIndex: 999,
      display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: colors.textPrimary }}>{client.name}</h3>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>{client.company}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn variant="ghost" size="sm" onClick={onEdit}><EditIcon size={14} /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}><TrashIcon size={14} /></Btn>
            <Btn variant="ghost" size="sm" onClick={onClose}><XIcon size={14} /></Btn>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={client.status} />
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.success }}>{formatCurrency(client.retainer)}/mo</span>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 16px', border: 'none', borderBottom: tab === t ? `2px solid ${colors.accent}` : '2px solid transparent',
              background: 'transparent', color: tab === t ? colors.accent : colors.textSecondary,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Posts', value: publishedPosts.length },
                { label: 'Avg Impressions', value: formatNumber(avgImpressions) },
                { label: 'Avg Eng. Rate', value: formatPercent(avgEngRate) },
                { label: 'Total Impressions', value: formatNumber(totalImpressions) },
                { label: 'Total Engagement', value: formatNumber(totalEngagement) },
                { label: 'Since', value: formatDate(client.startDate) },
              ].map((m) => (
                <div key={m.label} style={{ background: colors.bg, padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>CONTENT PILLARS</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {client.pillars.length > 0 ? client.pillars.map((p) => <Badge key={p} color={colors.accent}>{p}</Badge>) : <span style={{ fontSize: 13, color: colors.textSecondary }}>None set</span>}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>POSTING SCHEDULE</div>
              <div style={{ fontSize: 13, color: colors.textPrimary }}>{client.postingSchedule || 'Not set'}</div>
            </div>
            {client.notes && (
              <div>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>NOTES</div>
                <div style={{ fontSize: 13, color: colors.textPrimary, background: colors.bg, padding: 12, borderRadius: 6 }}>{client.notes}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'content' && (
          <div>
            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.textSecondary, padding: 32 }}>No posts for this client yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {posts.sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')).map((p) => (
                  <div key={p.id} style={{
                    padding: 12, background: colors.bg, borderRadius: 6, border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary }}>{p.title}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.pillar && <Badge color={colors.accent}>{p.pillar}</Badge>}
                    {p.status === 'published' && (
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
                        <span>{formatNumber(p.impressions)} imp</span>
                        <span>{p.reactions} reactions</span>
                        <span>{p.comments} comments</span>
                        <span>{formatPercent((p.reactions + p.comments) / Math.max(p.impressions, 1))} eng</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            {chartData.length < 2 ? (
              <div style={{ textAlign: 'center', color: colors.textSecondary, padding: 32 }}>Need at least 2 published posts for charts</div>
            ) : (
              <>
                <h4 style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>IMPRESSIONS OVER TIME</h4>
                <div style={{ height: 200, marginBottom: 24 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke={colors.textSecondary} fontSize={11} />
                      <YAxis stroke={colors.textSecondary} fontSize={11} />
                      <Tooltip contentStyle={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary }} />
                      <Line type="monotone" dataKey="impressions" stroke={colors.accent} strokeWidth={2} dot={{ fill: colors.accent }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <h4 style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>ENGAGEMENT PER POST</h4>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <XAxis dataKey="date" stroke={colors.textSecondary} fontSize={11} />
                      <YAxis stroke={colors.textSecondary} fontSize={11} />
                      <Tooltip contentStyle={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary }} />
                      <Bar dataKey="engagement" fill={colors.info} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(!showAddActivity)}><PlusIcon size={12} /> Log Activity</Btn>
            </div>
            {showAddActivity && (
              <div style={{ background: colors.bg, padding: 12, borderRadius: 6, marginBottom: 12, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="Type">
                    <Select value={actType} onChange={(e) => setActType(e.target.value as Activity['type'])}>
                      <option value="meeting">Meeting</option>
                      <option value="feedback">Feedback</option>
                      <option value="scope_change">Scope Change</option>
                      <option value="note">Note</option>
                    </Select>
                  </Field>
                  <Field label="Date"><Input type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} /></Field>
                </div>
                <Field label="Notes"><TextArea value={actNotes} onChange={(e) => setActNotes(e.target.value)} style={{ minHeight: 60 }} /></Field>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(false)}>Cancel</Btn>
                  <Btn size="sm" onClick={addActivity}>Add</Btn>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...client.activities].reverse().map((a) => (
                <div key={a.id} style={{ padding: '8px 12px', background: colors.bg, borderRadius: 6, border: `1px solid ${colors.border}`, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <StatusBadge status={a.type} />
                    <span style={{ color: colors.textSecondary, fontSize: 11 }}>{formatDate(a.date)}</span>
                  </div>
                  {a.notes && <div style={{ color: colors.textPrimary, marginTop: 4 }}>{a.notes}</div>}
                </div>
              ))}
              {client.activities.length === 0 && <div style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13, padding: 20 }}>No activity logged</div>}
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, background: colors.bg, borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: colors.error }}>Delete this client and all their data?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
            <Btn variant="danger" size="sm" onClick={onDelete}>Delete</Btn>
          </div>
        </div>
      )}
    </div>
  );
};
