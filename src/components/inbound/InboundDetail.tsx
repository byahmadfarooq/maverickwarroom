import React, { useState } from 'react';
import { colors, radius } from '../../utils/theme';
import { Btn, Badge, Field, Select, Input, TextArea, StatusBadge } from '../shared/FormElements';
import { XIcon, EditIcon, TrashIcon, PlusIcon } from '../shared/Icons';
import { genId, today, formatDate, statusLabel } from '../../utils/helpers';
import type { InboundLead, Activity } from '../../types';

interface Props {
  lead: InboundLead;
  onClose: () => void;
  onUpdate: (updates: Partial<InboundLead>) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
};

export const InboundDetail: React.FC<Props> = ({ lead, onClose, onUpdate, onEdit, onDelete }) => {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actType, setActType] = useState<Activity['type']>('note');
  const [actDate, setActDate] = useState(today());
  const [actNotes, setActNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingResponse, setEditingResponse] = useState(false);
  const [responseText, setResponseText] = useState(lead.response);

  const addActivity = () => {
    const activity: Activity = { id: genId(), date: actDate, type: actType, notes: actNotes };
    onUpdate({
      activities: [...lead.activities, activity],
      lastActionDate: actDate,
    });
    setShowAddActivity(false);
    setActNotes('');
    setActDate(today());
  };

  const saveResponse = () => {
    onUpdate({ response: responseText });
    setEditingResponse(false);
  };

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
              {lead.name}
            </h3>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              {lead.company}
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
              <StatusBadge status={lead.status} />
            </div>
            <div>
              <div style={infoLabelStyle}>Source</div>
              <Badge>{statusLabel(lead.source)}</Badge>
            </div>
            <div>
              <div style={infoLabelStyle}>Date Received</div>
              <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>
                {formatDate(lead.dateReceived)}
              </div>
            </div>
            <div>
              <div style={infoLabelStyle}>Next Step</div>
              <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>
                {lead.nextStep || 'Not Set'}
              </div>
            </div>
          </div>

          {/* LinkedIn */}
          {lead.linkedinUrl && (
            <div style={{
              marginBottom: 10, fontSize: 13, padding: '10px 14px',
              background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`,
            }}>
              <span style={{ color: colors.textSecondary, fontWeight: 600 }}>LinkedIn: </span>
              <a href={lead.linkedinUrl} target="_blank" rel="noreferrer"
                style={{ color: colors.info, textDecoration: 'none' }}>
                {lead.linkedinUrl}
              </a>
            </div>
          )}

          {/* Their Message */}
          {lead.message && (
            <div style={{ marginBottom: 16, marginTop: 10 }}>
              <div style={infoLabelStyle}>Their Message</div>
              <div style={{
                fontSize: 13, color: colors.textPrimary, lineHeight: 1.6,
                background: colors.bg, padding: 14, borderRadius: radius.md,
                border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap',
              }}>
                {lead.message}
              </div>
            </div>
          )}

          {/* Your Response */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 8,
            }}>
              <div style={infoLabelStyle}>Your Response</div>
              {!editingResponse && (
                <Btn variant="ghost" size="sm" onClick={() => {
                  setResponseText(lead.response);
                  setEditingResponse(true);
                }}>
                  <EditIcon size={12} /> Edit
                </Btn>
              )}
            </div>
            {editingResponse ? (
              <div>
                <TextArea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response..."
                  style={{ minHeight: 80, marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" size="sm" onClick={() => setEditingResponse(false)}>Cancel</Btn>
                  <Btn size="sm" onClick={saveResponse}>Save Response</Btn>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: 13, color: lead.response ? colors.textPrimary : colors.textMuted,
                lineHeight: 1.6, background: colors.bg, padding: 14, borderRadius: radius.md,
                border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap',
                fontStyle: lead.response ? 'normal' : 'italic',
              }}>
                {lead.response || 'No response written yet. Click Edit to add one.'}
              </div>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div style={{ marginBottom: 20 }}>
              <div style={infoLabelStyle}>Notes</div>
              <div style={{
                fontSize: 13, color: colors.textPrimary, lineHeight: 1.6,
                background: colors.bg, padding: 14, borderRadius: radius.md,
                border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap',
              }}>
                {lead.notes}
              </div>
            </div>
          )}

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
                    <option value="they_replied">They Replied</option>
                    <option value="follow_up">Follow-Up</option>
                    <option value="call_scheduled">Call Scheduled</option>
                    <option value="call_completed">Call Completed</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="meeting">Meeting</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="note">Note</option>
                    <option value="feedback">Feedback</option>
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
            {[...lead.activities].reverse().map((a) => (
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
            {lead.activities.length === 0 && (
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
              Delete this lead permanently?
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
