import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Btn, Badge, Field, Select, Input, TextArea, StatusBadge } from '../shared/FormElements';
import { XIcon, EditIcon, TrashIcon, PlusIcon } from '../shared/Icons';
import { genId, today, now, formatDate, formatCurrency, formatDualCurrency, isOverdue, statusLabel } from '../../utils/helpers';
import type { Prospect, Activity, Proposal } from '../../types';

interface Props {
  prospect: Prospect;
  onClose: () => void;
  onUpdate: (updates: Partial<Prospect>) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
};

export const ProspectDetail: React.FC<Props> = ({ prospect, onClose, onUpdate, onEdit, onDelete }) => {
  const { settings } = useApp();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actType, setActType] = useState<Activity['type']>('dm_sent');
  const [actDate, setActDate] = useState(today());
  const [actNotes, setActNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalBody, setProposalBody] = useState('');
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rate = settings?.finance?.exchangeRate ?? 278;

  const addActivity = () => {
    const activity: Activity = { id: genId(), date: actDate, type: actType, notes: actNotes };
    onUpdate({
      activities: [...prospect.activities, activity],
      lastContactDate: actDate,
    });
    setShowAddActivity(false);
    setActNotes('');
    setActDate(today());
  };

  const proposals = prospect.proposals ?? [];

  const openNewProposal = () => {
    const defaultBody = `Hi ${prospect.name},\n\nFollowing our conversation, I'm excited to present this proposal for ${prospect.company}.\n\n— SCOPE OF WORK —\n\n[Describe deliverables here]\n\n— INVESTMENT —\n\n$${prospect.dealValue > 0 ? prospect.dealValue.toLocaleString() : 'TBD'}/month\n\n— NEXT STEPS —\n\n1. Review this proposal\n2. Schedule a follow-up call\n3. Sign the agreement\n\nLooking forward to working together!\n\nAhmad Farooq`;
    setProposalTitle(`Proposal for ${prospect.company}`);
    setProposalBody(defaultBody);
    setEditingProposalId(null);
    setShowProposalForm(true);
  };

  const saveProposal = () => {
    if (!proposalTitle.trim()) return;
    if (editingProposalId) {
      const updated = proposals.map((p) =>
        p.id === editingProposalId ? { ...p, title: proposalTitle, body: proposalBody } : p
      );
      onUpdate({ proposals: updated });
    } else {
      const newProposal: Proposal = {
        id: genId(), title: proposalTitle, body: proposalBody,
        createdAt: now(), sentAt: null,
      };
      onUpdate({ proposals: [...proposals, newProposal] });
    }
    setShowProposalForm(false);
    setEditingProposalId(null);
  };

  const deleteProposal = (id: string) => {
    onUpdate({ proposals: proposals.filter((p) => p.id !== id) });
  };

  const copyProposal = (p: Proposal) => {
    navigator.clipboard.writeText(`${p.title}\n\n${p.body}`).then(() => {
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const markProposalSent = (id: string) => {
    const updated = proposals.map((p) => p.id === id ? { ...p, sentAt: now() } : p);
    onUpdate({ proposals: updated });
  };

  const overdueFollowUp = isOverdue(prospect.nextFollowUp);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 480, maxWidth: '100vw', height: '100vh',
        background: colors.surface, borderLeft: `1px solid ${colors.border}`, zIndex: 999,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.25s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{
              margin: 0, fontSize: 17, fontWeight: 700,
              color: colors.textPrimary, letterSpacing: -0.2,
            }}>
              {prospect.name}
            </h3>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              {prospect.company}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn variant="ghost" size="sm" onClick={onEdit}><EditIcon size={14} /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}><TrashIcon size={14} /></Btn>
            <Btn variant="ghost" size="sm" onClick={onClose}><XIcon size={14} /></Btn>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {/* Info Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
            padding: 16, background: colors.bg, borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
          }}>
            <div>
              <div style={infoLabelStyle}>Status</div>
              <StatusBadge status={prospect.status} />
            </div>
            <div>
              <div style={infoLabelStyle}>Deal Value</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.success }}>
                {formatCurrency(prospect.dealValue)}
              </div>
              {prospect.dealValue > 0 && (
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  {formatDualCurrency(prospect.dealValue, rate)}
                </div>
              )}
            </div>
            <div>
              <div style={infoLabelStyle}>Source</div>
              <Badge>{statusLabel(prospect.source)}</Badge>
            </div>
            <div>
              <div style={infoLabelStyle}>Connection</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: prospect.connectionAccepted ? colors.success : colors.textMuted }}>
                {prospect.connectionAccepted ? '✓ Accepted' : 'Not Connected'}
              </div>
            </div>
            <div>
              <div style={infoLabelStyle}>Followers</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                {prospect.followerCount > 0
                  ? (prospect.followerCount >= 1000 ? `${(prospect.followerCount / 1000).toFixed(1)}K` : prospect.followerCount)
                  : '—'}
              </div>
            </div>
            <div>
              <div style={infoLabelStyle}>Last Post</div>
              <div style={{ fontSize: 13, color: colors.textPrimary }}>
                {prospect.lastPostDate ? formatDate(prospect.lastPostDate) : '—'}
              </div>
            </div>
            <div>
              <div style={infoLabelStyle}>Next Follow-Up</div>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: overdueFollowUp ? colors.error : colors.textPrimary,
              }}>
                {prospect.nextFollowUp ? formatDate(prospect.nextFollowUp) : 'Not Set'}
                {overdueFollowUp && (
                  <span style={{
                    fontSize: 10, background: colors.errorMuted, color: colors.error,
                    padding: '2px 6px', borderRadius: radius.full, marginLeft: 6,
                    fontWeight: 600,
                  }}>
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* LinkedIn / Email */}
          {prospect.linkedinUrl && (
            <div style={{
              marginBottom: 10, fontSize: 13, padding: '10px 14px',
              background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`,
            }}>
              <span style={{ color: colors.textSecondary, fontWeight: 600 }}>LinkedIn: </span>
              <a href={prospect.linkedinUrl} target="_blank" rel="noreferrer"
                style={{ color: colors.info, textDecoration: 'none' }}>
                {prospect.linkedinUrl}
              </a>
            </div>
          )}
          {prospect.email && (
            <div style={{
              marginBottom: 10, fontSize: 13, padding: '10px 14px',
              background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`,
            }}>
              <span style={{ color: colors.textSecondary, fontWeight: 600 }}>Email: </span>
              <span style={{ color: colors.textPrimary }}>{prospect.email}</span>
            </div>
          )}

          {/* Notes */}
          {prospect.notes && (
            <div style={{
              marginBottom: 20, marginTop: 10,
            }}>
              <div style={infoLabelStyle}>Notes</div>
              <div style={{
                fontSize: 13, color: colors.textPrimary, lineHeight: 1.6,
                background: colors.bg, padding: 14, borderRadius: radius.md,
                border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap',
              }}>
                {prospect.notes}
              </div>
            </div>
          )}

          {/* Follow-Up Date Updater */}
          <div style={{
            marginBottom: 24, padding: 14, background: colors.bg,
            borderRadius: radius.md, border: `1px solid ${colors.border}`,
          }}>
            <Field label="Update Next Follow-Up" style={{ marginBottom: 0 }}>
              <Input
                type="date"
                value={prospect.nextFollowUp || ''}
                onChange={(e) => onUpdate({ nextFollowUp: e.target.value })}
              />
            </Field>
          </div>

          {/* Proposals */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 13, color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Proposals ({proposals.length})
              </h4>
              <Btn variant="secondary" size="sm" onClick={openNewProposal}>
                <PlusIcon size={12} /> New Proposal
              </Btn>
            </div>

            {/* New / Edit Proposal Form */}
            {showProposalForm && (
              <div style={{ background: colors.bg, padding: 14, borderRadius: radius.md, marginBottom: 12, border: `1px solid ${colors.border}` }}>
                <Field label="Title" style={{ marginBottom: 10 }}>
                  <Input value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} placeholder="Proposal title..." />
                </Field>
                <Field label="Body" style={{ marginBottom: 10 }}>
                  <TextArea
                    value={proposalBody}
                    onChange={(e) => setProposalBody(e.target.value)}
                    style={{ minHeight: 180, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Field>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" size="sm" onClick={() => setShowProposalForm(false)}>Cancel</Btn>
                  <Btn size="sm" onClick={saveProposal}>Save Proposal</Btn>
                </div>
              </div>
            )}

            {/* Proposals List */}
            {proposals.length === 0 && !showProposalForm && (
              <div style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, padding: '16px 20px', fontStyle: 'italic', background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                No proposals yet. Create one to get started.
              </div>
            )}
            {[...proposals].reverse().map((p) => (
              <div key={p.id} style={{ marginBottom: 8, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      Created {formatDate(p.createdAt.split('T')[0])}
                      {p.sentAt && <span style={{ marginLeft: 8, color: colors.success }}>• Sent {formatDate(p.sentAt.split('T')[0])}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn variant="ghost" size="sm" onClick={() => copyProposal(p)}
                      style={{ color: copiedId === p.id ? colors.success : colors.textSecondary, fontSize: 11 }}>
                      {copiedId === p.id ? 'Copied!' : 'Copy'}
                    </Btn>
                    {!p.sentAt && (
                      <Btn variant="ghost" size="sm" onClick={() => markProposalSent(p.id)}
                        style={{ color: colors.info, fontSize: 11 }}>Mark Sent</Btn>
                    )}
                    <Btn variant="ghost" size="sm" onClick={() => {
                      setProposalTitle(p.title); setProposalBody(p.body);
                      setEditingProposalId(p.id); setShowProposalForm(true);
                    }}><EditIcon size={12} /></Btn>
                    <Btn variant="ghost" size="sm" onClick={() => deleteProposal(p.id)}><TrashIcon size={12} /></Btn>
                  </div>
                </div>
                <div style={{ padding: '8px 14px', maxHeight: 80, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ fontSize: 12, color: colors.textSecondary, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {p.body.slice(0, 200)}{p.body.length > 200 ? '…' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Log Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 14,
          }}>
            <h4 style={{
              margin: 0, fontSize: 13, color: colors.textSecondary,
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8,
            }}>
              Activity Log
            </h4>
            <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(!showAddActivity)}>
              <PlusIcon size={12} /> Log Activity
            </Btn>
          </div>

          {/* Add Activity Form */}
          {showAddActivity && (
            <div style={{
              background: colors.bg, padding: 14, borderRadius: radius.md,
              marginBottom: 14, border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Type">
                  <Select value={actType} onChange={(e) => setActType(e.target.value as Activity['type'])}>
                    <option value="dm_sent">DM Sent</option>
                    <option value="follow_up">Follow-Up Sent</option>
                    <option value="they_replied">They Replied</option>
                    <option value="call_scheduled">Call Scheduled</option>
                    <option value="call_completed">Call Completed</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="they_replied_proposal">They Replied To Proposal</option>
                    <option value="meeting">Meeting</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="note">Note</option>
                  </Select>
                </Field>
                <Field label="Date">
                  <Input type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} />
                </Field>
              </div>
              <Field label="Notes">
                <TextArea
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                  placeholder="Activity details..."
                  style={{ minHeight: 60 }}
                />
              </Field>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(false)}>Cancel</Btn>
                <Btn size="sm" onClick={addActivity}>Add Activity</Btn>
              </div>
            </div>
          )}

          {/* Activity List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...prospect.activities].reverse().map((a) => (
              <div key={a.id} style={{
                padding: '10px 14px', background: colors.bg, borderRadius: radius.md,
                border: `1px solid ${colors.border}`, fontSize: 13,
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: a.notes ? 6 : 0,
                }}>
                  <StatusBadge status={a.type} />
                  <span style={{ color: colors.textMuted, fontSize: 11 }}>{formatDate(a.date)}</span>
                </div>
                {a.notes && (
                  <div style={{
                    color: colors.textPrimary, marginTop: 4,
                    lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>
                    {a.notes}
                  </div>
                )}
              </div>
            ))}
            {prospect.activities.length === 0 && (
              <div style={{
                textAlign: 'center', color: colors.textMuted, fontSize: 13,
                padding: '28px 20px', fontStyle: 'italic',
              }}>
                No activity logged yet. Start by logging your first interaction.
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16,
            background: colors.bg, borderTop: `1px solid ${colors.border}`,
            display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: 13, color: colors.error, fontWeight: 600 }}>
              Delete this prospect permanently?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
              <Btn variant="danger" size="sm" onClick={onDelete}>Delete</Btn>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
