import React from 'react';
import { colors, radius } from '../../utils/theme';
import { statusLabel } from '../../utils/helpers';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: colors.bg,
  border: `1px solid ${colors.border}`, borderRadius: radius.md,
  color: colors.textPrimary, fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary,
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
};

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Field: React.FC<FieldProps> = ({ label, required, children, style }) => (
  <div style={{ marginBottom: 14, ...style }}>
    <label style={labelStyle}>{label}{required && <span style={{ color: colors.error }}> *</span>}</label>
    {children}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input: React.FC<InputProps> = (props) => (
  <input {...props} style={{ ...inputStyle, ...props.style }} />
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const TextArea: React.FC<TextAreaProps> = (props) => (
  <textarea {...props} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', ...props.style }} />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}
export const Select: React.FC<SelectProps> = ({ children, ...props }) => (
  <select {...props} style={{ ...inputStyle, cursor: 'pointer', ...props.style }}>{children}</select>
);

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
export const Btn: React.FC<BtnProps> = ({ variant = 'primary', size = 'md', children, style, ...props }) => {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12, borderRadius: radius.sm },
    md: { padding: '9px 18px', fontSize: 13, borderRadius: radius.md },
    lg: { padding: '12px 24px', fontSize: 14, borderRadius: radius.lg },
  };
  const base: React.CSSProperties = {
    border: 'none', cursor: 'pointer', fontWeight: 600,
    fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7,
    transition: 'all 0.2s ease', letterSpacing: 0.2, whiteSpace: 'nowrap',
    ...sizes[size],
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: colors.accent, color: '#fff', boxShadow: '0 1px 3px rgba(255,107,43,0.3)' },
    secondary: { background: colors.surfaceHover, color: colors.textPrimary, border: `1px solid ${colors.border}` },
    danger: { background: colors.errorMuted, color: colors.error, border: `1px solid ${colors.error}33` },
    ghost: { background: 'transparent', color: colors.textSecondary, padding: sizes[size].padding },
  };
  return (
    <button {...props} style={{
      ...base, ...variants[variant], ...style,
      opacity: props.disabled ? 0.4 : 1,
      pointerEvents: props.disabled ? 'none' : 'auto',
    }}>{children}</button>
  );
};

export const Badge: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = colors.accent, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: radius.full,
    fontSize: 11, fontWeight: 600, background: color + '18', color, letterSpacing: 0.3,
    textTransform: 'capitalize',
  }}>{children}</span>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    active: colors.success, paused: colors.warning, churned: colors.error,
    new: colors.info, contacted: colors.accent, qualified: colors.warning,
    call_booked: colors.purple, proposal_sent: colors.accent, won: colors.success,
    lost: colors.error, not_qualified: colors.textSecondary,
    research: colors.textMuted, dm_sent: colors.info, replied: colors.warning,
    negotiating: colors.accent,
    idea: colors.textMuted, drafting: colors.warning, review: colors.purple,
    ready: colors.info, scheduled: colors.purple, published: colors.success,
    todo: colors.textSecondary, in_progress: colors.info, done: colors.success,
    low: colors.textSecondary, medium: colors.warning, high: colors.accent, urgent: colors.error,
    retainer: colors.success, one_time: colors.info,
    personal: colors.accent, client: colors.info,
  };
  return <Badge color={map[status] || colors.textSecondary}>{statusLabel(status)}</Badge>;
};

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  glass?: boolean;
  glow?: boolean;
}
export const Card: React.FC<CardProps> = ({ children, style, onClick, glass, glow }) => (
  <div onClick={onClick} style={{
    background: glass ? colors.glass : colors.surface,
    border: `1px solid ${glass ? colors.glassBorder : colors.border}`,
    borderRadius: radius.lg, padding: 20,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
    backdropFilter: glass ? 'blur(12px)' : undefined,
    boxShadow: glow ? '0 0 30px rgba(255,107,43,0.06)' : undefined,
    ...style,
  }}>{children}</div>
);

export const EmptyState: React.FC<{ message: string; action?: string; onAction?: () => void }> = ({ message, action, onAction }) => (
  <div style={{
    textAlign: 'center', padding: '48px 24px', color: colors.textSecondary,
    background: colors.surface, border: `1px dashed ${colors.border}`,
    borderRadius: radius.lg,
  }}>
    <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{message}</p>
    {action && onAction && <Btn variant="secondary" onClick={onAction}>{action}</Btn>}
  </div>
);

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, flexWrap: 'wrap', gap: 12,
  }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textPrimary, letterSpacing: -0.3 }}>{title}</h2>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textSecondary }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
  </div>
);

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, color = colors.textPrimary, icon }) => (
  <Card style={{ padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.5 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <div style={{ width: 36, height: 36, borderRadius: radius.md, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>}
    </div>
  </Card>
);

export const TabBar: React.FC<{
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div style={{
    display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border}`, marginBottom: 20,
  }}>
    {tabs.map((t) => (
      <button key={t.key} onClick={() => onChange(t.key)} style={{
        padding: '10px 20px', border: 'none',
        borderBottom: active === t.key ? `2px solid ${colors.accent}` : '2px solid transparent',
        background: 'transparent',
        color: active === t.key ? colors.accent : colors.textSecondary,
        cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        transition: 'all 0.2s',
      }}>{t.label}</button>
    ))}
  </div>
);

export const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', left: 12, top: 11 }}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        ...inputStyle, paddingLeft: 36,
        background: colors.surface, borderColor: colors.border,
      }} />
  </div>
);
