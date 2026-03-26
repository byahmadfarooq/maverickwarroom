import React, { useState } from 'react';
import { colors, radius } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, StatCard, TabBar, Field, Input, TextArea, Select } from '../shared/FormElements';
import { XIcon, EditIcon, TrashIcon, PlusIcon } from '../shared/Icons';
import { useApp } from '../../hooks/AppContext';
import {
  formatCurrency, formatDate, formatNumber, formatPercent, formatDualCurrency,
  genId, today, statusLabel,
} from '../../utils/helpers';
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

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
};

const valueStyle: React.CSSProperties = {
  fontSize: 13, color: colors.textPrimary, lineHeight: 1.6,
};

const kgSectionStyle: React.CSSProperties = {
  marginBottom: 18,
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 998,
  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
};

const panelStyle: React.CSSProperties = {
  position: 'fixed', top: 0, right: 0, width: 600, maxWidth: '100vw', height: '100vh',
  background: colors.surface, borderLeft: `1px solid ${colors.border}`, zIndex: 999,
  display: 'flex', flexDirection: 'column',
  boxShadow: '-8px 0 30px rgba(0,0,0,0.4)',
  animation: 'slideInRight 0.25s ease-out',
};

export const ClientDetail: React.FC<Props> = ({ client, posts, onClose, onUpdate, onEdit, onDelete }) => {
  const { settings } = useApp();
  const [tab, setTab] = useState('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actType, setActType] = useState<Activity['type']>('meeting');
  const [actDate, setActDate] = useState(today());
  const [actNotes, setActNotes] = useState('');

  const rate = settings?.finance?.exchangeRate ?? 278;
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const totalImpressions = publishedPosts.reduce((s, p) => s + p.impressions, 0);
  const totalEngagement = publishedPosts.reduce((s, p) => s + p.reactions + p.comments, 0);
  const avgImpressions = publishedPosts.length ? Math.round(totalImpressions / publishedPosts.length) : 0;
  const avgEngRate = totalImpressions > 0 ? totalEngagement / totalImpressions : 0;
  const monthlyValue = client.billingType === 'retainer' ? (client.retainer ?? 0) : (client.projectValue ?? 0);
  const clientActivities = client.activities ?? [];
  const clientPillars = client.pillars ?? [];

  const addActivity = () => {
    const activity: Activity = { id: genId(), date: actDate, type: actType, notes: actNotes };
    onUpdate({ activities: [...clientActivities, activity] });
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

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'knowledge', label: 'Knowledge' },
    { key: 'content', label: 'Content' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'activity', label: 'Activity' },
  ];

  const kg = client.knowledgeGraph;

  const KgField: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => {
    if (!value) return null;
    return (
      <div style={kgSectionStyle}>
        <div style={labelStyle}>{label}</div>
        <div style={{
          ...valueStyle, background: colors.bg, padding: 12,
          borderRadius: radius.sm, whiteSpace: 'pre-wrap',
        }}>
          {value}
        </div>
      </div>
    );
  };

  const KgTags: React.FC<{ label: string; tags: string[] | undefined }> = ({ label, tags }) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div style={kgSectionStyle}>
        <div style={labelStyle}>{label}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map((t) => <Badge key={t} color={colors.accent}>{t}</Badge>)}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle} onClick={onClose} />

      {/* Panel */}
      <div style={panelStyle}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: 12,
          }}>
            <div>
              <h3 style={{
                margin: 0, fontSize: 18, fontWeight: 700, color: colors.textPrimary,
                letterSpacing: -0.3,
              }}>
                {client.name}
              </h3>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {client.company}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn variant="ghost" size="sm" onClick={onEdit}><EditIcon size={14} /></Btn>
              <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                <TrashIcon size={14} />
              </Btn>
              <Btn variant="ghost" size="sm" onClick={onClose}><XIcon size={14} /></Btn>
            </div>
          </div>

          {/* Status + Value */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <StatusBadge status={client.status} />
            <StatusBadge status={client.billingType} />
            <span style={{
              fontSize: 18, fontWeight: 700, color: colors.success, letterSpacing: -0.3,
            }}>
              {formatCurrency(monthlyValue)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>
            {formatDualCurrency(monthlyValue, rate)}
          </div>

          {/* Tabs */}
          <TabBar tabs={tabs} active={tab} onChange={setTab} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <div>
              {/* Stats Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20,
              }}>
                {[
                  { label: 'Total Posts Delivered', value: publishedPosts.length, color: colors.textPrimary },
                  { label: 'Avg Impressions', value: formatNumber(avgImpressions), color: colors.info },
                  { label: 'Avg Engagement Rate', value: formatPercent(avgEngRate), color: colors.accent },
                  { label: 'Total Impressions', value: formatNumber(totalImpressions), color: colors.purple },
                ].map((m) => (
                  <div key={m.label} style={{
                    background: colors.bg, padding: 14, borderRadius: radius.md,
                    border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{
                      fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase',
                      letterSpacing: 0.8, marginBottom: 4,
                    }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: m.color, letterSpacing: -0.3 }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Fields */}
              <div style={kgSectionStyle}>
                <div style={labelStyle}>Start Date</div>
                <div style={valueStyle}>{formatDate(client.startDate)}</div>
              </div>

              <div style={kgSectionStyle}>
                <div style={labelStyle}>Content Pillars</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {clientPillars.length > 0
                    ? clientPillars.map((p) => <Badge key={p} color={colors.accent}>{p}</Badge>)
                    : <span style={{ fontSize: 13, color: colors.textMuted }}>None set</span>
                  }
                </div>
              </div>

              <div style={kgSectionStyle}>
                <div style={labelStyle}>Posting Schedule</div>
                <div style={valueStyle}>{client.postingSchedule || 'Not set'}</div>
              </div>

              {client.notes && (
                <div style={kgSectionStyle}>
                  <div style={labelStyle}>Notes</div>
                  <div style={{
                    ...valueStyle, background: colors.bg, padding: 12,
                    borderRadius: radius.sm, whiteSpace: 'pre-wrap',
                  }}>
                    {client.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Knowledge Tab ── */}
          {tab === 'knowledge' && (
            <div>
              {kg ? (
                <>
                  <KgField label="Target Demographics" value={kg.targetDemographics} />
                  <KgField label="Ideal Customer Profile" value={kg.idealCustomerProfile} />

                  <KgTags label="Competitors" tags={kg.competitors} />

                  <KgField label="Brand Voice" value={kg.brandVoice} />
                  <KgField label="Tone Preferences" value={kg.tonePreferences} />

                  <KgTags label="Tech Stack" tags={kg.techStack} />

                  <KgField label="Pain Points" value={kg.painPoints} />
                  <KgField label="Unique Selling Points" value={kg.uniqueSellingPoints} />
                  <KgField label="Content Goals" value={kg.contentGoals} />
                  <KgField label="Lead Source" value={kg.leadSource} />

                  {/* Key Contacts Table */}
                  {kg.keyContacts && kg.keyContacts.length > 0 && (
                    <div style={kgSectionStyle}>
                      <div style={labelStyle}>Key Contacts</div>
                      <div style={{
                        background: colors.bg, borderRadius: radius.md,
                        border: `1px solid ${colors.border}`, overflow: 'hidden',
                      }}>
                        {/* Header */}
                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr',
                          gap: 0, padding: '8px 12px',
                          borderBottom: `1px solid ${colors.border}`,
                          background: colors.surfaceHover,
                        }}>
                          {['Name', 'Role', 'Email', 'Phone'].map((h) => (
                            <div key={h} style={{
                              fontSize: 10, fontWeight: 700, color: colors.textMuted,
                              textTransform: 'uppercase', letterSpacing: 0.8,
                            }}>
                              {h}
                            </div>
                          ))}
                        </div>
                        {/* Rows */}
                        {kg.keyContacts.map((c, i) => (
                          <div key={i} style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr',
                            gap: 0, padding: '8px 12px',
                            borderBottom: i < kg.keyContacts.length - 1 ? `1px solid ${colors.border}` : 'none',
                          }}>
                            <div style={{ fontSize: 12, color: colors.textPrimary, fontWeight: 600 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: colors.textSecondary }}>{c.role}</div>
                            <div style={{ fontSize: 12, color: colors.info, wordBreak: 'break-all' }}>{c.email}</div>
                            <div style={{ fontSize: 12, color: colors.textSecondary }}>{c.phone}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <KgField label="Industry Notes" value={kg.industryNotes} />

                  {/* Show empty state if everything is blank */}
                  {!kg.targetDemographics && !kg.idealCustomerProfile && !kg.brandVoice
                    && !kg.tonePreferences && !kg.painPoints && !kg.uniqueSellingPoints
                    && !kg.contentGoals && !kg.leadSource && !kg.industryNotes
                    && (!kg.competitors || kg.competitors.length === 0)
                    && (!kg.techStack || kg.techStack.length === 0)
                    && (!kg.keyContacts || kg.keyContacts.length === 0) && (
                    <div style={{
                      textAlign: 'center', color: colors.textMuted, padding: 32, fontSize: 13,
                    }}>
                      No knowledge graph data yet. Edit the client to add details.
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  textAlign: 'center', color: colors.textMuted, padding: 32, fontSize: 13,
                }}>
                  No knowledge graph data available. Edit the client to add it.
                </div>
              )}
            </div>
          )}

          {/* ── Content Tab ── */}
          {tab === 'content' && (
            <div>
              {posts.length === 0 ? (
                <div style={{
                  textAlign: 'center', color: colors.textMuted, padding: 32, fontSize: 13,
                }}>
                  No posts for this client yet.
                </div>
              ) : (
                <div style={{
                  background: colors.bg, borderRadius: radius.md,
                  border: `1px solid ${colors.border}`, overflow: 'hidden',
                }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr',
                    gap: 0, padding: '10px 14px',
                    borderBottom: `1px solid ${colors.border}`,
                    background: colors.surfaceHover,
                  }}>
                    {['Title', 'Status', 'Pillar', 'Date', 'Impressions', 'Engagement'].map((h) => (
                      <div key={h} style={{
                        fontSize: 10, fontWeight: 700, color: colors.textMuted,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                      }}>
                        {h}
                      </div>
                    ))}
                  </div>
                  {/* Table Rows */}
                  {[...posts]
                    .sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || ''))
                    .map((p, i) => (
                      <div key={p.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr',
                        gap: 0, padding: '10px 14px', alignItems: 'center',
                        borderBottom: i < posts.length - 1 ? `1px solid ${colors.border}` : 'none',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          fontSize: 13, color: colors.textPrimary, fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {p.title || 'Untitled'}
                        </div>
                        <div><StatusBadge status={p.status} /></div>
                        <div>
                          {p.pillar ? <Badge color={colors.accent}>{p.pillar}</Badge> : (
                            <span style={{ fontSize: 12, color: colors.textMuted }}>--</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: colors.textSecondary }}>
                          {p.scheduledDate ? formatDate(p.scheduledDate) : '--'}
                        </div>
                        <div style={{ fontSize: 12, color: colors.textPrimary, fontWeight: 600 }}>
                          {p.status === 'published' ? formatNumber(p.impressions) : '--'}
                        </div>
                        <div style={{ fontSize: 12, color: colors.textPrimary }}>
                          {p.status === 'published'
                            ? formatPercent((p.reactions + p.comments) / Math.max(p.impressions, 1))
                            : '--'
                          }
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {tab === 'analytics' && (
            <div>
              {chartData.length < 2 ? (
                <div style={{
                  textAlign: 'center', color: colors.textMuted, padding: 32, fontSize: 13,
                }}>
                  Need at least 2 published posts to display charts.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 28 }}>
                    <h4 style={{
                      fontSize: 13, fontWeight: 700, color: colors.textSecondary,
                      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
                    }}>
                      Impressions Over Time
                    </h4>
                    <div style={{
                      height: 220, background: colors.bg, borderRadius: radius.md,
                      border: `1px solid ${colors.border}`, padding: '16px 8px 8px 0',
                    }}>
                      <ResponsiveContainer>
                        <LineChart data={chartData}>
                          <XAxis dataKey="date" stroke={colors.textMuted} fontSize={11} tickLine={false} />
                          <YAxis stroke={colors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: colors.surface, border: `1px solid ${colors.border}`,
                              borderRadius: radius.md, color: colors.textPrimary, fontSize: 12,
                            }}
                          />
                          <Line
                            type="monotone" dataKey="impressions" stroke={colors.accent}
                            strokeWidth={2} dot={{ fill: colors.accent, r: 4 }}
                            activeDot={{ r: 6, fill: colors.accent }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h4 style={{
                      fontSize: 13, fontWeight: 700, color: colors.textSecondary,
                      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
                    }}>
                      Engagement Per Post
                    </h4>
                    <div style={{
                      height: 220, background: colors.bg, borderRadius: radius.md,
                      border: `1px solid ${colors.border}`, padding: '16px 8px 8px 0',
                    }}>
                      <ResponsiveContainer>
                        <BarChart data={chartData}>
                          <XAxis dataKey="date" stroke={colors.textMuted} fontSize={11} tickLine={false} />
                          <YAxis stroke={colors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: colors.surface, border: `1px solid ${colors.border}`,
                              borderRadius: radius.md, color: colors.textPrimary, fontSize: 12,
                            }}
                          />
                          <Bar dataKey="engagement" fill={colors.info} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Activity Tab ── */}
          {tab === 'activity' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(!showAddActivity)}>
                  <PlusIcon size={12} /> Log Activity
                </Btn>
              </div>

              {showAddActivity && (
                <div style={{
                  background: colors.bg, padding: 16, borderRadius: radius.md,
                  marginBottom: 16, border: `1px solid ${colors.border}`,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="Type">
                      <Select value={actType} onChange={(e) => setActType(e.target.value as Activity['type'])}>
                        <option value="meeting">Meeting</option>
                        <option value="feedback">Feedback</option>
                        <option value="scope_change">Scope Change</option>
                        <option value="note">Note</option>
                      </Select>
                    </Field>
                    <Field label="Date">
                      <Input type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Notes">
                    <TextArea
                      value={actNotes}
                      onChange={(e) => setActNotes(e.target.value)}
                      style={{ minHeight: 60 }}
                      placeholder="Describe the activity..."
                    />
                  </Field>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(false)}>Cancel</Btn>
                    <Btn size="sm" onClick={addActivity}>Add Activity</Btn>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...clientActivities].reverse().map((a) => (
                  <div key={a.id} style={{
                    padding: '10px 14px', background: colors.bg, borderRadius: radius.md,
                    border: `1px solid ${colors.border}`, fontSize: 13,
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: a.notes ? 6 : 0,
                    }}>
                      <StatusBadge status={a.type} />
                      <span style={{ color: colors.textMuted, fontSize: 11 }}>{formatDate(a.date)}</span>
                    </div>
                    {a.notes && (
                      <div style={{ color: colors.textPrimary, marginTop: 4, lineHeight: 1.5 }}>
                        {a.notes}
                      </div>
                    )}
                  </div>
                ))}
                {clientActivities.length === 0 && (
                  <div style={{
                    textAlign: 'center', color: colors.textMuted, fontSize: 13, padding: 32,
                  }}>
                    No activity logged yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 16, background: colors.bg,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: colors.error, fontWeight: 600 }}>
              Delete this client and all their data?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
              <Btn variant="danger" size="sm" onClick={onDelete}>Delete</Btn>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
