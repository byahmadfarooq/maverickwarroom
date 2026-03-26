import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { AppCtx } from '../../hooks/AppContext';
import type { Task, TimeEntry } from '../../types';
import { colors, radius } from '../../utils/theme';
import {
  Btn, Card, SectionHeader, SearchBar, Field, Input, TextArea,
  Select, EmptyState, StatusBadge, TabBar,
} from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, CalendarIcon } from '../shared/Icons';
import { genId, now, today, formatDate, formatHours } from '../../utils/helpers';

type Category = Task['category'];
type Status = Task['status'];
type Priority = Task['priority'];

const STATUSES: Status[] = ['todo', 'in_progress', 'done'];

const COLUMN_META: Record<Status, { label: string; color: string }> = {
  todo:        { label: 'To Do',       color: colors.textSecondary },
  in_progress: { label: 'In Progress', color: colors.info },
  done:        { label: 'Done',        color: colors.success },
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low:    colors.textSecondary,
  medium: colors.warning,
  high:   colors.accent,
  urgent: colors.error,
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
];

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'client',   label: 'Client' },
];

function totalHours(task: Task): number {
  return task.timeEntries.reduce((sum, e) => sum + e.hours, 0);
}

function elapsedSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 1000;
}

function fmtHMS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return task.dueDate < today();
}

function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(new Date().setDate(diff));
  return mon.toISOString().slice(0, 10);
}

