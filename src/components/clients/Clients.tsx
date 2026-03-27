import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, EmptyState, SearchBar, Select } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { ClientForm } from './ClientForm';
import { ClientDetail } from './ClientDetail';
import { PlusIcon } from '../shared/Icons';
import { formatCurrency, formatNumber, formatDate, formatDualCurrency, isThisMonth, getClientColor, daysAgo, calcClientHealth } from '../../utils/helpers';
import type { Client } from '../../types';

export const Clients: React.FC = () => {
  const { clients, setClients, updateClient, deleteClient, posts, settings, toast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = clients.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.company.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (client: Client) => {
    if (editingClient) {
      updateClient(client.id, client);
      toast('Client updated');
    } else {
      setClients((prev) => [...prev, client]);
      toast('Client added');
    }
    setShowForm(false);
    setEditingClient(null);
  };

  const rate = settings?.finance?.exchangeRate ?? 278;

  return (
    <div>
      {/* Search + Filter + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search clients..." />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </Select>
        <Btn onClick={() => { setEditingClient(null); setShowForm(true); }}>
          <PlusIcon size={14} /> Add Client
        </Btn>
      </div>

      {/* Client Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          message="No clients found. Add your first client to get started."
          action="Add Client"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((c) => {
            // Use the global index (not filtered index) for stable color assignment
            const globalIdx = clients.findIndex((cl) => cl.id === c.id);
            const clientColor = getClientColor(globalIdx);
            const clientPosts = posts.filter((p) => p.clientId === c.id);
            const postsThisMonth = clientPosts.filter((p) => p.publishedDate && isThisMonth(p.publishedDate)).length;
            const totalImpressions = clientPosts.reduce((s, p) => s + p.impressions, 0);
            const monthlyValue = c.billingType === 'retainer' ? c.retainer : c.projectValue;
            const lastActivity = c.activities.length > 0
              ? [...c.activities].sort((a, b) => b.date.localeCompare(a.date))[0]
              : null;
            const daysSinceActivity = lastActivity ? daysAgo(lastActivity.date) : null;
            const health = calcClientHealth(c, clientPosts);

            return (
              <div
                key={c.id}
                onClick={() => setDetailClient(c)}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = clientColor;
                  e.currentTarget.style.boxShadow = `0 0 20px ${clientColor}18`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Color stripe at top */}
                <div style={{ height: 4, background: clientColor, width: '100%' }} />

                <div style={{ padding: 20 }}>
                  {/* Header: Avatar, Name, Company, Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Colored avatar circle */}
                      <div style={{
                        width: 40, height: 40, borderRadius: radius.full,
                        background: clientColor + '20',
                        border: `2px solid ${clientColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: clientColor,
                        flexShrink: 0,
                      }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: colors.textPrimary, letterSpacing: -0.2, marginBottom: 2 }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: 12, color: colors.textSecondary }}>{c.company}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <StatusBadge status={c.status} />
                      {c.status === 'active' && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: health.color + '18', border: `1px solid ${health.color}40`,
                          borderRadius: radius.full, padding: '2px 8px',
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: health.color }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: health.color, letterSpacing: 0.3 }}>
                            {health.grade} · {health.score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value + Billing Type */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: clientColor, letterSpacing: -0.3 }}>
                        {formatCurrency(monthlyValue)}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                        {formatDualCurrency(monthlyValue, rate)}
                      </div>
                    </div>
                    <StatusBadge status={c.billingType} />
                  </div>

                  {/* Stats Row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                    marginBottom: 14, padding: '10px 0',
                    borderTop: `1px solid ${colors.border}`,
                    borderBottom: `1px solid ${colors.border}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{postsThisMonth}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Posts This Month
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.info }}>{formatNumber(totalImpressions)}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Total Impressions
                      </div>
                    </div>
                  </div>

                  {/* Content Pillars */}
                  {c.pillars.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {c.pillars.map((p) => (
                        <Badge key={p} color={clientColor}>{p}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Start Date + Last Activity */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>
                      Since {formatDate(c.startDate)}
                    </div>
                    {daysSinceActivity !== null ? (
                      <div style={{
                        fontSize: 11,
                        color: daysSinceActivity > 14 ? colors.error : daysSinceActivity > 7 ? colors.warning : colors.success,
                        fontWeight: 500,
                      }}>
                        {daysSinceActivity === 0 ? 'Active today' : `${daysSinceActivity}d since activity`}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: colors.textMuted }}>No activity</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingClient(null); }}
        title={editingClient ? 'Edit Client' : 'Add Client'}
        width={680}
      >
        <ClientForm
          client={editingClient}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingClient(null); }}
        />
      </Modal>

      {/* Detail Slide-in */}
      {detailClient && (
        <ClientDetail
          client={clients.find((c) => c.id === detailClient.id) || detailClient}
          posts={posts.filter((p) => p.clientId === detailClient.id)}
          onClose={() => setDetailClient(null)}
          onUpdate={(updates) => updateClient(detailClient.id, updates)}
          onEdit={() => {
            setEditingClient(detailClient);
            setShowForm(true);
            setDetailClient(null);
          }}
          onDelete={() => {
            deleteClient(detailClient.id);
            setDetailClient(null);
            toast('Client deleted');
          }}
        />
      )}
    </div>
  );
};
