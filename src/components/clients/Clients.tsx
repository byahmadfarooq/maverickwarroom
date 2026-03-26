import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, EmptyState, SearchBar, Select } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { ClientForm } from './ClientForm';
import { ClientDetail } from './ClientDetail';
import { PlusIcon } from '../shared/Icons';
import { formatCurrency, formatNumber, formatDate, formatDualCurrency, isThisMonth } from '../../utils/helpers';
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

  const rate = settings.finance.exchangeRate;

  return (
    <div>
      {/* Search + Filter + Add */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search clients..." />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {filtered.map((c) => {
            const clientPosts = posts.filter((p) => p.clientId === c.id);
            const postsThisMonth = clientPosts.filter(
              (p) => p.publishedDate && isThisMonth(p.publishedDate)
            ).length;
            const totalImpressions = clientPosts.reduce((s, p) => s + p.impressions, 0);
            const monthlyValue = c.billingType === 'retainer' ? c.retainer : c.projectValue;

            return (
              <Card
                key={c.id}
                onClick={() => setDetailClient(c)}
                style={{
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Header: Name, Company, Status */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: 14,
                }}>
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: 15, color: colors.textPrimary,
                      letterSpacing: -0.2, marginBottom: 2,
                    }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 13, color: colors.textSecondary }}>{c.company}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                {/* Value + Billing Type */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 14,
                }}>
                  <div>
                    <div style={{
                      fontSize: 20, fontWeight: 700, color: colors.success, letterSpacing: -0.3,
                    }}>
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
                    <div style={{
                      fontSize: 16, fontWeight: 700, color: colors.textPrimary,
                    }}>
                      {postsThisMonth}
                    </div>
                    <div style={{
                      fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      Posts This Month
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 16, fontWeight: 700, color: colors.info,
                    }}>
                      {formatNumber(totalImpressions)}
                    </div>
                    <div style={{
                      fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      Total Impressions
                    </div>
                  </div>
                </div>

                {/* Content Pillars */}
                {c.pillars.length > 0 && (
                  <div style={{
                    display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10,
                  }}>
                    {c.pillars.map((p) => (
                      <Badge key={p} color={colors.accent}>{p}</Badge>
                    ))}
                  </div>
                )}

                {/* Start Date */}
                <div style={{
                  fontSize: 11, color: colors.textMuted, marginTop: 4,
                }}>
                  Since {formatDate(c.startDate)}
                </div>
              </Card>
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
