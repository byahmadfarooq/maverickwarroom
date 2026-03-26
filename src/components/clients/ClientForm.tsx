import React, { useState } from 'react';
import { Field, Input, Select, TextArea, Btn, Badge } from '../shared/FormElements';
import { XIcon, PlusIcon, ChevronDownIcon } from '../shared/Icons';
import { genId, today, now } from '../../utils/helpers';
import { colors, radius } from '../../utils/theme';
import type { Client, ClientStatus, BillingType, KnowledgeGraph, KeyContact } from '../../types';

interface Props {
  client: Client | null;
  onSave: (c: Client) => void;
  onCancel: () => void;
}

const emptyKG: KnowledgeGraph = {
  targetDemographics: '',
  competitors: [],
  leadSource: '',
  brandVoice: '',
  techStack: [],
  keyContacts: [],
  industryNotes: '',
  contentGoals: '',
  idealCustomerProfile: '',
  tonePreferences: '',
  painPoints: '',
  uniqueSellingPoints: '',
};

const emptyContact: KeyContact = { name: '', role: '', email: '', phone: '' };

const tagStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 10px', borderRadius: radius.full,
  fontSize: 12, fontWeight: 600, background: colors.accent + '18',
  color: colors.accent, letterSpacing: 0.3,
};

const tagRemoveStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: colors.accent,
  cursor: 'pointer', padding: 0, fontSize: 15, lineHeight: 1,
  display: 'flex', alignItems: 'center',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', marginTop: 20, marginBottom: 12,
  borderBottom: `1px solid ${colors.border}`, cursor: 'pointer',
  userSelect: 'none',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: colors.textPrimary,
  textTransform: 'uppercase', letterSpacing: 0.8,
};

const toggleContainerStyle: React.CSSProperties = {
  display: 'flex', borderRadius: radius.md, overflow: 'hidden',
  border: `1px solid ${colors.border}`, marginBottom: 14,
};

const toggleBtnBase: React.CSSProperties = {
  flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  transition: 'all 0.2s ease', textAlign: 'center',
};

