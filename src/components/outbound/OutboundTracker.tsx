import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, EmptyState } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { ProspectForm } from './ProspectForm';
import { ProspectDetail } from './ProspectDetail';
import { PlusIcon, SearchIcon } from '../shared/Icons';
import { formatCurrency, daysAgo, isOverdue, isLastNDays, formatPercent } from '../../utils/helpers';
import type { Prospect, ProspectStatus } from '../../types';

const COLUMNS: { key: ProspectStatus; label: string; color: string }[] = [
  { key: 'research', label: 'Research', color: colors.textSecondary },
  { key: 'dm_sent', label: 'DM Sent', color: colors.info },
  { key: 'replied', label: 'Replied', color: colors.warning },
  { key: 'call_booked', label: 'Call Booked', color: '#A855F7' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: colors.accent },
  { key: 'negotiating', label: 'Negotiating', color: colors.warning },
  { key: 'won', label: 'Won', color: colors.success },
  { key: 'lost', label: 'Lost', color: colors.error },
];

export const OutboundTracker: React.FC = () => {
  const { prospects, setProspects, updateProspect, deleteProspect, toast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [detailProspect, setDetailProspect] = useState<Prospect | null>(null);
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = prospects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.company.toLowerCase().includes(search.toLowerCase())
  );

  // Metrics
  const allActivities = prospects.flatMap((p) => p.activities);
  const weekActivities = allActivities.filter((a) => isLastNDays(a.date, 7));
  const dmsSentWeek = weekActivities.filter((a) => a.type === 'dm_sent' || a.type === 'follow_up').length;
  const repliesWeek = weekActivities.filter((a) => a.type === 'they_replied').length;
  const replyRate = dmsSentWeek > 0 ? repliesWeek / dmsSentWeek : 0;
  const callsWeek = weekActivities.filter((a) => a.type === 'call_scheduled').length;
  const proposalsWeek = weekActivities.filter((a) => a.type === 'proposal_sent').length;
  const won = prospects.filter((p) => p.status === 'won').length;
  const closed = prospects.filter((p) => p.status === 'won' || p.status === 'lost').length;
  const winRate = closed > 0 ? won / closed : 0;
  const avgDeal = won > 0 ? prospects.filter((p) => p.status === 'won').reduce((s, p) => s + p.dealValue, 0) / won : 0;

  const handleDrop = (status: ProspectStatus) => {
    if (dragId) {
      updateProspect(dragId, { status });
      toast(`Moved to ${status.replace(/_/g, ' ')}`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Metrics Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'DMs This Week', value: dmsSentWeek },
          { label: 'Reply Rate', value: formatPercent(replyRate) },
          { label: 'Calls Booked', value: callsWeek },
          { label: 'Proposals Sent', value: proposalsWeek },
          { label: 'Win Rate', value: formatPercent(winRate) },
          { label: 'Avg Deal', value: formatCurrency(avgDeal) },
        ].map((m) => (
          <div key={m.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: 10, top: 9, color: colors.textSecondary }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prospects..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px', background: colors.surface, border: `1px solid ${colors.border}`,
              borderRadius: 6, color: colors.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <Btn onClick={() => { setEditingProspect(null); setShowForm(true); }}><PlusIcon size={14} /> Add Prospect</Btn>
      </div>

      {/* Kanban Board */}
      {prospects.length === 0 ? (
        <EmptyState message="No prospects yet. Add your first prospect or load sample data." action="Add Prospect" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: 'flex', gap: 12, flex: 1, overflowX: 'auto', paddingBottom: 8 }}>
          {COLUMNS.map((col) => {
            const colProspects = filtered.filter((p) => p.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.key)}
                style={{
                  minWidth: 240, width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
                  background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}`,
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '10px 12px', borderBottom: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: colors.textSecondary, background: colors.bg, borderRadius: 10, padding: '1px 8px' }}>
                    {colProspects.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colProspects.map((p) => {
                    const daysInStage = p.lastContactDate ? daysAgo(p.lastContactDate) : 0;
                    const overdue = isOverdue(p.nextFollowUp);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => setDragId(p.id)}
                        onClick={() => setDetailProspect(p)}
                        style={{
                          background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6,
                          padding: 10, cursor: 'grab', transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: colors.textPrimary }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>{p.company}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {daysInStage > 7 && <Badge color={colors.error}>{daysInStage}d in stage</Badge>}
                          {overdue && <Badge color={colors.error}>Overdue</Badge>}
                          {p.dealValue > 0 && <Badge color={colors.success}>{formatCurrency(p.dealValue)}</Badge>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Badge color={colors.textSecondary}>{p.source.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingProspect(null); }} title={editingProspect ? 'Edit Prospect' : 'Add Prospect'}>
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
          onEdit={() => { setEditingProspect(detailProspect); setShowForm(true); setDetailProspect(null); }}
          onDelete={() => { deleteProspect(detailProspect.id); setDetailProspect(null); toast('Prospect deleted'); }}
        />
      )}
    </div>
  );
};
