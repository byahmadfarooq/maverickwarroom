import React from 'react';
import { colors } from '../../utils/theme';
import { useApp } from '../../hooks/AppContext';
import type { Section } from '../../types';
import {
  HomeIcon, SendIcon, InboxIcon, UsersIcon, FileTextIcon,
  BarChartIcon, TrendingUpIcon, SettingsIcon, ChevronLeftIcon, MenuIcon,
} from '../shared/Icons';

const items: { key: Section; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { key: 'outbound', label: 'Outbound', icon: SendIcon },
  { key: 'inbound', label: 'Inbound', icon: InboxIcon },
  { key: 'clients', label: 'Clients', icon: UsersIcon },
  { key: 'content', label: 'Content', icon: FileTextIcon },
  { key: 'posts', label: 'Posts', icon: BarChartIcon },
  { key: 'analytics', label: 'Analytics', icon: TrendingUpIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
  const { activeSection, setActiveSection } = useApp();

  return (
    <aside style={{
      width: collapsed ? 64 : 240, minHeight: '100vh', background: colors.surface,
      borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease', flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{
        padding: collapsed ? '16px 12px' : '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between', borderBottom: `1px solid ${colors.border}`,
        minHeight: 56,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: colors.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff',
            }}>M</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: colors.textPrimary, whiteSpace: 'nowrap' }}>
              Maverick
            </span>
          </div>
        )}
        <button onClick={onToggle} style={{
          background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: 4,
        }}>
          {collapsed ? <MenuIcon size={18} /> : <ChevronLeftIcon size={18} />}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {items.map(({ key, label, icon: Icon }) => {
          const active = activeSection === key;
          return (
            <button key={key} onClick={() => setActiveSection(key)} title={label} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: collapsed ? '10px 0' : '10px 20px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: active ? colors.accent + '15' : 'transparent',
              border: 'none', borderLeft: active ? `3px solid ${colors.accent}` : '3px solid transparent',
              color: active ? colors.accent : colors.textSecondary,
              cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
              fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
            }}>
              <Icon size={18} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${colors.border}`, fontSize: 11, color: colors.textSecondary }}>
          LinkedIn Command Center
        </div>
      )}
    </aside>
  );
};