export const ClientForm: React.FC<Props> = ({ client, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: client?.name || '',
    company: client?.company || '',
    linkedinUrl: client?.linkedinUrl || '',
    email: client?.email || '',
    billingType: client?.billingType || 'retainer' as BillingType,
    retainer: client?.retainer?.toString() || '',
    projectValue: client?.projectValue?.toString() || '',
    startDate: client?.startDate || today(),
    status: client?.status || 'active' as ClientStatus,
    postingSchedule: client?.postingSchedule || '',
    notes: client?.notes || '',
    churnReason: client?.churnReason || '',
  });

  const [pillars, setPillars] = useState<string[]>(client?.pillars || []);
  const [newPillar, setNewPillar] = useState('');
  const [kg, setKg] = useState<KnowledgeGraph>(client?.knowledgeGraph || { ...emptyKG });
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newTech, setNewTech] = useState('');
  const [kgOpen, setKgOpen] = useState(false);
  const [credOpen, setCredOpen] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setKgField = (k: keyof KnowledgeGraph, v: any) => setKg((prev) => ({ ...prev, [k]: v }));
  const valid = form.name.trim() && form.company.trim();

  // Tag input helpers
  const addPillar = () => {
    const val = newPillar.trim();
    if (val && !pillars.includes(val)) {
      setPillars([...pillars, val]);
      setNewPillar('');
    }
  };

  const addCompetitor = () => {
    const val = newCompetitor.trim();
    if (val && !kg.competitors.includes(val)) {
      setKgField('competitors', [...kg.competitors, val]);
      setNewCompetitor('');
    }
  };

  const addTech = () => {
    const val = newTech.trim();
    if (val && !kg.techStack.includes(val)) {
      setKgField('techStack', [...kg.techStack, val]);
      setNewTech('');
    }
  };

  const addContact = () => {
    setKgField('keyContacts', [...kg.keyContacts, { ...emptyContact }]);
  };

  const updateContact = (idx: number, field: keyof KeyContact, value: string) => {
    const updated = kg.keyContacts.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    setKgField('keyContacts', updated);
  };

  const removeContact = (idx: number) => {
    setKgField('keyContacts', kg.keyContacts.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!valid) return;
    const c: Client = {
      id: client?.id || genId(),
      name: form.name.trim(),
      company: form.company.trim(),
      linkedinUrl: form.linkedinUrl,
      email: form.email,
      billingType: form.billingType,
      retainer: form.billingType === 'retainer' ? (parseFloat(form.retainer) || 0) : 0,
      projectValue: form.billingType === 'one_time' ? (parseFloat(form.projectValue) || 0) : 0,
      status: form.status,
      startDate: form.startDate,
      churnDate: form.status === 'churned' ? (client?.churnDate || today()) : null,
      churnReason: form.status === 'churned' ? form.churnReason : null,
      pillars,
      postingSchedule: form.postingSchedule,
      notes: form.notes,
      knowledgeGraph: kg,
      activities: client?.activities || [],
      createdAt: client?.createdAt || now(),
      updatedAt: now(),
    };
    onSave(c);
  };

  const TagInput: React.FC<{
    tags: string[];
    onRemove: (tag: string) => void;
    value: string;
    onChange: (v: string) => void;
    onAdd: () => void;
    placeholder?: string;
  }> = ({ tags, onRemove, value, onChange, onAdd, placeholder }) => (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {tags.map((t) => (
            <span key={t} style={tagStyle}>
              {t}
              <button onClick={() => onRemove(t)} style={tagRemoveStyle}>&times;</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Type and press Enter...'}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          style={{ flex: 1 }}
        />
        <Btn variant="secondary" size="sm" onClick={onAdd} type="button">
          <PlusIcon size={12} />
        </Btn>
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Basic Info ── */}
      <div style={sectionHeaderStyle} onClick={() => {}}>
        <span style={sectionTitleStyle}>Basic Info</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Client name" />
        </Field>
        <Field label="Company" required>
          <Input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Company name" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="LinkedIn URL">
          <Input value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
        </Field>
        <Field label="Email">
          <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="client@company.com" type="email" />
        </Field>
      </div>

      {/* ── Billing ── */}
      <div style={sectionHeaderStyle} onClick={() => {}}>
        <span style={sectionTitleStyle}>Billing</span>
      </div>

      {/* Billing Type Toggle */}
      <div style={toggleContainerStyle}>
        <button
          type="button"
          onClick={() => set('billingType', 'retainer')}
          style={{
            ...toggleBtnBase,
            background: form.billingType === 'retainer' ? colors.accent : colors.bg,
            color: form.billingType === 'retainer' ? '#fff' : colors.textSecondary,
          }}
        >
          Monthly Retainer
        </button>
        <button
          type="button"
          onClick={() => set('billingType', 'one_time')}
          style={{
            ...toggleBtnBase,
            background: form.billingType === 'one_time' ? colors.accent : colors.bg,
            color: form.billingType === 'one_time' ? '#fff' : colors.textSecondary,
          }}
        >
          One-Time Project
        </button>
      </div>

      {form.billingType === 'retainer' ? (
        <Field label="Monthly Retainer ($)">
          <Input
            value={form.retainer}
            onChange={(e) => set('retainer', e.target.value)}
            type="number"
            placeholder="3000"
          />
        </Field>
      ) : (
        <Field label="Project Value ($)">
          <Input
            value={form.projectValue}
            onChange={(e) => set('projectValue', e.target.value)}
            type="number"
            placeholder="5000"
          />
        </Field>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Start Date">
          <Input value={form.startDate} onChange={(e) => set('startDate', e.target.value)} type="date" />
        </Field>
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
            <option value="">Select Reason</option>
            <option value="budget">Budget</option>
            <option value="results">Results</option>
            <option value="fit">Fit</option>
            <option value="in_house">Went In-House</option>
            <option value="competitor">Competitor</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      )}

      {/* ── Content ── */}
      <div style={sectionHeaderStyle} onClick={() => {}}>
        <span style={sectionTitleStyle}>Content</span>
      </div>

      <Field label="Content Pillars">
        <TagInput
          tags={pillars}
          onRemove={(t) => setPillars(pillars.filter((x) => x !== t))}
          value={newPillar}
          onChange={setNewPillar}
          onAdd={addPillar}
          placeholder="Add pillar..."
        />
      </Field>

      <Field label="Posting Schedule">
        <Input
          value={form.postingSchedule}
          onChange={(e) => set('postingSchedule', e.target.value)}
          placeholder="Mon, Wed, Fri"
        />
      </Field>

      {/* ── Knowledge Graph (Collapsible) ── */}
      <div style={sectionHeaderStyle} onClick={() => setKgOpen(!kgOpen)}>
        <span style={sectionTitleStyle}>Knowledge Graph</span>
        <ChevronDownIcon
          size={16}
          style={{
            color: colors.textSecondary,
            transition: 'transform 0.2s',
            transform: kgOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {kgOpen && (
        <div>
          <Field label="Target Demographics">
            <TextArea
              value={kg.targetDemographics}
              onChange={(e) => setKgField('targetDemographics', e.target.value)}
              placeholder="Describe the target audience..."
            />
          </Field>

          <Field label="Client Competitors">
            <TagInput
              tags={kg.competitors}
              onRemove={(t) => setKgField('competitors', kg.competitors.filter((x) => x !== t))}
              value={newCompetitor}
              onChange={setNewCompetitor}
              onAdd={addCompetitor}
              placeholder="Add competitor..."
            />
          </Field>

          <Field label="Lead Source">
            <Input
              value={kg.leadSource}
              onChange={(e) => setKgField('leadSource', e.target.value)}
              placeholder="How did they find you?"
            />
          </Field>

          <Field label="Brand Voice Guidelines">
            <TextArea
              value={kg.brandVoice}
              onChange={(e) => setKgField('brandVoice', e.target.value)}
              placeholder="Describe brand voice and tone..."
            />
          </Field>

          <Field label="Tech Stack">
            <TagInput
              tags={kg.techStack}
              onRemove={(t) => setKgField('techStack', kg.techStack.filter((x) => x !== t))}
              value={newTech}
              onChange={setNewTech}
              onAdd={addTech}
              placeholder="Add technology..."
            />
          </Field>

          <Field label="Content Goals">
            <TextArea
              value={kg.contentGoals}
              onChange={(e) => setKgField('contentGoals', e.target.value)}
              placeholder="What does the client want to achieve with content?"
            />
          </Field>

          <Field label="Ideal Customer Profile">
            <TextArea
              value={kg.idealCustomerProfile}
              onChange={(e) => setKgField('idealCustomerProfile', e.target.value)}
              placeholder="Describe the ideal customer..."
            />
          </Field>

          <Field label="Tone Preferences">
            <Input
              value={kg.tonePreferences}
              onChange={(e) => setKgField('tonePreferences', e.target.value)}
              placeholder="Professional, casual, authoritative..."
            />
          </Field>

          <Field label="Pain Points">
            <TextArea
              value={kg.painPoints}
              onChange={(e) => setKgField('painPoints', e.target.value)}
              placeholder="What challenges does the client's audience face?"
            />
          </Field>

          <Field label="Unique Selling Points">
            <TextArea
              value={kg.uniqueSellingPoints}
              onChange={(e) => setKgField('uniqueSellingPoints', e.target.value)}
              placeholder="What makes the client stand out?"
            />
          </Field>

          <Field label="Industry Notes">
            <TextArea
              value={kg.industryNotes}
              onChange={(e) => setKgField('industryNotes', e.target.value)}
              placeholder="Relevant industry insights..."
            />
          </Field>

          {/* Key Contacts */}
          <div style={{ marginTop: 16, marginBottom: 14 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 10,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: colors.textSecondary,
                textTransform: 'uppercase', letterSpacing: 0.8,
              }}>
                Key Contacts
              </span>
              <Btn variant="secondary" size="sm" onClick={addContact} type="button">
                <PlusIcon size={12} /> Add Contact
              </Btn>
            </div>

            {kg.keyContacts.map((contact, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  gap: 8, marginBottom: 8, alignItems: 'end',
                }}
              >
                <Field label={idx === 0 ? 'Name' : ''} style={{ marginBottom: 0 }}>
                  <Input
                    value={contact.name}
                    onChange={(e) => updateContact(idx, 'name', e.target.value)}
                    placeholder="Name"
                  />
                </Field>
                <Field label={idx === 0 ? 'Role' : ''} style={{ marginBottom: 0 }}>
                  <Input
                    value={contact.role}
                    onChange={(e) => updateContact(idx, 'role', e.target.value)}
                    placeholder="Role"
                  />
                </Field>
                <Field label={idx === 0 ? 'Email' : ''} style={{ marginBottom: 0 }}>
                  <Input
                    value={contact.email}
                    onChange={(e) => updateContact(idx, 'email', e.target.value)}
                    placeholder="Email"
                  />
                </Field>
                <Field label={idx === 0 ? 'Phone' : ''} style={{ marginBottom: 0 }}>
                  <Input
                    value={contact.phone}
                    onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                    placeholder="Phone"
                  />
                </Field>
                <button
                  onClick={() => removeContact(idx)}
                  type="button"
                  style={{
                    background: 'none', border: 'none', color: colors.error,
                    cursor: 'pointer', padding: 8, marginBottom: 2,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}

            {kg.keyContacts.length === 0 && (
              <div style={{
                fontSize: 12, color: colors.textMuted, padding: '8px 0',
              }}>
                No key contacts added yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Account Credentials / Notes (Collapsible) ── */}
      <div style={sectionHeaderStyle} onClick={() => setCredOpen(!credOpen)}>
        <span style={sectionTitleStyle}>Account Credentials &amp; Notes</span>
        <ChevronDownIcon
          size={16}
          style={{
            color: colors.textSecondary,
            transition: 'transform 0.2s',
            transform: credOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {credOpen && (
        <Field label="Notes">
          <TextArea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Account management notes, credentials, login info..."
            style={{ minHeight: 120 }}
          />
        </Field>
      )}

      {/* ── Actions ── */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'flex-end',
        marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.border}`,
      }}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={handleSubmit}>
          {client ? 'Update Client' : 'Add Client'}
        </Btn>
      </div>
    </div>
  );
};
