import React, { useState } from 'react';
import { useApp } from '../../hooks/AppContext';
import { colors } from '../../utils/theme';
import { Card, Btn, Field, Input } from '../shared/FormElements';
import { DownloadIcon, UploadIcon, TrashIcon } from '../shared/Icons';
import { exportAllData, importAllData, clearAllStorage } from '../../utils/storage';
import type { Settings as SettingsType } from '../../types';

export const SettingsSection: React.FC = () => {
  const { settings, setSettings, toast, loadSampleData } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  const set = (key: keyof SettingsType, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const setGoal = (key: keyof SettingsType['goals'], value: string) => {
    setSettings((s) => ({ ...s, goals: { ...s.goals, [key]: parseInt(value) || 0 } }));
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-command-center-${new Date().toISOString().split('T')[0]}.json`;
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
          toast('Data imported. Refresh to see changes.');
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

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Profile */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Profile</h3>
        <Field label="Your Name"><Input value={settings.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="LinkedIn URL"><Input value={settings.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} /></Field>
        <Field label="Email"><Input value={settings.email} onChange={(e) => set('email', e.target.value)} type="email" /></Field>
        <Field label="Currency"><Input value={settings.currency} onChange={(e) => set('currency', e.target.value)} placeholder="USD" /></Field>
      </Card>

      {/* Goals */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Monthly Goals</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="MRR Goal"><Input type="number" value={settings.goals.monthlyMrr} onChange={(e) => setGoal('monthlyMrr', e.target.value)} /></Field>
          <Field label="New Clients Goal"><Input type="number" value={settings.goals.monthlyNewClients} onChange={(e) => setGoal('monthlyNewClients', e.target.value)} /></Field>
          <Field label="Weekly DMs Goal"><Input type="number" value={settings.goals.weeklyDms} onChange={(e) => setGoal('weeklyDms', e.target.value)} /></Field>
          <Field label="Weekly Posts Goal"><Input type="number" value={settings.goals.weeklyPosts} onChange={(e) => setGoal('weeklyPosts', e.target.value)} /></Field>
          <Field label="Monthly Impressions Goal"><Input type="number" value={settings.goals.monthlyImpressions} onChange={(e) => setGoal('monthlyImpressions', e.target.value)} /></Field>
        </div>
      </Card>

      {/* Data Management */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Data Management</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Btn variant="secondary" onClick={handleExport} style={{ justifyContent: 'flex-start' }}><DownloadIcon size={14} /> Export All Data (JSON)</Btn>
          <Btn variant="secondary" onClick={handleImport} style={{ justifyContent: 'flex-start' }}><UploadIcon size={14} /> Import Data (JSON)</Btn>
          <Btn variant="secondary" onClick={loadSampleData} style={{ justifyContent: 'flex-start' }}>Load Sample Data</Btn>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
            {!confirmClear ? (
              <Btn variant="danger" onClick={() => setConfirmClear(true)}><TrashIcon size={14} /> Clear All Data</Btn>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: colors.error }}>Are you sure? This cannot be undone.</span>
                <Btn variant="danger" size="sm" onClick={handleClear}>Yes, Clear</Btn>
                <Btn variant="secondary" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Btn>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
