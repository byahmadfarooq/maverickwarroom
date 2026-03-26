import React, { useState, useContext, useMemo } from 'react';
import { colors, radius } from '../../utils/theme';
import { AppCtx } from '../../hooks/AppContext';
import { genId, now, today, statusLabel } from '../../utils/helpers';
import { Field, Input, TextArea, Select, Btn } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { TrashIcon } from '../shared/Icons';
import type { Post, PostStatus } from '../../types';

const STATUSES: PostStatus[] = ['idea', 'drafting', 'review', 'ready', 'scheduled', 'published'];

interface PostFormProps {
  open: boolean;
  onClose: () => void;
  post: Post | null;
}

export const PostForm: React.FC<PostFormProps> = ({ open, onClose, post }) => {
  const { clients, setPosts, updatePost, deletePost, toast } = useContext(AppCtx);

  const isEdit = post !== null;

  const [form, setForm] = useState<{
    clientId: string;
    title: string;
    content: string;
    pillar: string;
    status: PostStatus;
    scheduledDate: string;
    publishedDate: string;
    impressions: string;
    reactions: string;
    comments: string;
    saves: string;
    shares: string;
    profileViews: string;
    linkClicks: string;
    dmsFromPost: string;
    leadsFromPost: string;
    postUrl: string;
    notes: string;
    imageUrl: string;
  }>(() => ({
    clientId: post?.clientId || 'personal',
    title: post?.title || '',
    content: post?.content || '',
    pillar: post?.pillar || '',
    status: post?.status || 'idea',
    scheduledDate: post?.scheduledDate || today(),
    publishedDate: post?.publishedDate || '',
    impressions: String(post?.impressions ?? 0),
    reactions: String(post?.reactions ?? 0),
    comments: String(post?.comments ?? 0),
    saves: String(post?.saves ?? 0),
    shares: String(post?.shares ?? 0),
    profileViews: String(post?.profileViews ?? 0),
    linkClicks: String(post?.linkClicks ?? 0),
    dmsFromPost: String(post?.dmsFromPost ?? 0),
    leadsFromPost: String(post?.leadsFromPost ?? 0),
    postUrl: post?.postUrl || '',
    notes: post?.notes || '',
    imageUrl: post?.imageUrl || '',
  }));

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const valid = form.title.trim().length > 0;
  const isPublished = form.status === 'published';

  const currentPillars = useMemo(() => {
    if (form.clientId === 'personal') return [];
    const c = clients.find((cl) => cl.id === form.clientId);
    return c?.pillars || [];
  }, [form.clientId, clients]);

  const handleSave = () => {
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
      imageUrl: form.imageUrl,
      trackingLog: post?.trackingLog || [],
      commentLog: post?.commentLog || [],
      dmLog: post?.dmLog || [],
      createdAt: post?.createdAt || now(),
      updatedAt: now(),
    };

    if (isEdit) {
      updatePost(p.id, p);
      toast('Post updated');
    } else {
      setPosts((prev) => [...prev, p]);
      toast('Post created');
    }
    onClose();
  };

  const handleDelete = () => {
    if (post) {
      deletePost(post.id);
      toast('Post deleted');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Post' : 'New Post'} width={620}>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Post title"
            />
          </Field>
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="personal">Personal</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Pillar">
            {currentPillars.length > 0 ? (
              <Select value={form.pillar} onChange={(e) => set('pillar', e.target.value)}>
                <option value="">None</option>
                {currentPillars.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.pillar}
                onChange={(e) => set('pillar', e.target.value)}
                placeholder="Content pillar"
              />
            )}
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value as PostStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Scheduled Date">
            <Input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => set('scheduledDate', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Content">
          <TextArea
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            placeholder="Write your post content..."
            style={{ minHeight: 120 }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Image URL">
            <Input
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Post URL">
            <Input
              value={form.postUrl}
              onChange={(e) => set('postUrl', e.target.value)}
              placeholder="https://linkedin.com/..."
            />
          </Field>
        </div>

        <Field label="Notes">
          <TextArea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Internal notes..."
            style={{ minHeight: 60 }}
          />
        </Field>

        {/* Performance metrics when published */}
        {isPublished && (
          <div style={{
            marginTop: 12,
            padding: 14,
            background: colors.bg,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}>
              Performance Metrics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <Field label="Published Date">
                <Input type="date" value={form.publishedDate} onChange={(e) => set('publishedDate', e.target.value)} />
              </Field>
              <Field label="Impressions">
                <Input type="number" value={form.impressions} onChange={(e) => set('impressions', e.target.value)} />
              </Field>
              <Field label="Reactions">
                <Input type="number" value={form.reactions} onChange={(e) => set('reactions', e.target.value)} />
              </Field>
              <Field label="Comments">
                <Input type="number" value={form.comments} onChange={(e) => set('comments', e.target.value)} />
              </Field>
              <Field label="Saves">
                <Input type="number" value={form.saves} onChange={(e) => set('saves', e.target.value)} />
              </Field>
              <Field label="Shares">
                <Input type="number" value={form.shares} onChange={(e) => set('shares', e.target.value)} />
              </Field>
              <Field label="Profile Views">
                <Input type="number" value={form.profileViews} onChange={(e) => set('profileViews', e.target.value)} />
              </Field>
              <Field label="Link Clicks">
                <Input type="number" value={form.linkClicks} onChange={(e) => set('linkClicks', e.target.value)} />
              </Field>
              <Field label="DMs from Post">
                <Input type="number" value={form.dmsFromPost} onChange={(e) => set('dmsFromPost', e.target.value)} />
              </Field>
            </div>
            <Field label="Leads from Post" style={{ marginTop: 4 }}>
              <Input type="number" value={form.leadsFromPost} onChange={(e) => set('leadsFromPost', e.target.value)} />
            </Field>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>
            {isEdit && (
              <Btn variant="danger" onClick={handleDelete}>
                <TrashIcon size={14} /> Delete
              </Btn>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={!valid}>
              {isEdit ? 'Update' : 'Create'} Post
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
};
