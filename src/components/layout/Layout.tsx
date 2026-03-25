import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { colors } from '../../utils/theme';
import { useApp } from '../../hooks/AppContext';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  outbound: 'Outbound Tracker',
  inbound: 'Inbound Tracker',
  clients: 'Clients',
  content: 'Content Calendar',
  posts: 'Post Performance',
  analytics: 'Analytics',
  settings: 'Settings',
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { activeSection, toasts } = useApp();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.textPrimary, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          padding: '12px 24px', borderBottom: `1px solid ${colors.border}`,
          background: colors.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          minHeight: 56,
        }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{sectionTitles[activeSection]}</h1>
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {children}
        </div>
      </main>

      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: t.type === 'success' ? colors.success : t.type === 'error' ? colors.error : colors.info,
            color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.2s ease',
          }}>{t.message}</div>
        ))}
      </div>
    </div>
  );
};
