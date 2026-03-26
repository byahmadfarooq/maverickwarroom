import React from 'react';
import { colors, radius } from '../../utils/theme';
import { useApp } from '../../hooks/AppContext';
import type { Section } from '../../types';
import {
  HomeIcon, SendIcon, InboxIcon, UsersIcon, FileTextIcon,
  BarChartIcon, TrendingUpIcon, SettingsIcon, ChevronLeftIcon, MenuIcon,
  DollarIcon,
} from '../shared/Icons';

const TasksIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const items: { key: Section; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { key: 'outbound', label: 'Outbound', icon: SendIcon },
  { key: 'inbound', label: 'Inbound', icon: InboxIcon },
  { key: 'clients', label: 'Clients', icon: UsersIcon },
  { key: 'content', label: 'Content', icon: FileTextIcon },
  { key: 'posts', label: 'Posts', icon: BarChartIcon },
  { key: 'analytics', label: 'Analytics', icon: TrendingUpIcon },
  { key: 'tasks', label: 'Tasks', icon: TasksIcon },
  { key: 'finance', label: 'Finance', icon: DollarIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
  const { activeSection, setActiveSection } = useApp();
  const [hoveredKey, setHoveredKey] = React.useState<Section | null>(null);

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      height: '100vh',
      background: colors.surface,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Logo Section */}
      <div style={{
        padding: collapsed ? '20px 12px' : '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${colors.border}`,
        minHeight: 64,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: radius.md,
              background: `linear-gradient(135deg, ${colors.accent}, #FF8F5E)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 15,
              color: '#fff',
              boxShadow: '0 2px 8px rgba(255,107,43,0.3)',
            }}>M</div>
            <span style={{
              fontWeight: 700,
              fontSize: 16,
              color: colors.textPrimary,
              whiteSpace: 'nowrap',
              letterSpacing: -0.3,
            }}>
              Maverick
            </span>
          </div>
        )}
        <button onClick={onToggle} style={{
          background: 'none',
          border: 'none',
          color: colors.textMuted,
          cursor: 'pointer',
          padding: 6,
          borderRadius: radius.sm,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s, background 0.15s',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.textSecondary;
            e.currentTarget.style.background = colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.textMuted;
            e.currentTarget.style.background = 'none';
          }}
        >
          {collapsed ? <MenuIcon size={18} /> : <ChevronLeftIcon size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(({ key, label, icon: Icon }) => {
          const active = activeSection === key;
          const hovered = hoveredKey === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              title={collapsed ? label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? colors.accentMuted : hovered ? colors.surfaceHover : 'transparent',
                border: 'none',
                borderLeft: active ? `3px solid ${colors.accent}` : '3px solid transparent',
                borderRadius: collapsed ? radius.md : `0 ${radius.md}px ${radius.md}px 0`,
                color: active ? colors.accent : hovered ? colors.textPrimary : colors.textSecondary,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <Icon size={18} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.border}`,
          fontSize: 11,
          color: colors.textMuted,
          letterSpacing: 0.2,
        }}>
          LinkedIn Command Center
        </div>
      )}
    </aside>
  );
};
