import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, StatCard, EmptyState, SearchBar } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { ProspectForm } from './ProspectForm';
import { ProspectDetail } from './ProspectDetail';
import { PlusIcon, SendIcon, TargetIcon, DollarIcon, TrendingUpIcon } from '../shared/Icons';
import {
  formatCurrency, formatDualCurrency, formatPercent, daysAgo, isOverdue,
  isLastNDays, isThisWeek, statusLabel, daysBetween,
} from '../../utils/helpers';
import type { Prospect, ProspectStatus } from '../../types';

const COLUMNS: { key: ProspectStatus; label: string; color: string }[] = [
  { key: 'research', label: 'Research', color: colors.textSecondary },
  { key: 'dm_sent', label: 'DM Sent', color: colors.info },
  { key: 'replied', label: 'Replied', color: colors.warning },
  { key: 'call_booked', label: 'Call Booked', color: colors.purple },
  { key: 'proposal_sent', label: 'Proposal Sent', color: colors.accent },
  { key: 'negotiating', label: 'Negotiating', color: colors.warning },
  { key: 'won', label: 'Won', color: colors.success },
  { key: 'lost', label: 'Lost', color: colors.error },
];

export const OutboundTracker: React.FC = () => {
  const { prospects, setProspects, updateProspect, deleteProspect, settings, toast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [detailProspect, setDetailProspect] = useState<Prospect | null>(null);
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    prospects.filter((p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase())
    ), [prospects, search]);

  // Metrics
  const metrics = useMemo(() => {
    const allActivities = prospects.flatMap((p) => p.activities);
    const weekActivities = allActivities.filter((a) => isThisWeek(a.date));
    const dmsSentWeek = weekActivities.filter((a) => a.type === 'dm_sent' || a.type === 'follow_up').length;
    const repliesWeek = weekActivities.filter((a) => a.type === 'they_replied').length;
    const replyRate = dmsSentWeek > 0 ? repliesWeek / dmsSentWeek : 0;
    const callsWeek = weekActivities.filter((a) => a.type === 'call_scheduled').length;
    const proposalsWeek = weekActivities.filter((a) => a.type === 'proposal_sent').length;
    const wonProspects = prospects.filter((p) => p.status === 'won');
    const won = wonProspects.length;
    const closed = prospects.filter((p) => p.status === 'won' || p.status === 'lost').length;
    const winRate = closed > 0 ? won / closed : 0;
    const avgDeal = won > 0
      ? wonProspects.reduce((s, p) => s + p.dealValue, 0) / won
      : 0;

    // Avg Time to Close
    const wonWithDates = wonProspects.filter((p) => p.firstContactDate && p.updatedAt);
    const avgTimeToClose = wonWithDates.length > 0
      ? Math.round(wonWithDates.reduce((s, p) => s + daysBetween(p.firstContactDate, p.updatedAt.split('T')[0]), 0) / wonWithDates.length)
      : 0;

    // Active Pipeline Value
    const activePipeline = prospects
      .filter((p) => p.status !== 'won' && p.status !== 'lost')
      .reduce((s, p) => s + p.dealValue, 0);

    // Conversion Rate
    const conversionRate = prospects.length > 0 ? won / prospects.length : 0;

    return {
      dmsSentWeek, replyRate, callsWeek, proposalsWeek, winRate,
      avgDeal, avgTimeToClose, activePipeline, conversionRate,
    };
  }, [prospects]);

  const handleDrop = (status: ProspectStatus) => {
    if (dragId) {
      updateProspect(dragId, { status });
      toast(`Moved to ${statusLabel(status)}`);
      setDragId(null);
    }
  };

  const handleSave = (prospect: Prospect) => {
    if (editingProspect) {
      updateProspect(prospect.id, prospect);
      toast('Prospect updated');
    } else {
      setProspects((prev) => [...prev, prospect]);
      toast('Prospect added');
    }
    setShowForm(false);
    setEditingProspect(null);
  };

  const rate = settings?.finance?.exchangeRate ?? 278;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Metrics Bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {([
          { label: 'DMs Sent This Week', value: metrics.dmsSentWeek, color: colors.info, icon: <SendIcon size={16} style={{ color: colors.info }} /> },
          { label: 'Reply Rate', value: formatPercent(metrics.replyRate), color: colors.warning, icon: <TrendingUpIcon size={16} style={{ color: colors.warning }} /> },
          { label: 'Calls Booked This Week', value: metrics.callsWeek, color: colors.purple, icon: <TargetIcon size={16} style={{ color: colors.purple }} /> },
          { label: 'Proposals This Week', value: metrics.proposalsWeek, color: colors.accent },
          { label: 'Win Rate', value: formatPercent(metrics.winRate), color: colors.success, icon: <TrendingUpIcon size={16} style={{ color: colors.success }} /> },
          { label: 'Avg Deal Value', value: formatCurrency(metrics.avgDeal), sub: metrics.avgDeal > 0 ? formatDualCurrency(metrics.avgDeal, rate) : undefined, color: colors.success, icon: <DollarIcon size={16} style={{ color: colors.success }} /> },
          { label: 'Avg Time To Close', value: metrics.avgTimeToClose > 0 ? `${metrics.avgTimeToClose}d` : '-', color: colors.info },
          { label: 'Active Pipeline', value: formatCurrency(metrics.activePipeline), sub: metrics.activePipeline > 0 ? formatDualCurrency(metrics.activePipeline, rate) : undefined, color: colors.accent, icon: <DollarIcon size={16} style={{ color: colors.accent }} /> },
          { label: 'Conversion Rate', value: formatPercent(metrics.conversionRate), color: colors.success },
        ] as { label: string; value: string | number; sub?: string; color: string; icon?: React.ReactNode }[]).map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} sub={m.sub} color={m.color} icon={m.icon} />
        ))}
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search prospects..." />
        <Btn onClick={() => { setEditingProspect(null); setShowForm(true); }}>
          <PlusIcon size={14} /> Add Prospect
        </Btn>
      </div>

      {/* Kanban Board */}
      {prospects.length === 0 ? (
        <EmptyState
          message="No prospects yet. Add your first prospect or load sample data to get started."
          action="Add Prospect"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div style={{
          display: 'flex', gap: 12, flex: 1, overflowX: 'auto', paddingBottom: 8,
        }}>
          {COLUMNS.map((col) => {
            const colProspects = filtered.filter((p) => p.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = col.color; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}
                onDrop={(e) => { e.currentTarget.style.borderColor = colors.border; handleDrop(col.key); }}
                style={{
                  minWidth: 240, width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
                  background: colors.surface, borderRadius: radius.lg,
                  border: `1px solid ${colors.border}`, transition: 'border-color 0.2s',
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '12px 14px', borderBottom: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: radius.full,
                      background: col.color, boxShadow: `0 0 6px ${col.color}44`,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{col.label}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: colors.textSecondary,
                    background: colors.bg, borderRadius: radius.full, padding: '2px 10px',
                    border: `1px solid ${colors.border}`,
                  }}>
                    {colProspects.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{
                  flex: 1, overflow: 'auto', padding: 8,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {colProspects.map((p) => {
                    const daysInStage = p.lastContactDate ? daysAgo(p.lastContactDate) : 0;
                    const overdue = isOverdue(p.nextFollowUp);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => setDragId(p.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setDetailProspect(p)}
                        style={{
                          background: colors.bg, border: `1px solid ${colors.border}`,
                          borderRadius: radius.md, padding: 12, cursor: 'grab',
                          transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = col.color;
                          e.currentTarget.style.boxShadow = `0 0 12px ${col.color}18`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          fontWeight: 600, fontSize: 13, marginBottom: 3,
                          color: colors.textPrimary, letterSpacing: -0.1,
                        }}>
                          {p.name}
                        </div>
                        <div style={{
                          fontSize: 12, color: colors.textSecondary, marginBottom: 8,
                        }}>
                          {p.company}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {daysInStage > 7 && (
                            <Badge color={colors.error}>{daysInStage}d In Stage</Badge>
                          )}
                          {overdue && <Badge color={colors.error}>Overdue</Badge>}
                          {p.dealValue > 0 && (
                            <Badge color={colors.success}>{formatCurrency(p.dealValue)}</Badge>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Badge color={colors.textSecondary}>{statusLabel(p.source)}</Badge>
                        </div>
                      </div>
                    );
                  })}
                  {colProspects.length === 0 && (
                    <div style={{
                      textAlign: 'center', padding: '24px 8px', fontSize: 12,
                      color: colors.textMuted, fontStyle: 'italic',
                    }}>
                      No prospects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingProspect(null); }}
        title={editingProspect ? 'Edit Prospect' : 'Add Prospect'}
        width={600}
      >
        <ProspectForm
          prospect={editingProspect}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingProspect(null); }}
        />
      </Modal>

      {/* Detail Panel */}
      {detailProspect && (
        <ProspectDetail
          prospect={prospects.find((p) => p.id === detailProspect.id) || detailProspect}
          onClose={() => setDetailProspect(null)}
          onUpdate={(updates) => { updateProspect(detailProspect.id, updates); }}
          onEdit={() => {
            setEditingProspect(detailProspect);
            setShowForm(true);
            setDetailProspect(null);
          }}
          onDelete={() => {
            deleteProspect(detailProspect.id);
            setDetailProspect(null);
            toast('Prospect deleted');
          }}
        />
      )}
    </div>
  );
};
