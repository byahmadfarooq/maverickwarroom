import React, { useState } from 'react';
import { colors, radius } from '../../utils/theme';
import { Field, Input, Select, TextArea, Btn } from '../shared/FormElements';
import { genId, today, now } from '../../utils/helpers';
import type { InboundLead, InboundSource, InboundStatus, Post } from '../../types';

interface Props {
  lead: InboundLead | null;
  posts: Post[];
  onSave: (l: InboundLead) => void;
  onCancel: () => void;
}

export const InboundForm: React.FC<Props> = ({ lead, posts, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: lead?.name || '',
    company: lead?.company || '',
    linkedinUrl: lead?.linkedinUrl || '',
    source: lead?.source || ('dm' as InboundSource),
    sourcePostId: lead?.sourcePostId || '',
    message: lead?.message || '',
    status: lead?.status || ('new' as InboundStatus),
    dealValue: String(lead?.dealValue ?? 0),
    nextFollowUp: lead?.nextFollowUp || '',
    nextStep: lead?.nextStep || '',
    notes: lead?.notes || '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.company.trim();

  const handleSubmit = () => {
    if (!valid) return;
    const l: InboundLead = {
      id: lead?.id || genId(),
      name: form.name.trim(),
      company: form.company.trim(),
      linkedinUrl: form.linkedinUrl.trim(),
      source: form.source,
      sourcePostId: form.sourcePostId || null,
      message: form.message,
      status: form.status,
      response: lead?.response || '',
      activities: lead?.activities || [],
      dealValue: parseInt(form.dealValue) || 0,
      dateReceived: lead?.dateReceived || today(),
      lastActionDate: lead?.lastActionDate || today(),
      nextFollowUp: form.nextFollowUp,
      nextStep: form.nextStep,
      notes: form.notes,
      createdAt: lead?.createdAt || now(),
      updatedAt: now(),
    };
    onSave(l);
  };

  const publishedPosts = posts.filter((p) => p.status === 'published');

  return (
    <div>
      {/* Row 1: Name + Company */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Jane Doe"
            autoFocus
          />
        </Field>
        <Field label="Company" required>
          <Input
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="Startup Co"
          />
        </Field>
      </div>

      {/* Row 2: LinkedIn URL */}
      <Field label="LinkedIn URL">
        <Input
          value={form.linkedinUrl}
          onChange={(e) => set('linkedinUrl', e.target.value)}
          placeholder="https://linkedin.com/in/..."
        />
      </Field>

      {/* Row 3: Source + Source Post */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Source">
          <Select value={form.source} onChange={(e) => set('source', e.target.value)}>
            <option value="post_comment">Post Comment</option>
            <option value="dm">DM</option>
            <option value="connection_request">Connection Request</option>
            <option value="profile_view">Profile View</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Source Post">
          <Select value={form.sourcePostId} onChange={(e) => set('sourcePostId', e.target.value)}>
            <option value="">None</option>
            {publishedPosts.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Row 4: Their Message */}
      <Field label="Their Message">
        <TextArea
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="What they said..."
          style={{ minHeight: 90 }}
        />
      </Field>

      {/* Row 5: Status + Deal Value */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="call_booked">Call Booked</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="not_qualified">Not Qualified</option>
          </Select>
        </Field>
        <Field label="Deal Value (USD)">
          <Input
            type="number" min="0"
            value={form.dealValue}
            onChange={(e) => set('dealValue', e.target.value)}
            placeholder="500"
          />
        </Field>
      </div>

      {/* Row 6: Next Follow-up + Next Step */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Next Follow-up Date">
          <Input
            type="date"
            value={form.nextFollowUp}
            onChange={(e) => set('nextFollowUp', e.target.value)}
          />
        </Field>
        <Field label="Next Step">
          <Input
            value={form.nextStep}
            onChange={(e) => set('nextStep', e.target.value)}
            placeholder="Reply, schedule call, etc."
          />
        </Field>
      </div>

      {/* Row 6: Notes */}
      <Field label="Notes">
        <TextArea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any internal notes..."
          style={{ minHeight: 80 }}
        />
      </Field>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20,
        paddingTop: 16, borderTop: `1px solid ${colors.border}`,
      }}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={handleSubmit}>
          {lead ? 'Update Lead' : 'Add Lead'}
        </Btn>
      </div>
    </div>
  );
};
