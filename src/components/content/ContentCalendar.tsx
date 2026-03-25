import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card, Btn, StatusBadge, EmptyState } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { PostForm } from './PostForm';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '../shared/Icons';
import { getWeekDates, dateStr, formatDateShort } from '../../utils/helpers';
import type { Post } from '../../types';

const statusColors: Record<string, string> = {
  idea: colors.textSecondary,
  drafting: colors.warning,
  ready: colors.info,
  scheduled: '#A855F7',
  published: colors.success,
};

// Assign a color per client for visual distinction
const clientColors = [colors.accent, colors.info, '#A855F7', colors.success, colors.warning, '#EC4899'];

export const ContentCalendar: React.FC = () => {
  const { posts, setPosts, updatePost, deletePost, clients, toast } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const weekDates = getWeekDates(weekOffset);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayStr = dateStr(new Date());

  const clientColorMap: Record<string, string> = {};
  clients.forEach((c, i) => { clientColorMap[c.id] = clientColors[i % clientColors.length]; });

  const handleSave = (post: Post) => {
    if (editingPost) {
      updatePost(post.id, post);
      toast('Post updated');
    } else {
      setPosts((prev) => [...prev, post]);
      toast('Post added');
    }
    setShowForm(false);
    setEditingPost(null);
  };

  const handleDrop = (date: string) => {
    if (dragId) {
      updatePost(dragId, { scheduledDate: date });
      toast('Post rescheduled');
      setDragId(null);
    }
  };

  const openNewPost = (date?: string) => {
    setEditingPost(null);
    setSelectedDate(date || todayStr);
    setShowForm(true);
  };

  // Month view data
  const getMonthDates = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + weekOffset);
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    const dates: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) dates.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) dates.push(new Date(year, month, d));
    return dates;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn variant="secondary" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}><ChevronLeftIcon size={14} /></Btn>
          <Btn variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>Today</Btn>
          <Btn variant="secondary" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}><ChevronRightIcon size={14} /></Btn>
          {view === 'week' && (
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginLeft: 8 }}>
              {formatDateShort(dateStr(weekDates[0]))} — {formatDateShort(dateStr(weekDates[6]))}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: colors.surface, borderRadius: 6, border: `1px solid ${colors.border}` }}>
            <button onClick={() => setView('week')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px 0 0 6px', background: view === 'week' ? colors.accent : 'transparent', color: view === 'week' ? '#fff' : colors.textSecondary, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Week</button>
            <button onClick={() => setView('month')} style={{ padding: '6px 12px', border: 'none', borderRadius: '0 6px 6px 0', background: view === 'month' ? colors.accent : 'transparent', color: view === 'month' ? '#fff' : colors.textSecondary, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Month</button>
          </div>
          <Btn onClick={() => openNewPost()}><PlusIcon size={14} /> New Post</Btn>
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDates.map((date, i) => {
            const ds = dateStr(date);
            const dayPosts = posts.filter((p) => p.scheduledDate === ds);
            const isToday = ds === todayStr;

            return (
              <div
                key={ds}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(ds)}
                style={{
                  background: colors.surface, border: `1px solid ${isToday ? colors.accent : colors.border}`,
                  borderRadius: 8, minHeight: 300, display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{
                  padding: '8px 10px', borderBottom: `1px solid ${colors.border}`, textAlign: 'center',
                  background: isToday ? colors.accent + '15' : 'transparent',
                }}>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>{dayNames[i]}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: isToday ? colors.accent : colors.textPrimary }}>{date.getDate()}</div>
                </div>
                <div style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayPosts.map((p) => {
                    const client = clients.find((c) => c.id === p.clientId);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => setDragId(p.id)}
                        onClick={() => { setEditingPost(p); setShowForm(true); }}
                        style={{
                          padding: '6px 8px', borderRadius: 4, cursor: 'grab', fontSize: 11,
                          borderLeft: `3px solid ${clientColorMap[p.clientId] || colors.accent}`,
                          background: statusColors[p.status] + '15',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || 'Untitled'}</div>
                        {client && <div style={{ color: clientColorMap[p.clientId], fontSize: 10 }}>{client.name}</div>}
                        <StatusBadge status={p.status} />
                      </div>
                    );
                  })}
                  <button onClick={() => openNewPost(ds)} style={{
                    border: `1px dashed ${colors.border}`, borderRadius: 4, background: 'transparent',
                    color: colors.textSecondary, cursor: 'pointer', padding: 4, fontSize: 11, marginTop: 'auto',
                  }}>+ Add</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {dayNames.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: colors.textSecondary, padding: 4 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {getMonthDates().map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const ds = dateStr(date);
              const dayPosts = posts.filter((p) => p.scheduledDate === ds);
              const isToday = ds === todayStr;
              return (
                <div key={ds} onClick={() => openNewPost(ds)} style={{
                  background: colors.surface, border: `1px solid ${isToday ? colors.accent : colors.border}`,
                  borderRadius: 6, minHeight: 60, padding: 4, cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? colors.accent : colors.textPrimary }}>{date.getDate()}</div>
                  {dayPosts.length > 0 && (
                    <div style={{ fontSize: 10, color: colors.accent, fontWeight: 600 }}>{dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Library */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Content Library</h3>
        {posts.length === 0 ? (
          <EmptyState message="No posts yet." action="Create Post" onAction={() => openNewPost()} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Client', 'Title', 'Pillar', 'Status', 'Date', 'Impressions', 'Eng.'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: colors.textSecondary, fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')).map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  return (
                    <tr key={p.id} onClick={() => { setEditingPost(p); setShowForm(true); }}
                      style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '8px 10px', color: clientColorMap[p.clientId] || colors.textPrimary }}>{client?.name || '-'}</td>
                      <td style={{ padding: '8px 10px', color: colors.textPrimary, fontWeight: 500 }}>{p.title || 'Untitled'}</td>
                      <td style={{ padding: '8px 10px' }}>{p.pillar && <span style={{ color: colors.accent }}>{p.pillar}</span>}</td>
                      <td style={{ padding: '8px 10px' }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: '8px 10px', color: colors.textSecondary }}>{formatDateShort(p.scheduledDate)}</td>
                      <td style={{ padding: '8px 10px', color: colors.textPrimary }}>{p.impressions > 0 ? p.impressions.toLocaleString() : '-'}</td>
                      <td style={{ padding: '8px 10px', color: colors.textPrimary }}>{p.reactions + p.comments > 0 ? p.reactions + p.comments : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingPost(null); }} title={editingPost ? 'Edit Post' : 'New Post'} width={600}>
        <PostForm
          post={editingPost}
          clients={clients}
          defaultDate={selectedDate || todayStr}
          onSave={handleSave}
          onDelete={editingPost ? () => { deletePost(editingPost.id); setShowForm(false); setEditingPost(null); toast('Post deleted'); } : undefined}
          onCancel={() => { setShowForm(false); setEditingPost(null); }}
        />
      </Modal>
    </div>
  );
};