function blankTask(category: Category): Task {
  return {
    id: genId(),
    title: '',
    description: '',
    category,
    clientId: null,
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    timeEntries: [],
    timerRunning: false,
    timerStartedAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
}

function useLiveTimers(tasks: Task[]): Record<string, number> {
  const [elapsed, setElapsed] = useState<Record<string, number>>({});

  useEffect(() => {
    const running = tasks.filter((t) => t.timerRunning && t.timerStartedAt);
    if (running.length === 0) {
      setElapsed({});
      return undefined;
    }
    const tick = () => {
      const next: Record<string, number> = {};
      for (const t of running) {
        next[t.id] = elapsedSince(t.timerStartedAt as string);
      }
      setElapsed(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tasks]);

  return elapsed;
}

export function TaskManager(): React.ReactElement {
  const { tasks, setTasks, updateTask, deleteTask, clients, toast } = useContext(AppCtx);

  const [tab, setTab]                   = useState<Category>('personal');
  const [search, setSearch]             = useState('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [prioFilter, setPrioFilter]     = useState<string>('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTask, setEditTask]         = useState<Task | null>(null);
  const [meHours, setMeHours]           = useState('');
  const [meDate, setMeDate]             = useState(today());
  const [meNotes, setMeNotes]           = useState('');

  const dragIdRef = useRef<string | null>(null);
  const elapsed = useLiveTimers(tasks);

  const filtered = tasks.filter((t) => {
    if (t.category !== tab) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (clientFilter && t.clientId !== clientFilter) return false;
    if (prioFilter && t.priority !== prioFilter) return false;
    return true;
  });

  const byStatus = (s: Status): Task[] => filtered.filter((t) => t.status === s);

  const totalCount     = filtered.length;
  const completedToday = filtered.filter((t) => t.status === 'done' && t.updatedAt.slice(0, 10) === today()).length;
  const overdueCount   = filtered.filter(isOverdue).length;
  const weekStart      = startOfWeek();
  const hoursThisWeek  = filtered.reduce((sum, t) => sum + t.timeEntries.filter((e) => e.date >= weekStart).reduce((s, e) => s + e.hours, 0), 0);

  const clientName = useCallback((id: string | null): string => {
    if (!id) return '';
    const c = clients.find((cl) => cl.id === id);
    return c ? c.name : '';
  }, [clients]);

  const openCreate = useCallback(() => {
    setEditTask(blankTask(tab));
    setMeHours(''); setMeDate(today()); setMeNotes('');
    setModalOpen(true);
  }, [tab]);

  const openEdit = useCallback((t: Task) => {
    setEditTask({ ...t, timeEntries: [...t.timeEntries] });
    setMeHours(''); setMeDate(today()); setMeNotes('');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => { setModalOpen(false); setEditTask(null); }, []);

  const saveTask = useCallback(() => {
    if (!editTask) return;
    if (!editTask.title.trim()) { toast('Title is required', 'error'); return; }
    const existing = tasks.find((t) => t.id === editTask.id);
    if (existing) {
      updateTask(editTask.id, { ...editTask, updatedAt: now() });
    } else {
      setTasks((prev: Task[]) => [...prev, { ...editTask, updatedAt: now() }]);
    }
    toast(existing ? 'Task updated' : 'Task created', 'success');
    closeModal();
  }, [editTask, tasks, updateTask, setTasks, toast, closeModal]);

  const handleDelete = useCallback((id: string) => {
    deleteTask(id);
    toast('Task deleted', 'success');
  }, [deleteTask, toast]);

  const toggleTimer = useCallback((task: Task) => {
    if (task.timerRunning && task.timerStartedAt) {
      const secs = elapsedSince(task.timerStartedAt);
      const hours = parseFloat((secs / 3600).toFixed(4));
      const entry: TimeEntry = { id: genId(), date: today(), hours, isManual: false, notes: '' };
      updateTask(task.id, {
        timerRunning: false, timerStartedAt: null,
        timeEntries: [...task.timeEntries, entry], updatedAt: now(),
      });
      toast(`Tracked ${formatHours(hours)}`, 'success');
    } else {
      updateTask(task.id, { timerRunning: true, timerStartedAt: new Date().toISOString(), updatedAt: now() });
    }
  }, [updateTask, toast]);

  const addManualEntry = useCallback(() => {
    if (!editTask) return;
    const h = parseFloat(meHours);
    if (Number.isNaN(h) || h <= 0) { toast('Enter valid hours', 'error'); return; }
    const entry: TimeEntry = { id: genId(), date: meDate || today(), hours: h, isManual: true, notes: meNotes };
    setEditTask({ ...editTask, timeEntries: [...editTask.timeEntries, entry] });
    setMeHours(''); setMeNotes('');
  }, [editTask, meHours, meDate, meNotes, toast]);

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault();
    const id = dragIdRef.current;
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) {
      updateTask(task.id, { status, updatedAt: now() });
      toast(`Moved to ${COLUMN_META[status].label}`, 'success');
    }
    dragIdRef.current = null;
  }, [tasks, updateTask, toast]);

  const setField = useCallback(<K extends keyof Task>(key: K, value: Task[K]) => {
    if (!editTask) return;
    setEditTask({ ...editTask, [key]: value });
  }, [editTask]);

  const isExistingTask = editTask ? !!tasks.find((t) => t.id === editTask.id) : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Task Manager"
        subtitle="Personal and client task tracking with time logging"
        actions={
          <Btn onClick={openCreate}><PlusIcon size={16} /> New Task</Btn>
        }
      />

      <TabBar
        tabs={[
          { key: 'personal', label: 'Personal' },
          { key: 'client',   label: 'Client Tasks' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as Category)}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Tasks',     value: totalCount,                   color: colors.textPrimary },
          { label: 'Completed Today', value: completedToday,               color: colors.success },
          { label: 'Overdue',         value: overdueCount,                 color: overdueCount > 0 ? colors.error : colors.textPrimary },
          { label: 'Hours This Week', value: `${hoursThisWeek.toFixed(1)}h`, color: colors.info },
        ].map((s) => (
          <Card key={s.label} style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search tasks..." />
        </div>
        {tab === 'client' && (
          <Select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All Clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <Select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)} style={{ minWidth: 140 }}>
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {STATUSES.map((status) => {
          const col   = COLUMN_META[status];
          const items = byStatus(status);
          return (
            <div
              key={status}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, status)}
              style={{
                flex: '1 1 0', minWidth: 260,
                background: colors.surfaceAlt,
                borderRadius: radius.lg, padding: 12,
                display: 'flex', flexDirection: 'column', gap: 10,
                border: `1px solid ${colors.border}`,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: col.color, fontSize: 13 }}>{col.label}</span>
                <span style={{
                  background: col.color + '20', color: col.color,
                  borderRadius: radius.full, fontSize: 11, fontWeight: 700,
                  padding: '2px 8px', minWidth: 24, textAlign: 'center',
                }}>{items.length}</span>
              </div>

              {items.length === 0 && (
                <div style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: 20 }}>
                  Drop tasks here
                </div>
              )}

              {items.map((task) => {
                const overdue    = isOverdue(task);
                const tracked    = totalHours(task);
                const running    = task.timerRunning && task.timerStartedAt;
                const elapsedSec = running ? (elapsed[task.id] ?? 0) : 0;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}`,
                      borderRadius: radius.md,
                      padding: 12, cursor: 'grab',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    {/* Title row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, flex: 1, lineHeight: 1.4 }}>{task.title}</span>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0, marginLeft: 8 }}>
                        <button onClick={() => openEdit(task)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, padding: 3 }}>
                          <EditIcon size={14} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.error, padding: 3 }}>
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Priority */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: PRIORITY_COLOR[task.priority] + '20',
                        color: PRIORITY_COLOR[task.priority],
                        borderRadius: radius.full, fontSize: 10, fontWeight: 700,
                        padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>{task.priority}</span>
                      {task.category === 'client' && task.clientId && (
                        <span style={{ fontSize: 11, color: colors.textSecondary }}>{clientName(task.clientId)}</span>
                      )}
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: overdue ? colors.error : colors.textSecondary }}>
                        <CalendarIcon size={12} />
                        <span style={{ fontWeight: overdue ? 700 : 400 }}>
                          {formatDate(task.dueDate)}{overdue ? ' · Overdue' : ''}
                        </span>
                      </div>
                    )}

                    {/* Time + timer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: colors.textSecondary }}>{formatHours(tracked)} tracked</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTimer(task); }}
                        title={running ? 'Stop timer' : 'Start timer'}
                        style={{
                          background: running ? colors.error : colors.success,
                          color: '#fff', border: 'none',
                          borderRadius: radius.sm, padding: '2px 8px',
                          cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        }}
                      >
                        {running ? '■ Stop' : '▶ Start'}
                      </button>
                    </div>

                    {/* Live timer */}
                    {running && (
                      <div style={{
                        textAlign: 'center', fontFamily: 'monospace',
                        fontSize: 15, fontWeight: 700, color: colors.info,
                        background: colors.surfaceAlt, borderRadius: radius.sm, padding: '4px 0',
                      }}>
                        {fmtHMS(elapsedSec)}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add task button */}
              <button
                onClick={openCreate}
                style={{
                  background: 'none', border: `1px dashed ${colors.border}`,
                  borderRadius: radius.md, padding: 8, cursor: 'pointer',
                  color: colors.textMuted, fontSize: 12, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  marginTop: 4,
                }}
              >
                <PlusIcon size={14} /> Add task
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <EmptyState
          message="No tasks yet. Create your first task to get started."
          action="New Task"
          onAction={openCreate}
        />
      )}

      {/* Modal */}
      {modalOpen && editTask && (
        <Modal open={modalOpen} onClose={closeModal} title={isExistingTask ? 'Edit Task' : 'New Task'} width={560}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Title">
              <Input
                value={editTask.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Task title"
              />
            </Field>

            <Field label="Description">
              <TextArea
                value={editTask.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Details..."
                rows={3}
              />
            </Field>

            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="Category" style={{ flex: 1 }}>
                <Select
                  value={editTask.category}
                  onChange={(e) => {
                    const cat = e.target.value as Category;
                    setEditTask({ ...editTask, category: cat, clientId: cat === 'personal' ? null : editTask.clientId });
                  }}
                >
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </Field>
              {editTask.category === 'client' && (
                <Field label="Client" style={{ flex: 1 }}>
                  <Select value={editTask.clientId ?? ''} onChange={(e) => setField('clientId', e.target.value || null)}>
                    <option value="">Select client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="Priority" style={{ flex: 1 }}>
                <Select value={editTask.priority} onChange={(e) => setField('priority', e.target.value as Priority)}>
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </Field>
              <Field label="Status" style={{ flex: 1 }}>
                <Select value={editTask.status} onChange={(e) => setField('status', e.target.value as Status)}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </Field>
              <Field label="Due Date" style={{ flex: 1 }}>
                <Input type="date" value={editTask.dueDate} onChange={(e) => setField('dueDate', e.target.value)} />
              </Field>
            </div>

            {/* Manual Time Entry */}
            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Manual Time Entry</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Hours" style={{ flex: '0 0 80px', marginBottom: 0 }}>
                  <Input type="number" step="0.25" min="0" value={meHours} onChange={(e) => setMeHours(e.target.value)} placeholder="0.0" />
                </Field>
                <Field label="Date" style={{ flex: '0 0 140px', marginBottom: 0 }}>
                  <Input type="date" value={meDate} onChange={(e) => setMeDate(e.target.value)} />
                </Field>
                <Field label="Notes" style={{ flex: 1, marginBottom: 0 }}>
                  <Input value={meNotes} onChange={(e) => setMeNotes(e.target.value)} placeholder="Notes..." />
                </Field>
                <Btn onClick={addManualEntry} style={{ marginBottom: 14 }}><PlusIcon size={14} /> Add</Btn>
              </div>

              {editTask.timeEntries.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>
                    {editTask.timeEntries.length} entries · Total: {formatHours(totalHours(editTask))}
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {editTask.timeEntries.map((entry) => (
                      <div key={entry.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 12, padding: '5px 10px',
                        background: colors.surfaceAlt, borderRadius: radius.sm,
                      }}>
                        <span style={{ color: colors.textSecondary }}>
                          {formatDate(entry.date)} — {formatHours(entry.hours)}
                          {entry.isManual ? ' (manual)' : ' (timer)'}
                          {entry.notes ? ` · ${entry.notes}` : ''}
                        </span>
                        <button
                          onClick={() => setEditTask({ ...editTask, timeEntries: editTask.timeEntries.filter((e) => e.id !== entry.id) })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.error, padding: 2 }}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
              <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
              {isExistingTask && (
                <Btn variant="danger" onClick={() => { handleDelete(editTask.id); closeModal(); }}>
                  <TrashIcon size={14} /> Delete
                </Btn>
              )}
              <Btn onClick={saveTask}><CheckIcon size={14} /> Save Task</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TaskManager;
