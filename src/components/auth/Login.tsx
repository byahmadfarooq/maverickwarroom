import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { colors, radius } from '../../utils/theme';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: colors.bg, fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: 360, padding: 36,
        background: colors.surface,
        borderRadius: radius.xl,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: radius.md,
            background: `linear-gradient(135deg, #FF6B2B, #FF9A5E)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, color: '#fff',
            boxShadow: '0 4px 12px rgba(255,107,43,0.35)',
          }}>M</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: colors.textPrimary, letterSpacing: -0.3 }}>
              Maverick War Room
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>LinkedIn Command Center</div>
          </div>
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
          Sign in
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: colors.textSecondary }}>
          Enter your credentials to continue.
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: radius.md, color: colors.textPrimary,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF6B2B')}
              onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: radius.md, color: colors.textPrimary,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF6B2B')}
              onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: radius.md, marginBottom: 16,
              background: `${colors.error}18`, border: `1px solid ${colors.error}40`,
              fontSize: 13, color: colors.error,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: loading ? colors.textMuted : `linear-gradient(135deg, #FF6B2B, #FF8F5E)`,
              border: 'none', borderRadius: radius.md,
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
