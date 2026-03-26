import React from 'react';
import { XIcon } from './Icons';
import { colors, radius } from '../../utils/theme';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export const Modal: React.FC<Props> = ({ open, onClose, title, children, width = 540 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl,
        width: '92%', maxWidth: width, maxHeight: '88vh', overflow: 'auto',
        boxShadow: colors.shadowLg,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', borderBottom: `1px solid ${colors.border}`,
          position: 'sticky', top: 0, background: colors.surface, zIndex: 1,
        }}>
          <h3 style={{ margin: 0, color: colors.textPrimary, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: colors.surfaceHover, border: `1px solid ${colors.border}`,
            color: colors.textSecondary, cursor: 'pointer', padding: 6,
            borderRadius: radius.sm, display: 'flex',
          }}>
            <XIcon size={16} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};
