import React, { useState, useContext, useMemo } from 'react';
import { colors, radius } from '../../utils/theme';
import { AppCtx } from '../../hooks/AppContext';
import { genId, now, today, formatDate, formatDateShort, statusLabel, dateStr } from '../../utils/helpers';
import { Btn, Card, Badge, SectionHeader, SearchBar, Field, Input, TextArea, Select, EmptyState, StatusBadge, TabBar } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon, FileTextIcon } from '../shared/Icons';
import type { Post, PostStatus, PostTemplate } from '../../types';

/* ── Constants ── */

const STATUSES: PostStatus[] = ['idea', 'drafting', 'review', 'ready', 'scheduled', 'published'];

const STATUS_COLOR: Record<PostStatus, string> = {
  idea: colors.textMuted,
  drafting: colors.warning,
  review: colors.purple,
  ready: colors.info,
  scheduled: colors.accent,
  published: colors.success,
};

const STATUS_MUTED: Record<PostStatus, string> = {
  idea: colors.textMuted + '18',
  drafting: colors.warningMuted,
  review: colors.purpleMuted,
  ready: colors.infoMuted,
  scheduled: colors.accentMuted,
  published: colors.successMuted,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Helpers ── */

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
  // pad end to fill last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function monthYearLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ── Empty Post Factory ── */

function emptyPost(overrides?: Partial<Post>): Post {
  return {
    id: genId(),
    clientId: 'personal',
    title: '',
    content: '',
    pillar: '',
    status: 'idea',
    scheduledDate: today(),
    publishedDate: null,
    impressions: 0,
    reactions: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    profileViews: 0,
    linkClicks: 0,
    dmsFromPost: 0,
    leadsFromPost: 0,
    postUrl: '',
    notes: '',
    imageUrl: '',
    trackingLog: [],
    commentLog: [],
    dmLog: [],
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

/* ── Main Component ── */

export const ContentCalendar: React.FC = () => {
  const { posts, setPosts, updatePost, deletePost, clients, settings, toast, templates, setTemplates } = useContext(AppCtx);

  // View state
  const [activeTab, setActiveTab] = useState<string>('kanban');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Calendar state
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Kanban drag state
  const [dragPostId, setDragPostId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PostStatus | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<{ name: string; pillar: string; content: string; notes: string }>({ name: '', pillar: '', content: '', notes: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Post>(() => emptyPost());

  const todayStr = today();

  /* ── Filtering ── */

  const filtered = useMemo(() => {
    let list = posts;
    if (clientFilter !== 'all') {
      list = list.filter((p) => p.clientId === clientFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.pillar.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, clientFilter, search]);

  /* ── Client name helper ── */

  const clientName = (clientId: string): string => {
    if (clientId === 'personal') return 'Personal';
    const c = clients.find((cl) => cl.id === clientId);
    return c ? c.name : 'Unknown';
  };

  /* ── Modal open/close ── */

  const openCreate = (overrides?: Partial<Post>) => {
    const p = emptyPost(overrides);
    setEditingPost(null);
    setForm(p);
    setModalOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setForm({ ...post });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPost(null);
  };

  const setField = (key: keyof Post, value: string | number | null) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast('Title is required', 'error');
      return;
    }
    const updated: Post = {
      ...form,
      title: form.title.trim(),
      publishedDate: form.status === 'published' ? (form.publishedDate || form.scheduledDate || today()) : form.publishedDate,
      updatedAt: now(),
    };
    if (editingPost) {
      updatePost(editingPost.id, updated);
      toast('Post updated');
    } else {
      setPosts((prev) => [...prev, updated]);
      toast('Post created');
    }
    closeModal();
  };

  const handleDelete = () => {
    if (editingPost) {
      deletePost(editingPost.id);
      toast('Post deleted');
      closeModal();
    }
  };

  /* ── Kanban drag-and-drop ── */

  const onDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', postId);
    setDragPostId(postId);
  };

  const onDragOver = (e: React.DragEvent, status: PostStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = (e: React.DragEvent, status: PostStatus) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('text/plain') || dragPostId;
    if (postId) {
      updatePost(postId, { status });
      toast(`Moved to ${statusLabel(status)}`);
    }
    setDragPostId(null);
    setDragOverCol(null);
  };

  /* ── Calendar navigation ── */

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const n = new Date();
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth());
  };

  /* ── Calendar data ── */

  const calendarGrid = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth]);

  const postsForDay = (ds: string): Post[] => filtered.filter((p) => p.scheduledDate === ds || p.publishedDate === ds);

  /* ── Template helpers ── */

  const saveAsTemplate = () => {
    const t: PostTemplate = {
      id: genId(), name: form.title || 'Untitled Template',
      pillar: form.pillar, content: form.content, notes: form.notes,
      createdAt: now(),
    };
    setTemplates((prev) => [...prev, t]);
    toast('Saved as template');
  };

  const useTemplate = (t: PostTemplate) => {
    openCreate({ pillar: t.pillar, content: t.content, notes: t.notes, title: '' });
  };

  const openEditTemplate = (t: PostTemplate) => {
    setTemplateForm({ name: t.name, pillar: t.pillar, content: t.content, notes: t.notes });
    setEditingTemplateId(t.id);
    setTemplateModalOpen(true);
  };

  const openNewTemplate = () => {
    setTemplateForm({ name: '', pillar: '', content: '', notes: '' });
    setEditingTemplateId(null);
    setTemplateModalOpen(true);
  };

  const saveTemplate = () => {
    if (!templateForm.name.trim()) return;
    if (editingTemplateId) {
      setTemplates((prev) => prev.map((t) => t.id === editingTemplateId ? { ...t, ...templateForm } : t));
      toast('Template updated');
    } else {
      const t: PostTemplate = { id: genId(), ...templateForm, createdAt: now() };
      setTemplates((prev) => [...prev, t]);
      toast('Template created');
    }
    setTemplateModalOpen(false);
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast('Template deleted');
  };

  /* ── Pillar list from selected client ── */

  const currentPillars = useMemo(() => {
    if (form.clientId === 'personal') return [];
    const c = clients.find((cl) => cl.id === form.clientId);
    return c?.pillars || [];
  }, [form.clientId, clients]);

  /* ── Render ── */

  return (
    <div>
      <SectionHeader
        title="Content Pipeline"
        subtitle={`${posts.length} total posts`}
        actions={
          <Btn onClick={() => openCreate()}>
            <PlusIcon size={14} /> New Post
          </Btn>
        }
      />

      {/* Tab bar + filters row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 4, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <TabBar
            tabs={[
              { key: 'kanban', label: 'Kanban' },
              { key: 'calendar', label: 'Calendar' },
              { key: 'templates', label: `Templates (${templates.length})` },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="all">All Clients</option>
          <option value="personal">Personal</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <SearchBar value={search} onChange={setSearch} placeholder="Search posts..." />
      </div>

      {/* Pillar Balance */}
      {(() => {
        const allPillars: Record<string, number> = {};
        filtered.forEach((p) => {
          if (p.pillar) allPillars[p.pillar] = (allPillars[p.pillar] || 0) + 1;
        });
        const entries = Object.entries(allPillars).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return null;
        const max = entries[0][1];
        const PILLAR_COLORS = ['#FF6B2B', '#3B82F6', '#A855F7', '#22C55E', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444'];
        return (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              Pillar Distribution ({filtered.length} posts{clientFilter !== 'all' ? '' : ''})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map(([pillar, count], i) => (
                <div key={pillar} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 100, fontSize: 12, color: colors.textSecondary, textAlign: 'right', flexShrink: 0 }}>
                    {pillar}
                  </div>
                  <div style={{ flex: 1, height: 8, background: colors.bg, borderRadius: radius.full, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: radius.full, transition: 'width 0.5s',
                      background: PILLAR_COLORS[i % PILLAR_COLORS.length],
                      width: `${(count / max) * 100}%`,
                    }} />
                  </div>
                  <div style={{ width: 28, fontSize: 12, fontWeight: 700, color: colors.textPrimary, textAlign: 'right', flexShrink: 0 }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════ KANBAN VIEW ═══════════════════════════ */}
      {activeTab === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${STATUSES.length}, minmax(180px, 1fr))`,
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 8,
          }}
        >
          {STATUSES.map((status) => {
            const colPosts = filtered.filter((p) => p.status === status);
            const colColor = STATUS_COLOR[status];
            const isOver = dragOverCol === status;

            return (
              <div
                key={status}
                onDragOver={(e) => onDragOver(e, status)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, status)}
                style={{
                  background: isOver ? colColor + '0A' : colors.bg,
                  border: `1px solid ${isOver ? colColor + '40' : colors.border}`,
                  borderRadius: radius.lg,
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: `2px solid ${colColor}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: colColor,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                      }}
                    >
                      {statusLabel(status)}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: radius.full,
                        background: colColor + '20',
                        color: colColor,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {colPosts.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreate({ status })}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colColor,
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: radius.sm,
                    }}
                    title={`Add ${statusLabel(status)}`}
                  >
                    <PlusIcon size={16} />
                  </button>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                  {colPosts.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '24px 8px',
                        color: colors.textMuted,
                        fontSize: 12,
                        border: `1px dashed ${colors.border}`,
                        borderRadius: radius.md,
                      }}
                    >
                      No posts
                    </div>
                  )}
                  {colPosts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, post.id)}
                      onClick={() => openEdit(post)}
                      style={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        padding: '10px 12px',
                        cursor: 'grab',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        borderLeft: `3px solid ${colColor}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.borderHover;
                        e.currentTarget.style.boxShadow = colors.shadow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.borderLeftColor = colColor;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: colors.textPrimary,
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {post.title || 'Untitled'}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
                        {clientName(post.clientId)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {post.pillar && <Badge color={colColor}>{post.pillar}</Badge>}
                        {post.scheduledDate && (
                          <span style={{ fontSize: 10, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CalendarIcon size={10} />
                            {formatDateShort(post.scheduledDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════ CALENDAR VIEW ═══════════════════════════ */}
      {activeTab === 'calendar' && (
        <div>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <Btn variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeftIcon size={18} />
            </Btn>
            <Btn variant="secondary" size="sm" onClick={goToday}>Today</Btn>
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, minWidth: 180, textAlign: 'center' }}>
              {monthYearLabel(calYear, calMonth)}
            </span>
            <Btn variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRightIcon size={18} />
            </Btn>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.textSecondary,
                  padding: '6px 0',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {calendarGrid.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} style={{ minHeight: 90 }} />;
              const ds = dateStr(date);
              const dayPosts = postsForDay(ds);
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDay;

              return (
                <div
                  key={ds}
                  onClick={() => setSelectedDay(isSelected ? null : ds)}
                  style={{
                    background: isSelected ? colors.surfaceHover : colors.surface,
                    border: `1px solid ${isToday ? colors.accent : isSelected ? colors.borderHover : colors.border}`,
                    borderRadius: radius.md,
                    minHeight: 90,
                    padding: 6,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = colors.surface;
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isToday ? colors.accent : colors.textPrimary,
                      marginBottom: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{date.getDate()}</span>
                    {isToday && (
                      <span style={{ fontSize: 9, color: colors.accent, fontWeight: 700, textTransform: 'uppercase' }}>Today</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayPosts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(p);
                        }}
                        style={{
                          padding: '2px 6px',
                          borderRadius: radius.sm,
                          fontSize: 10,
                          fontWeight: 600,
                          color: STATUS_COLOR[p.status],
                          background: STATUS_MUTED[p.status],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                      >
                        {p.title || 'Untitled'}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>
                        +{dayPosts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day detail panel */}
          {selectedDay && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                  {formatDate(selectedDay)}
                </h3>
                <Btn size="sm" onClick={() => openCreate({ scheduledDate: selectedDay })}>
                  <PlusIcon size={12} /> Add Post
                </Btn>
              </div>
              {postsForDay(selectedDay).length === 0 ? (
                <EmptyState
                  message="No posts on this day."
                  action="Create Post"
                  onAction={() => openCreate({ scheduledDate: selectedDay })}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {postsForDay(selectedDay).map((p) => (
                    <Card key={p.id} onClick={() => openEdit(p)} style={{ padding: 14, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
                            {p.title || 'Untitled'}
                          </div>
                          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>
                            {clientName(p.clientId)}
                            {p.pillar && <span style={{ color: colors.textMuted }}> / {p.pillar}</span>}
                          </div>
                          {p.content && (
                            <div
                              style={{
                                fontSize: 12,
                                color: colors.textMuted,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 400,
                              }}
                            >
                              {p.content}
                            </div>
                          )}
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════ TEMPLATES VIEW ═══════════════════════════ */}
      {activeTab === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              {templates.length === 0 ? 'No templates yet. Save a post as a template to reuse it.' : `${templates.length} template${templates.length === 1 ? '' : 's'}`}
            </div>
            <Btn onClick={openNewTemplate}><PlusIcon size={13} /> New Template</Btn>
          </div>
          {templates.length === 0 ? (
            <EmptyState
              message="No templates yet."
              action="Create Template"
              onAction={openNewTemplate}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {templates.map((t) => (
                <div key={t.id} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{t.name}</div>
                      {t.pillar && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{t.pillar}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Btn variant="ghost" size="sm" onClick={() => openEditTemplate(t)}><EditIcon size={12} /></Btn>
                      <Btn variant="ghost" size="sm" onClick={() => deleteTemplate(t.id)}><TrashIcon size={12} /></Btn>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5, minHeight: 48, maxHeight: 72, overflow: 'hidden' }}>
                      {t.content || <span style={{ fontStyle: 'italic', color: colors.textMuted }}>No content</span>}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <Btn size="sm" onClick={() => useTemplate(t)} style={{ width: '100%', justifyContent: 'center' }}>
                        <FileTextIcon size={12} /> Use Template
                      </Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════ TEMPLATE MODAL ═══════════════════════════ */}
      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title={editingTemplateId ? 'Edit Template' : 'New Template'} width={560}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Template Name" required>
              <Input value={templateForm.name} onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Thought Leadership Hook" />
            </Field>
            <Field label="Default Pillar">
              <Input value={templateForm.pillar} onChange={(e) => setTemplateForm((f) => ({ ...f, pillar: e.target.value }))} placeholder="e.g. Authority Building" />
            </Field>
          </div>
          <Field label="Content Template">
            <TextArea
              value={templateForm.content}
              onChange={(e) => setTemplateForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write template content... (you can edit it when using the template)"
              style={{ minHeight: 140 }}
            />
          </Field>
          <Field label="Notes">
            <TextArea
              value={templateForm.notes}
              onChange={(e) => setTemplateForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Usage tips or context..."
              style={{ minHeight: 60 }}
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setTemplateModalOpen(false)}>Cancel</Btn>
            <Btn onClick={saveTemplate} disabled={!templateForm.name.trim()}>
              {editingTemplateId ? 'Update' : 'Create'} Template
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════ POST MODAL ═══════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingPost ? 'Edit Post' : 'New Post'}
        width={620}
      >
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Post title"
              />
            </Field>
            <Field label="Client">
              <Select value={form.clientId} onChange={(e) => setField('clientId', e.target.value)}>
                <option value="personal">Personal</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Pillar">
              {currentPillars.length > 0 ? (
                <Select value={form.pillar} onChange={(e) => setField('pillar', e.target.value)}>
                  <option value="">None</option>
                  {currentPillars.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={form.pillar}
                  onChange={(e) => setField('pillar', e.target.value)}
                  placeholder="Content pillar"
                />
              )}
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField('status', e.target.value as PostStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Scheduled Date">
              <Input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setField('scheduledDate', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Content">
            <TextArea
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              placeholder="Write your post content..."
              style={{ minHeight: 120 }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Image URL">
              <Input
                value={form.imageUrl}
                onChange={(e) => setField('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Post URL">
              <Input
                value={form.postUrl}
                onChange={(e) => setField('postUrl', e.target.value)}
                placeholder="https://linkedin.com/..."
              />
            </Field>
          </div>

          <Field label="Notes">
            <TextArea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Internal notes..."
              style={{ minHeight: 60 }}
            />
          </Field>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {editingPost && (
                <Btn variant="danger" onClick={handleDelete}>
                  <TrashIcon size={14} /> Delete
                </Btn>
              )}
              <Btn variant="secondary" onClick={saveAsTemplate} title="Save content as a reusable template">
                <FileTextIcon size={13} /> Save as Template
              </Btn>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={!form.title.trim()}>
                {editingPost ? 'Update' : 'Create'} Post
              </Btn>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
