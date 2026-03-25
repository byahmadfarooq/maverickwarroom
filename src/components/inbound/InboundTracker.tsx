import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card, Btn, Badge, EmptyState } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { InboundForm } from './InboundForm';
import { InboundDetail } from './InboundDetail';
import { PlusIcon, SearchIcon } from '../shared/Icons';
import { formatPercent, isLastNDays } from '../../utils/helpers';
import type { InboundLead, InboundStatus } from '../../types';

const COLUMNS: { key: InboundStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: colors.info },
  { key: 'contacted', label: 'Contacted', color: colors.accent },
  { key: 'qualified', label: 'Qualified', color: colors.warning },
  { key: 'call_booked', label: 'Call Booked', color: '#A855F7' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: colors.accent },
  { key: 'won', label: 'Won', color: colors.success },
  { key: 'lost', label: 'Lost', color: colors.error },
  { key: 'not_qualified', label: 'Not Qualified', color: colors.textSecondary },
];

export const InboundTracker: React.FC = () => {
  const { inbound, setInbound, updateInbound, deleteInbound, posts, toast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<InboundLead | null>(null);
  const [detailLead, setDetailLead] = useState<InboundLead | null>(null);
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = inbound.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase())
  );

  // Metrics
  const weekLeads = inbound.filter((l) => isLastNDays(l.dateReceived, 7));
  const newThisWeek = weekLeads.length;
  const responded = inbound.filter((l) => l.status !== 'new').length;
  const responseRate = inbound.length > 0 ? responded / inbound.length : 0;
  const qualified = inbound.filter((l) => !['new', 'contacted', 'not_qualified'].includes(l.status)).length;
  const qualifiedRate = inbound.length > 0 ? qualified / inbound.length : 0;
  const callsFromInbound = inbound.filter((l) => l.status === 'call_booked' || l.status === 'proposal_sent' || l.status === 'won').length;
  const won = inbound.filter((l) => l.status === 'won').length;
  const closed = inbound.filter((l) => l.status === 'won' || l.status === 'lost').length;
  const winRate = closed > 0 ? won / closed : 0;

  // Top source
  const sourceCounts: Record<string, number> = {};
  inbound.forEach((l) => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, ' ') || '-';

  const handleDrop = (status: InboundStatus) => {
    if (dragId) {
      updateInbound(dragId, { status });
      toast(`Moved to ${status.replace(/_/g, ' ')}`);
      setDragId(null);
    }
  };

  const handleSave = (lead: InboundLead) => {
    if (editingLead) {
      updateInbound(lead.id, lead);
      toast('Lead updated');
    } else {
      setInbound((prev) => [...prev, lead]);
      toast('Inbound lead added');
    }
    setShowForm(false);
    setEditingLead(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Metrics */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'New This Week', value: newThisWeek },
          { label: 'Response Rate', value: formatPercent(responseRate) },
          { label: 'Qualified Rate', value: formatPercent(qualifiedRate) },
          { label: 'Calls Booked', value: callsFromInbound },
          { label: 'Win Rate', value: formatPercent(winRate) },
          { label: 'Top Source', value: topSource },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..."
            style={{ width: '100%', padding: '8px 12px 8px 32px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <Btn onClick={() => { setEditingLead(null); setShowForm(true); }}><PlusIcon size={14} /> Add Lead</Btn>
      </div>

      {/* Kanban Board */}
      {inbound.length === 0 ? (
        <EmptyState message="No inbound leads yet." action="Add Lead" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: 'flex', gap: 12, flex: 1, overflowX: 'auto', paddingBottom: 8 }}>
          {COLUMNS.map((col) => {
            const colLeads = filtered.filter((l) => l.status === col.key);
            return (
              <div key={col.key} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(col.key)}
                style={{ minWidth: 220, width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: colors.textSecondary, background: colors.bg, borderRadius: 10, padding: '1px 8px' }}>{colLeads.length}</span>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colLeads.map((l) => (
                    <div key={l.id} draggable onDragStart={() => setDragId(l.id)} onClick={() => setDetailLead(l)}
                      style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: 10, cursor: 'grab', transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: colors.textPrimary }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>{l.company}</div>
                      <Badge color={colors.textSecondary}>{l.source.replace(/_/g, ' ')}</Badge>
                      {l.message && <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.message}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingLead(null); }} title={editingLead ? 'Edit Lead' : 'Add Inbound Lead'}>
        <InboundForm lead={editingLead} posts={posts} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingLead(null); }} />
      </Modal>

      {detailLead && (
        <InboundDetail
          lead={inbound.find((l) => l.id === detailLead.id) || detailLead}
          onClose={() => setDetailLead(null)}
          onUpdate={(updates) => updateInbound(detailLead.id, updates)}
          onEdit={() => { setEditingLead(detailLead); setShowForm(true); setDetailLead(null); }}
          onDelete={() => { deleteInbound(detailLead.id); setDetailLead(null); toast('Lead deleted'); }}
        />
      )}
    </div>
  );
};
