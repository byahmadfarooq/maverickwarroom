import React, { useState } from 'react';
import { colors, radius } from '../../utils/theme';
import { Field, Input, Select, TextArea, Btn } from '../shared/FormElements';
import { genId, today, now } from '../../utils/helpers';
import type { Prospect, ProspectStatus, ProspectSource } from '../../types';

interface Props {
  prospect: Prospect | null;
  onSave: (p: Prospect) => void;
  onCancel: () => void;
}

export const ProspectForm: React.FC<Props> = ({ prospect, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: prospect?.name || '',
    company: prospect?.company || '',
    linkedinUrl: prospect?.linkedinUrl || '',
    email: prospect?.email || '',
    source: prospect?.source || ('cold_outreach' as ProspectSource),
    dealValue: prospect?.dealValue?.toString() || '',
    status: prospect?.status || ('research' as ProspectStatus),
    nextFollowUp: prospect?.nextFollowUp || '',
    notes: prospect?.notes || '',
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const valid = form.name.trim() && form.company.trim();

  const handleSubmit = () => {
    if (!valid) return;
    const p: Prospect = {
      id: prospect?.id || genId(),
      name: form.name.trim(),
      company: form.company.trim(),
      linkedinUrl: form.linkedinUrl.trim(),
      email: form.email.trim(),
      status: form.status,
      source: form.source,
      dealValue: parseFloat(form.dealValue) || 0,
      firstContactDate: prospect?.firstContactDate || today(),
      lastContactDate: prospect?.lastContactDate || today(),
      nextFollowUp: form.nextFollowUp,
      notes: form.notes,
      activities: prospect?.activities || [],
      createdAt: prospect?.createdAt || now(),
      updatedAt: now(),
    };
    onSave(p);
  };

  return (
    <div>
      {/* Row 1: Name + Company */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="John Smith"
            autoFocus
          />
        </Field>
        <Field label="Company" required>
          <Input
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="Acme Inc"
          />
        </Field>
      </div>

      {/* Row 2: LinkedIn + Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="LinkedIn URL">
          <Input
            value={form.linkedinUrl}
            onChange={(e) => set('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </Field>
        <Field label="Email">
          <Input
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="john@example.com"
            type="email"
          />
        </Field>
      </div>

      {/* Row 3: Source + Deal Value + Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Source">
          <Select value={form.source} onChange={(e) => set('source', e.target.value)}>
            <option value="cold_outreach">Cold Outreach</option>
            <option value="referral">Referral</option>
            <option value="inbound">Inbound</option>
            <option value="content_reply">Content Reply</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Deal Value (USD)">
          <Input
            value={form.dealValue}
            onChange={(e) => set('dealValue', e.target.value)}
            type="number"
            placeholder="3000"
            min="0"
          />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="research">Research</option>
            <option value="dm_sent">DM Sent</option>
            <option value="replied">Replied</option>
            <option value="call_booked">Call Booked</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiating">Negotiating</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>
        </Field>
      </div>

      {/* Row 4: Next Follow-up */}
      <Field label="Next Follow-Up">
        <Input
          value={form.nextFollowUp}
          onChange={(e) => set('nextFollowUp', e.target.value)}
          type="date"
        />
      </Field>

      {/* Row 5: Notes */}
      <Field label="Notes">
        <TextArea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any notes about this prospect..."
          style={{ minHeight: 90 }}
        />
      </Field>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20,
        paddingTop: 16, borderTop: `1px solid ${colors.border}`,
      }}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={handleSubmit}>
          {prospect ? 'Update Prospect' : 'Add Prospect'}
        </Btn>
      </div>
    </div>
  );
};
