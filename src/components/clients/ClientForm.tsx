import React, { useState } from 'react';
import { Field, Input, Select, TextArea, Btn, Badge } from '../shared/FormElements';
import { XIcon, PlusIcon } from '../shared/Icons';
import { genId, today, now } from '../../utils/helpers';
import { colors } from '../../utils/theme';
import type { Client, ClientStatus } from '../../types';

interface Props {
  client: Client | null;
  onSave: (c: Client) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<Props> = ({ client, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: client?.name || '',
    company: client?.company || '',
    linkedinUrl: client?.linkedinUrl || '',
    retainer: client?.retainer?.toString() || '',
    startDate: client?.startDate || today(),
    status: client?.status || 'active' as ClientStatus,
    postingSchedule: client?.postingSchedule || '',
    notes: client?.notes || '',
    churnReason: client?.churnReason || '',
  });
  const [pillars, setPillars] = useState<string[]>(client?.pillars || []);
  const [newPillar, setNewPillar] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.company.trim();

  const addPillar = () => {
    if (newPillar.trim() && !pillars.includes(newPillar.trim())) {
      setPillars([...pillars, newPillar.trim()]);
      setNewPillar('');
    }
  };

  const handleSubmit = () => {
    if (!valid) return;
    const c: Client = {
      id: client?.id || genId(),
      name: form.name.trim(),
      company: form.company.trim(),
      linkedinUrl: form.linkedinUrl,
      retainer: parseFloat(form.retainer) || 0,
      status: form.status,
      startDate: form.startDate,
      churnDate: form.status === 'churned' ? (client?.churnDate || today()) : null,
      churnReason: form.status === 'churned' ? form.churnReason : null,
      pillars,
      postingSchedule: form.postingSchedule,
      notes: form.notes,
      activities: client?.activities || [],
      createdAt: client?.createdAt || now(),
      updatedAt: now(),
    };
    onSave(c);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Name" required><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Company" required><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
      </div>
      <Field label="LinkedIn URL"><Input value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Monthly Retainer"><Input value={form.retainer} onChange={(e) => set('retainer', e.target.value)} type="number" placeholder="3000" /></Field>
        <Field label="Start Date"><Input value={form.startDate} onChange={(e) => set('startDate', e.target.value)} type="date" /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="churned">Churned</option>
          </Select>
        </Field>
      </div>

      {form.status === 'churned' && (
        <Field label="Churn Reason">
          <Select value={form.churnReason} onChange={(e) => set('churnReason', e.target.value)}>
            <option value="">Select reason</option>
            <option value="budget">Budget</option>
            <option value="results">Results</option>
            <option value="fit">Fit</option>
            <option value="in_house">Went In-house</option>
            <option value="competitor">Competitor</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      )}

      {/* Content Pillars */}
      <Field label="Content Pillars">
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {pillars.map((p) => (
            <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, fontSize: 12, background: colors.accent + '22', color: colors.accent }}>
              {p}
              <button onClick={() => setPillars(pillars.filter((x) => x !== p))} style={{ background: 'none', border: 'none', color: colors.accent, cursor: 'pointer', padding: 0, fontSize: 14 }}>&times;</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value={newPillar} onChange={(e) => setNewPillar(e.target.value)} placeholder="Add pillar..."
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPillar(); } }} style={{ flex: 1 }} />
          <Btn variant="secondary" size="sm" onClick={addPillar}><PlusIcon size={12} /></Btn>
        </div>
      </Field>

      <Field label="Posting Schedule"><Input value={form.postingSchedule} onChange={(e) => set('postingSchedule', e.target.value)} placeholder="Mon, Wed, Fri" /></Field>
      <Field label="Notes"><TextArea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={handleSubmit}>{client ? 'Update' : 'Add'} Client</Btn>
      </div>
    </div>
  );
};
