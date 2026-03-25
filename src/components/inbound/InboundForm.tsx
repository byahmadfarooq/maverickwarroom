import React, { useState } from 'react';
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
    source: lead?.source || 'dm' as InboundSource,
    sourcePostId: lead?.sourcePostId || '',
    message: lead?.message || '',
    status: lead?.status || 'new' as InboundStatus,
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
      linkedinUrl: form.linkedinUrl,
      source: form.source,
      sourcePostId: form.sourcePostId || null,
      message: form.message,
      status: form.status,
      response: lead?.response || '',
      activities: lead?.activities || [],
      dateReceived: lead?.dateReceived || today(),
      lastActionDate: lead?.lastActionDate || today(),
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Name" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Company" required><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
      </div>
      <Field label="LinkedIn URL"><Input value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} /></Field>
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
            {publishedPosts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Their Message"><TextArea value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="What they said..." /></Field>
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
        <Field label="Next Step"><Input value={form.nextStep} onChange={(e) => set('nextStep', e.target.value)} placeholder="Reply, call, etc." /></Field>
      </div>
      <Field label="Notes"><TextArea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={handleSubmit}>{lead ? 'Update' : 'Add'} Lead</Btn>
      </div>
    </div>
  );
};
