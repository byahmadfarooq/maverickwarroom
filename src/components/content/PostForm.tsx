import React, { useState } from 'react';
import { Field, Input, Select, TextArea, Btn } from '../shared/FormElements';
import { colors } from '../../utils/theme';
import { genId, today, now } from '../../utils/helpers';
import type { Post, PostStatus, Client } from '../../types';

interface Props {
  post: Post | null;
  clients: Client[];
  defaultDate: string;
  onSave: (p: Post) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export const PostForm: React.FC<Props> = ({ post, clients, defaultDate, onSave, onDelete, onCancel }) => {
  const selectedClient = post ? clients.find((c) => c.id === post.clientId) : null;

  const [form, setForm] = useState({
    clientId: post?.clientId || (clients[0]?.id || ''),
    title: post?.title || '',
    content: post?.content || '',
    pillar: post?.pillar || '',
    status: post?.status || 'idea' as PostStatus,
    scheduledDate: post?.scheduledDate || defaultDate,
    publishedDate: post?.publishedDate || '',
    impressions: post?.impressions?.toString() || '0',
    reactions: post?.reactions?.toString() || '0',
    comments: post?.comments?.toString() || '0',
    saves: post?.saves?.toString() || '0',
    shares: post?.shares?.toString() || '0',
    profileViews: post?.profileViews?.toString() || '0',
    linkClicks: post?.linkClicks?.toString() || '0',
    dmsFromPost: post?.dmsFromPost?.toString() || '0',
    leadsFromPost: post?.leadsFromPost?.toString() || '0',
    postUrl: post?.postUrl || '',
    notes: post?.notes || '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.clientId && form.title.trim();
  const isPublished = form.status === 'published';

  const currentClient = clients.find((c) => c.id === form.clientId);
  const pillars = currentClient?.pillars || [];

  const handleSubmit = () => {
    if (!valid) return;
    const p: Post = {
      id: post?.id || genId(),
      clientId: form.clientId,
      title: form.title.trim(),
      content: form.content,
      pillar: form.pillar,
      status: form.status,
      scheduledDate: form.scheduledDate,
      publishedDate: isPublished ? (form.publishedDate || form.scheduledDate || today()) : null,
      impressions: parseInt(form.impressions) || 0,
      reactions: parseInt(form.reactions) || 0,
      comments: parseInt(form.comments) || 0,
      saves: parseInt(form.saves) || 0,
      shares: parseInt(form.shares) || 0,
      profileViews: parseInt(form.profileViews) || 0,
      linkClicks: parseInt(form.linkClicks) || 0,
      dmsFromPost: parseInt(form.dmsFromPost) || 0,
      leadsFromPost: parseInt(form.leadsFromPost) || 0,
      postUrl: form.postUrl,
      notes: form.notes,
      trackingLog: post?.trackingLog || [],
      commentLog: post?.commentLog || [],
      dmLog: post?.dmLog || [],
      createdAt: post?.createdAt || now(),
      updatedAt: now(),
    };
    onSave(p);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Client" required>
          <Select value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
            {clients.length === 0 && <option value="">No clients</option>}
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="idea">Idea</option>
            <option value="drafting">Drafting</option>
            <option value="ready">Ready</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </Select>
        </Field>
      </div>
      <Field label="Title" required><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Post title" /></Field>
      <Field label="Content"><TextArea value={form.content} onChange={(e) => set('content', e.target.value)} placeholder="Write your post..." style={{ minHeight: 120 }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Pillar">
          <Select value={form.pillar} onChange={(e) => set('pillar', e.target.value)}>
            <option value="">None</option>
            {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Scheduled Date"><Input type="date" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} /></Field>
        {isPublished && <Field label="Published Date"><Input type="date" value={form.publishedDate} onChange={(e) => set('publishedDate', e.target.value)} /></Field>}
      </div>

      {/* Performance Metrics (only when published) */}
      {isPublished && (
        <div style={{ marginTop: 16, padding: 12, background: colors.bg, borderRadius: 6, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>PERFORMANCE METRICS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <Field label="Impressions"><Input type="number" value={form.impressions} onChange={(e) => set('impressions', e.target.value)} /></Field>
            <Field label="Reactions"><Input type="number" value={form.reactions} onChange={(e) => set('reactions', e.target.value)} /></Field>
            <Field label="Comments"><Input type="number" value={form.comments} onChange={(e) => set('comments', e.target.value)} /></Field>
            <Field label="Saves"><Input type="number" value={form.saves} onChange={(e) => set('saves', e.target.value)} /></Field>
            <Field label="Shares"><Input type="number" value={form.shares} onChange={(e) => set('shares', e.target.value)} /></Field>
            <Field label="Profile Views"><Input type="number" value={form.profileViews} onChange={(e) => set('profileViews', e.target.value)} /></Field>
            <Field label="Link Clicks"><Input type="number" value={form.linkClicks} onChange={(e) => set('linkClicks', e.target.value)} /></Field>
            <Field label="DMs from Post"><Input type="number" value={form.dmsFromPost} onChange={(e) => set('dmsFromPost', e.target.value)} /></Field>
            <Field label="Leads from Post"><Input type="number" value={form.leadsFromPost} onChange={(e) => set('leadsFromPost', e.target.value)} /></Field>
          </div>
          <Field label="Post URL"><Input value={form.postUrl} onChange={(e) => set('postUrl', e.target.value)} placeholder="https://linkedin.com/..." /></Field>
        </div>
      )}

      <Field label="Notes" style={{ marginTop: 12 }}><TextArea value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ minHeight: 60 }} /></Field>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 16 }}>
        <div>{onDelete && <Btn variant="danger" onClick={onDelete}>Delete Post</Btn>}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn disabled={!valid} onClick={handleSubmit}>{post ? 'Update' : 'Create'} Post</Btn>
        </div>
      </div>
    </div>
  );
};
