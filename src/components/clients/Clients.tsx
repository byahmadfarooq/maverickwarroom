import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card, Btn, Badge, StatusBadge, EmptyState } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { ClientForm } from './ClientForm';
import { ClientDetail } from './ClientDetail';
import { PlusIcon, SearchIcon } from '../shared/Icons';
import { formatCurrency, formatDate, isThisMonth } from '../../utils/helpers';
import type { Client } from '../../types';

export const Clients: React.FC = () => {
  const { clients, setClients, updateClient, deleteClient, posts, toast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = clients.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.company.toLowerCase().includes(search.toLowerCase())) return false;
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

  return (
    <div>
      {/* Search + Filter + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: 10, top: 9, color: colors.textSecondary }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..."
            style={{ width: '100%', padding: '8px 12px 8px 32px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textPrimary, fontSize: 14, outline: 'none' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>
        <Btn onClick={() => { setEditingClient(null); setShowForm(true); }}><PlusIcon size={14} /> Add Client</Btn>
      </div>

      {/* Client Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState message="No clients found." action="Add Client" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((c) => {
            const clientPosts = posts.filter((p) => p.clientId === c.id);
            const postsThisMonth = clientPosts.filter((p) => p.publishedDate && isThisMonth(p.publishedDate)).length;
            const totalImpressions = clientPosts.reduce((s, p) => s + p.impressions, 0);

            return (
              <Card key={c.id} onClick={() => setDetailClient(c)} style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: colors.textPrimary }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: colors.textSecondary }}>{c.company}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors.success }}>{formatCurrency(c.retainer)}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Monthly</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>{postsThisMonth}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Posts/mo</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors.info }}>{totalImpressions > 1000 ? (totalImpressions / 1000).toFixed(1) + 'K' : totalImpressions}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Impressions</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {c.pillars.map((p) => <Badge key={p} color={colors.accent}>{p}</Badge>)}
                </div>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 8 }}>Since {formatDate(c.startDate)}</div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingClient(null); }} title={editingClient ? 'Edit Client' : 'Add Client'} width={550}>
        <ClientForm client={editingClient} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingClient(null); }} />
      </Modal>

      {detailClient && (
        <ClientDetail
          client={clients.find((c) => c.id === detailClient.id) || detailClient}
          posts={posts.filter((p) => p.clientId === detailClient.id)}
          onClose={() => setDetailClient(null)}
          onUpdate={(updates) => updateClient(detailClient.id, updates)}
          onEdit={() => { setEditingClient(detailClient); setShowForm(true); setDetailClient(null); }}
          onDelete={() => { deleteClient(detailClient.id); setDetailClient(null); toast('Client deleted'); }}
        />
      )}
    </div>
  );
};
