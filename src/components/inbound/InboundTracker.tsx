import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, StatCard, EmptyState, SearchBar } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { InboundForm } from './InboundForm';
import { InboundDetail } from './InboundDetail';
import { PlusIcon, InboxIcon, TrendingUpIcon, TargetIcon } from '../shared/Icons';
import {
  formatPercent, formatCurrency, formatDualCurrency, isThisWeek, isLastNDays,
  statusLabel, daysBetween,
} from '../../utils/helpers';
import type { InboundLead, InboundStatus } from '../../types';

const COLUMNS: { key: InboundStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: colors.info },
  { key: 'contacted', label: 'Contacted', color: colors.accent },
  { key: 'qualified', label: 'Qualified', color: colors.warning },
  { key: 'call_booked', label: 'Call Booked', color: colors.purple },
  { key: 'proposal_sent', label: 'Proposal Sent', color: colors.accent },
  { key: 'won', label: 'Won', color: colors.success },
  { key: 'lost', label: 'Lost', color: colors.error },
  { key: 'not_qualified', label: 'Not Qualified', color: colors.textSecondary },
];

export const InboundTracker: React.FC = () => {
  const { inbound, setInbound, updateInbound, deleteInbound, posts, settings, toast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<InboundLead | null>(null);
  const [detailLead, setDetailLead] = useState<InboundLead | null>(null);
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    inbound.filter((l) =>
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase())
    ), [inbound, search]);

  // Metrics
  const metrics = useMemo(() => {
    const newThisWeek = inbound.filter((l) => isThisWeek(l.dateReceived)).length;
    const responded = inbound.filter((l) => l.status !== 'new').length;
    const responseRate = inbound.length > 0 ? responded / inbound.length : 0;
    const qualifiedLeads = inbound.filter((l) =>
      !['new', 'contacted', 'not_qualified'].includes(l.status)
    ).length;
    const qualifiedRate = inbound.length > 0 ? qualifiedLeads / inbound.length : 0;
    const callsFromInbound = inbound.filter((l) =>
      ['call_booked', 'proposal_sent', 'won'].includes(l.status)
    ).length;
    const wonLeads = inbound.filter((l) => l.status === 'won');
    const won = wonLeads.length;
    const closed = inbound.filter((l) => l.status === 'won' || l.status === 'lost').length;
    const winRate = closed > 0 ? won / closed : 0;

    // Top Source
    const sourceCounts: Record<string, number> = {};
    inbound.forEach((l) => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });
    const topSource = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const topSourceLabel = topSource ? statusLabel(topSource) : '-';

    // Avg Time to Qualify
    const qualifiedWithDates = inbound.filter((l) =>
      !['new', 'contacted', 'not_qualified'].includes(l.status) && l.dateReceived && l.updatedAt
    );
    const avgTimeToQualify = qualifiedWithDates.length > 0
      ? Math.round(
          qualifiedWithDates.reduce((s, l) =>
            s + daysBetween(l.dateReceived, l.updatedAt.split('T')[0]), 0
          ) / qualifiedWithDates.length
        )
      : 0;

    // Active Leads
    const activeLeads = inbound.filter((l) =>
      !['won', 'lost', 'not_qualified'].includes(l.status)
    ).length;

    // Total Inbound Value (estimate from avg won deal)
    // Since InboundLead doesn't have dealValue, estimate from prospects that converted
    const totalInboundValue = 0; // No dealValue on InboundLead type

    return {
      newThisWeek, responseRate, qualifiedRate, callsFromInbound,
      winRate, topSourceLabel, avgTimeToQualify, activeLeads, totalInboundValue,
    };
  }, [inbound]);

  const handleDrop = (status: InboundStatus) => {
    if (dragId) {
      updateInbound(dragId, { status });
      toast(`Moved to ${statusLabel(status)}`);
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
      {/* Metrics Bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {([
          { label: 'New Leads This Week', value: metrics.newThisWeek, color: colors.info, icon: <InboxIcon size={16} style={{ color: colors.info }} /> },
          { label: 'Response Rate', value: formatPercent(metrics.responseRate), color: colors.accent, icon: <TrendingUpIcon size={16} style={{ color: colors.accent }} /> },
          { label: 'Qualified Rate', value: formatPercent(metrics.qualifiedRate), color: colors.warning },
          { label: 'Calls Booked', value: metrics.callsFromInbound, color: colors.purple, icon: <TargetIcon size={16} style={{ color: colors.purple }} /> },
          { label: 'Inbound Win Rate', value: formatPercent(metrics.winRate), color: colors.success, icon: <TrendingUpIcon size={16} style={{ color: colors.success }} /> },
          { label: 'Top Source', value: metrics.topSourceLabel, color: colors.textPrimary },
          { label: 'Avg Time To Qualify', value: metrics.avgTimeToQualify > 0 ? `${metrics.avgTimeToQualify}d` : '-', color: colors.info },
          { label: 'Active Leads', value: metrics.activeLeads, color: colors.accent },
        ] as { label: string; value: string | number; sub?: string; color: string; icon?: React.ReactNode }[]).map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} sub={m.sub} color={m.color} icon={m.icon} />
        ))}
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search inbound leads..." />
        <Btn onClick={() => { setEditingLead(null); setShowForm(true); }}>
          <PlusIcon size={14} /> Add Lead
        </Btn>
      </div>

      {/* Kanban Board */}
      {inbound.length === 0 ? (
        <EmptyState
          message="No inbound leads yet. Add your first lead or load sample data to get started."
          action="Add Lead"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div style={{
          display: 'flex', gap: 12, flex: 1, overflowX: 'auto', paddingBottom: 8,
        }}>
          {COLUMNS.map((col) => {
            const colLeads = filtered.filter((l) => l.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = col.color; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}
                onDrop={(e) => { e.currentTarget.style.borderColor = colors.border; handleDrop(col.key); }}
                style={{
                  minWidth: 230, width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column',
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                      {col.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: colors.textSecondary,
                    background: colors.bg, borderRadius: radius.full, padding: '2px 10px',
                    border: `1px solid ${colors.border}`,
                  }}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{
                  flex: 1, overflow: 'auto', padding: 8,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {colLeads.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setDetailLead(l)}
                      style={{
                        background: colors.bg, border: `1px solid ${colors.border}`,
                        borderRadius: radius.md, padding: 12, cursor: 'grab',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
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
                        {l.name}
                      </div>
                      <div style={{
                        fontSize: 12, color: colors.textSecondary, marginBottom: 8,
                      }}>
                        {l.company}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: l.message ? 6 : 0 }}>
                        <Badge color={colors.textSecondary}>{statusLabel(l.source)}</Badge>
                      </div>
                      {l.message && (
                        <div style={{
                          fontSize: 11, color: colors.textMuted, marginTop: 4,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: '100%', lineHeight: 1.4,
                        }}>
                          {l.message}
                        </div>
                      )}
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div style={{
                      textAlign: 'center', padding: '24px 8px', fontSize: 12,
                      color: colors.textMuted, fontStyle: 'italic',
                    }}>
                      No leads
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
        onClose={() => { setShowForm(false); setEditingLead(null); }}
        title={editingLead ? 'Edit Lead' : 'Add Inbound Lead'}
        width={600}
      >
        <InboundForm
          lead={editingLead}
          posts={posts}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingLead(null); }}
        />
      </Modal>

      {/* Detail Panel */}
      {detailLead && (
        <InboundDetail
          lead={inbound.find((l) => l.id === detailLead.id) || detailLead}
          onClose={() => setDetailLead(null)}
          onUpdate={(updates) => updateInbound(detailLead.id, updates)}
          onEdit={() => {
            setEditingLead(detailLead);
            setShowForm(true);
            setDetailLead(null);
          }}
          onDelete={() => {
            deleteInbound(detailLead.id);
            setDetailLead(null);
            toast('Lead deleted');
          }}
        />
      )}
    </div>
  );
};
