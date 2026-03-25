import React from 'react';
import { colors } from '../../utils/theme';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: colors.bg, border: `1px solid ${colors.border}`,
  borderRadius: 6, color: colors.textPrimary, fontSize: 14, fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: colors.textSecondary,
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
};

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Field: React.FC<FieldProps> = ({ label, required, children, style }) => (
  <div style={{ marginBottom: 12, ...style }}>
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
  <select {...props} style={{ ...inputStyle, ...props.style }}>{children}</select>
);

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}
export const Btn: React.FC<BtnProps> = ({ variant = 'primary', size = 'md', children, style, ...props }) => {
  const base: React.CSSProperties = {
    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
    fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: size === 'sm' ? '6px 12px' : '8px 16px',
    fontSize: size === 'sm' ? 12 : 14,
    transition: 'all 0.15s',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: colors.accent, color: '#fff' },
    secondary: { background: colors.surfaceHover, color: colors.textPrimary, border: `1px solid ${colors.border}` },
    danger: { background: colors.error, color: '#fff' },
    ghost: { background: 'transparent', color: colors.textSecondary },
  };
  return <button {...props} style={{ ...base, ...variants[variant], ...style, opacity: props.disabled ? 0.5 : 1 }}>{children}</button>;
};

export const Badge: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = colors.accent, children }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
    fontSize: 11, fontWeight: 600, background: color + '22', color,
  }}>{children}</span>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    active: colors.success, paused: colors.warning, churned: colors.error,
    new: colors.info, contacted: colors.accent, qualified: colors.warning,
    call_booked: colors.info, proposal_sent: colors.accent, won: colors.success,
    lost: colors.error, not_qualified: colors.textSecondary,
    research: colors.textSecondary, dm_sent: colors.info, replied: colors.warning,
    negotiating: colors.accent,
    idea: colors.textSecondary, drafting: colors.warning, ready: colors.info,
    scheduled: '#A855F7', published: colors.success,
  };
  return <Badge color={map[status] || colors.textSecondary}>{status.replace(/_/g, ' ')}</Badge>;
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }> = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8,
    padding: 16, cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.15s',
    ...style,
  }}>{children}</div>
);

export const EmptyState: React.FC<{ message: string; action?: string; onAction?: () => void }> = ({ message, action, onAction }) => (
  <div style={{ textAlign: 'center', padding: 48, color: colors.textSecondary }}>
    <p style={{ fontSize: 14, marginBottom: 12 }}>{message}</p>
    {action && onAction && <Btn variant="secondary" onClick={onAction}>{action}</Btn>}
  </div>
);
