import React, { useState } from 'react';
import { colors } from '../../utils/theme';
import { Btn, Badge, Field, Select, Input, TextArea, StatusBadge } from '../shared/FormElements';
import { XIcon, EditIcon, TrashIcon, PlusIcon } from '../shared/Icons';
import { genId, today, formatDate } from '../../utils/helpers';
import type { InboundLead, Activity } from '../../types';

interface Props {
  lead: InboundLead;
  onClose: () => void;
  onUpdate: (updates: Partial<InboundLead>) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const InboundDetail: React.FC<Props> = ({ lead, onClose, onUpdate, onEdit, onDelete }) => {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actType, setActType] = useState<Activity['type']>('note');
  const [actDate, setActDate] = useState(today());
  const [actNotes, setActNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addActivity = () => {
    const activity: Activity = { id: genId(), date: actDate, type: actType, notes: actNotes };
    onUpdate({ activities: [...lead.activities, activity], lastActionDate: actDate });
    setShowAddActivity(false);
    setActNotes('');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 480, maxWidth: '100vw', height: '100vh',
      background: colors.surface, borderLeft: `1px solid ${colors.border}`, zIndex: 999,
      display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: colors.textPrimary }}>{lead.name}</h3>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>{lead.company}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn variant="ghost" size="sm" onClick={onEdit}><EditIcon size={14} /></Btn>
          <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}><TrashIcon size={14} /></Btn>
          <Btn variant="ghost" size="sm" onClick={onClose}><XIcon size={14} /></Btn>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div><div style={{ fontSize: 11, color: colors.textSecondary }}>STATUS</div><StatusBadge status={lead.status} /></div>
          <div><div style={{ fontSize: 11, color: colors.textSecondary }}>SOURCE</div><Badge>{lead.source.replace(/_/g, ' ')}</Badge></div>
          <div><div style={{ fontSize: 11, color: colors.textSecondary }}>RECEIVED</div><div style={{ fontSize: 13, color: colors.textPrimary }}>{formatDate(lead.dateReceived)}</div></div>
          <div><div style={{ fontSize: 11, color: colors.textSecondary }}>NEXT STEP</div><div style={{ fontSize: 13, color: colors.textPrimary }}>{lead.nextStep || 'None'}</div></div>
        </div>

        {lead.message && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>THEIR MESSAGE</div>
            <div style={{ fontSize: 13, color: colors.textPrimary, background: colors.bg, padding: 12, borderRadius: 6 }}>{lead.message}</div>
          </div>
        )}
        {lead.response && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>YOUR RESPONSE</div>
            <div style={{ fontSize: 13, color: colors.textPrimary, background: colors.bg, padding: 12, borderRadius: 6 }}>{lead.response}</div>
          </div>
        )}

        <Field label="Update Response">
          <TextArea value={lead.response} onChange={(e) => onUpdate({ response: e.target.value })} placeholder="Your response..." style={{ minHeight: 60 }} />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 16 }}>
          <h4 style={{ margin: 0, fontSize: 13, color: colors.textSecondary, fontWeight: 600 }}>ACTIVITY LOG</h4>
          <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(!showAddActivity)}><PlusIcon size={12} /> Log Activity</Btn>
        </div>

        {showAddActivity && (
          <div style={{ background: colors.bg, padding: 12, borderRadius: 6, marginBottom: 12, border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Type">
                <Select value={actType} onChange={(e) => setActType(e.target.value as Activity['type'])}>
                  <option value="they_replied">They Replied</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="call_scheduled">Call Scheduled</option>
                  <option value="call_completed">Call Completed</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="note">Note</option>
                </Select>
              </Field>
              <Field label="Date"><Input type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} /></Field>
            </div>
            <Field label="Notes"><TextArea value={actNotes} onChange={(e) => setActNotes(e.target.value)} style={{ minHeight: 60 }} /></Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" size="sm" onClick={() => setShowAddActivity(false)}>Cancel</Btn>
              <Btn size="sm" onClick={addActivity}>Add</Btn>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...lead.activities].reverse().map((a) => (
            <div key={a.id} style={{ padding: '8px 12px', background: colors.bg, borderRadius: 6, border: `1px solid ${colors.border}`, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <StatusBadge status={a.type} />
                <span style={{ color: colors.textSecondary, fontSize: 11 }}>{formatDate(a.date)}</span>
              </div>
              {a.notes && <div style={{ color: colors.textPrimary, marginTop: 4 }}>{a.notes}</div>}
            </div>
          ))}
          {lead.activities.length === 0 && <div style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13, padding: 20 }}>No activity logged yet</div>}
        </div>
      </div>

      {confirmDelete && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, background: colors.bg, borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: colors.error }}>Delete this lead?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
            <Btn variant="danger" size="sm" onClick={onDelete}>Delete</Btn>
          </div>
        </div>
      )}
    </div>
  );
};
