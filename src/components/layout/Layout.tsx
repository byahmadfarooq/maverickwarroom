import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { colors, radius } from '../../utils/theme';
import { useApp } from '../../hooks/AppContext';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  outbound: 'Outbound Tracker',
  inbound: 'Inbound Tracker',
  clients: 'Clients',
  content: 'Content Calendar',
  posts: 'Post Performance',
  analytics: 'Analytics',
  tasks: 'Tasks',
  finance: 'Finance',
  settings: 'Settings',
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { activeSection, toasts } = useApp();

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: colors.bg,
      color: colors.textPrimary,
      fontFamily: 'Inter, sans-serif',
    }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          padding: '0 28px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
          flexShrink: 0,
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: colors.textPrimary,
            letterSpacing: -0.3,
          }}>
            {sectionTitles[activeSection] || 'Dashboard'}
          </h1>
        </header>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 24,
        }}>
          {children}
        </div>
      </main>

      {/* Toast Notification Stack */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => {
          const bgColor =
            t.type === 'success' ? colors.success :
            t.type === 'error' ? colors.error :
            colors.info;
          return (
            <div key={t.id} style={{
              padding: '12px 20px',
              borderRadius: radius.lg,
              fontSize: 13,
              fontWeight: 600,
              background: bgColor,
              color: '#fff',
              boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${bgColor}33`,
              animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'auto',
              letterSpacing: 0.1,
            }}>
              {t.message}
            </div>
          );
        })}
      </div>
    </div>
  );
};
