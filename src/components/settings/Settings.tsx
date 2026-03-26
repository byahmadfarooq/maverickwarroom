import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, Btn, Field, Input, SectionHeader } from '../shared/FormElements';
import { DownloadIcon, UploadIcon, TrashIcon, DollarIcon, TargetIcon, UsersIcon } from '../shared/Icons';
import { exportAllData, importAllData, clearAllStorage } from '../../utils/storage';
import type { Settings as SettingsType } from '../../types';

const SectionCard: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <Card style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      {icon && <span style={{ color: colors.accent }}>{icon}</span>}
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{title}</h3>
    </div>
    {children}
  </Card>
);

export const SettingsSection: React.FC = () => {
  const { settings, setSettings, toast, loadSampleData } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const setGoal = (key: keyof SettingsType['goals'], value: string) => {
    setSettings((s) => ({ ...s, goals: { ...s.goals, [key]: parseInt(value) || 0 } }));
  };

  const setFinance = (key: keyof SettingsType['finance'], value: string) => {
    setSettings((s) => ({ ...s, finance: { ...s.finance, [key]: parseFloat(value) || 0 } }));
  };

  const handleSave = () => {
    setSaved(true);
    toast('Settings saved');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maverick-war-room-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (importAllData(result)) {
          toast('Data imported. Refreshing...');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast('Import failed. Invalid file.', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    clearAllStorage();
    toast('All data cleared. Refreshing...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const pkrPreview = Math.round(1000 * settings.finance.exchangeRate).toLocaleString();

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHeader
        title="Settings"
        subtitle="Configure your profile, goals, and financial parameters"
        actions={
          <Btn onClick={handleSave} style={saved ? { background: colors.success } : {}}>
            {saved ? '✓ Saved' : 'Save Settings'}
          </Btn>
        }
      />

      {/* Profile */}
      <SectionCard title="Profile" icon={<UsersIcon size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Your Name">
            <Input value={settings.name} onChange={(e) => set('name', e.target.value)} placeholder="Ahmad Farooq" />
          </Field>
          <Field label="Email">
            <Input value={settings.email} onChange={(e) => set('email', e.target.value)} type="email" placeholder="you@email.com" />
          </Field>
        </div>
        <Field label="LinkedIn URL">
          <Input value={settings.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
        </Field>
      </SectionCard>

      {/* Finance */}
      <SectionCard title="Finance & Currency" icon={<DollarIcon size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Hourly Rate (USD)">
            <Input
              type="number" min="0" step="5"
              value={settings.finance.hourlyRate}
              onChange={(e) => setFinance('hourlyRate', e.target.value)}
              placeholder="75"
            />
          </Field>
          <Field label="Total CAC Spend (USD)">
            <Input
              type="number" min="0"
              value={settings.finance.cacTotal}
              onChange={(e) => setFinance('cacTotal', e.target.value)}
              placeholder="500"
            />
          </Field>
        </div>

        <Field label="USD → PKR Exchange Rate">
          <Input
            type="number" min="1" step="1"
            value={settings.finance.exchangeRate}
            onChange={(e) => setFinance('exchangeRate', e.target.value)}
            placeholder="278"
          />
        </Field>
        <div style={{
          marginTop: 8, padding: '10px 14px',
          background: colors.accentMuted, borderRadius: radius.md,
          fontSize: 13, color: colors.textSecondary,
        }}>
          Live preview: <strong style={{ color: colors.textPrimary }}>$1,000</strong> USD = <strong style={{ color: colors.accent }}>PKR {pkrPreview}</strong>
        </div>
      </SectionCard>

      {/* Goals */}
      <SectionCard title="Monthly Goals" icon={<TargetIcon size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="MRR Target ($)">
            <Input type="number" value={settings.goals.monthlyMrr} onChange={(e) => setGoal('monthlyMrr', e.target.value)} />
          </Field>
          <Field label="New Clients / Month">
            <Input type="number" value={settings.goals.monthlyNewClients} onChange={(e) => setGoal('monthlyNewClients', e.target.value)} />
          </Field>
          <Field label="DMs / Week">
            <Input type="number" value={settings.goals.weeklyDms} onChange={(e) => setGoal('weeklyDms', e.target.value)} />
          </Field>
          <Field label="Posts / Week">
            <Input type="number" value={settings.goals.weeklyPosts} onChange={(e) => setGoal('weeklyPosts', e.target.value)} />
          </Field>
          <Field label="Monthly Impressions">
            <Input type="number" value={settings.goals.monthlyImpressions} onChange={(e) => setGoal('monthlyImpressions', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* Data Management */}
      <SectionCard title="Data Management">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="secondary" onClick={handleExport} style={{ justifyContent: 'flex-start' }}>
            <DownloadIcon size={14} /> Export All Data (JSON)
          </Btn>
          <Btn variant="secondary" onClick={handleImport} style={{ justifyContent: 'flex-start' }}>
            <UploadIcon size={14} /> Import Data (JSON)
          </Btn>
          <Btn variant="secondary" onClick={loadSampleData} style={{ justifyContent: 'flex-start' }}>
            Load Sample Data
          </Btn>

          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, marginTop: 4 }}>
            {!confirmClear ? (
              <Btn variant="danger" onClick={() => setConfirmClear(true)}>
                <TrashIcon size={14} /> Clear All Data
              </Btn>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: colors.error }}>This will delete everything. Cannot be undone.</span>
                <Btn variant="danger" size="sm" onClick={handleClear}>Yes, Delete All</Btn>
                <Btn variant="secondary" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Btn>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <div style={{ textAlign: 'right' }}>
        <Btn onClick={handleSave} size="lg" style={saved ? { background: colors.success } : {}}>
          {saved ? '✓ Settings Saved' : 'Save All Settings'}
        </Btn>
      </div>
    </div>
  );
};
