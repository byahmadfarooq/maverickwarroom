import React, { useContext, useMemo } from 'react';
import { AppCtx } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, SectionHeader, StatCard } from '../shared/FormElements';
import { DollarIcon, TrendingUpIcon, UsersIcon, BarChartIcon } from '../shared/Icons';
import { formatCurrency, formatDualCurrency, formatNumber, formatPercent, formatHours, daysBetween, today } from '../../utils/helpers';
import type { Client } from '../../types';

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  borderBottom: `1px solid ${colors.border}`,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: colors.textPrimary,
  borderBottom: `1px solid ${colors.border}`,
};

export const Finance: React.FC = () => {
  const { clients, tasks, settings } = useContext(AppCtx);
  const rate = settings.finance.exchangeRate;

  const data = useMemo(() => {
    const activeRetainer = clients.filter((c) => c.status === 'active' && c.billingType === 'retainer');
    const activeOneTime = clients.filter((c) => c.status === 'active' && c.billingType === 'one_time');
    const allActive = clients.filter((c) => c.status === 'active');

    const mrr = activeRetainer.reduce((s, c) => s + c.retainer, 0);
    const oneTimeRevenue = activeOneTime.reduce((s, c) => s + c.projectValue, 0);
    const totalRevenue = mrr + oneTimeRevenue;

    // Unit Economics
    const totalClientsAcquired = clients.length;
    const cac = totalClientsAcquired > 0 ? settings.finance.cacTotal / totalClientsAcquired : 0;

    const avgRetainer = activeRetainer.length > 0
      ? activeRetainer.reduce((s, c) => s + c.retainer, 0) / activeRetainer.length
      : 0;

    const clientLifespans = allActive.map((c) => {
      const months = daysBetween(c.startDate, today()) / 30;
      return Math.max(months, 1);
    });
    const avgLifespan = clientLifespans.length > 0
      ? clientLifespans.reduce((s, m) => s + m, 0) / clientLifespans.length
      : 0;

    const ltv = avgRetainer * avgLifespan;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    // Time Economics
    const allTimeEntries = tasks.flatMap((t) => t.timeEntries);
    const totalHours = allTimeEntries.reduce((s, e) => s + e.hours, 0);
    const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
    const hourlyRate = settings.finance.hourlyRate;

    // Profit margin estimate: (revenue - cost) / revenue
    const estimatedCost = totalHours * hourlyRate;
    const profitMargin = totalRevenue > 0 ? (totalRevenue - estimatedCost) / totalRevenue : 0;

    // Per-client profitability
    const clientProfitability = allActive.map((c: Client) => {
      const clientTasks = tasks.filter((t) => t.clientId === c.id);
      const hours = clientTasks.reduce((s, t) => s + t.timeEntries.reduce((h, e) => h + e.hours, 0), 0);
      const revenue = c.billingType === 'retainer' ? c.retainer : c.projectValue;
      const revPerHour = hours > 0 ? revenue / hours : 0;
      return { id: c.id, name: c.name, revenue, hours, revPerHour, status: c.status, billingType: c.billingType };
    }).sort((a, b) => b.revPerHour - a.revPerHour);

    return {
      mrr, oneTimeRevenue, totalRevenue,
      cac, ltv, ltvCacRatio, avgRetainer, avgLifespan, profitMargin,
      totalHours, revenuePerHour, hourlyRate,
      clientProfitability,
    };
  }, [clients, tasks, settings]);

  const ltvColor = data.ltvCacRatio >= 3 ? colors.success
    : data.ltvCacRatio >= 1 ? colors.warning
    : colors.error;

  return (
    <div>
      <SectionHeader
        title="Finance"
        subtitle="Revenue, unit economics, and profitability analysis"
      />

      {/* Revenue Overview */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Revenue Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(data.mrr)}
          sub={formatDualCurrency(data.mrr, rate)}
          color={colors.success}
          icon={<DollarIcon size={18} style={{ color: colors.success }} />}
        />
        <StatCard
          label="One-Time Revenue"
          value={formatCurrency(data.oneTimeRevenue)}
          sub={formatDualCurrency(data.oneTimeRevenue, rate)}
          color={colors.info}
          icon={<DollarIcon size={18} style={{ color: colors.info }} />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          sub={formatDualCurrency(data.totalRevenue, rate)}
          color={colors.accent}
          icon={<TrendingUpIcon size={18} style={{ color: colors.accent }} />}
        />
      </div>

      {/* Unit Economics */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Unit Economics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Customer Acquisition Cost"
          value={formatCurrency(data.cac)}
          sub={formatDualCurrency(data.cac, rate)}
          color={colors.warning}
          icon={<UsersIcon size={18} style={{ color: colors.warning }} />}
        />
        <StatCard
          label="Lifetime Value (LTV)"
          value={formatCurrency(data.ltv)}
          sub={`Avg ${formatCurrency(data.avgRetainer)}/mo x ${data.avgLifespan.toFixed(1)} months`}
          color={colors.purple}
          icon={<TrendingUpIcon size={18} style={{ color: colors.purple }} />}
        />
        <StatCard
          label="LTV:CAC Ratio"
          value={data.ltvCacRatio > 0 ? `${data.ltvCacRatio.toFixed(1)}x` : 'N/A'}
          sub={data.ltvCacRatio >= 3 ? 'Healthy' : data.ltvCacRatio >= 1 ? 'Needs improvement' : 'Below target'}
          color={ltvColor}
          icon={<BarChartIcon size={18} style={{ color: ltvColor }} />}
        />
        <StatCard
          label="Profit Margin (Est.)"
          value={formatPercent(data.profitMargin)}
          sub={data.profitMargin > 0.5 ? 'Strong' : data.profitMargin > 0.2 ? 'Moderate' : 'Low'}
          color={data.profitMargin > 0.5 ? colors.success : data.profitMargin > 0.2 ? colors.warning : colors.error}
          icon={<TrendingUpIcon size={18} style={{ color: data.profitMargin > 0.5 ? colors.success : colors.warning }} />}
        />
      </div>

      {/* Time Economics */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Time Economics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Total Hours Tracked"
          value={formatHours(data.totalHours)}
          sub={`${data.totalHours.toFixed(1)} hours total`}
          color={colors.textPrimary}
        />
        <StatCard
          label="Revenue Per Hour"
          value={formatCurrency(data.revenuePerHour)}
          sub={formatDualCurrency(data.revenuePerHour, rate)}
          color={data.revenuePerHour > data.hourlyRate ? colors.success : colors.warning}
        />
        <StatCard
          label="Opportunity Cost / Hour"
          value={formatCurrency(data.hourlyRate)}
          sub={formatDualCurrency(data.hourlyRate, rate)}
          color={colors.textSecondary}
        />
        <StatCard
          label="Effective Multiplier"
          value={data.hourlyRate > 0 ? `${(data.revenuePerHour / data.hourlyRate).toFixed(1)}x` : 'N/A'}
          sub="Revenue/hr vs Hourly Rate"
          color={data.revenuePerHour > data.hourlyRate ? colors.success : colors.error}
        />
      </div>

      {/* Per-Client Profitability */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 12 }}>Per-Client Profitability</h3>
      {data.clientProfitability.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 32, color: colors.textSecondary, fontSize: 14 }}>
            No active clients to display.
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Revenue (USD)</th>
                  <th style={thStyle}>Revenue (PKR)</th>
                  <th style={thStyle}>Hours</th>
                  <th style={thStyle}>Revenue / Hour</th>
                  <th style={thStyle}>Rev/Hr (PKR)</th>
                  <th style={thStyle}>Type</th>
                </tr>
              </thead>
              <tbody>
                {data.clientProfitability.map((c) => {
                  const isAboveRate = c.revPerHour >= data.hourlyRate;
                  return (
                    <tr key={c.id} style={{ transition: 'background 0.15s' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                      <td style={tdStyle}>{formatCurrency(c.revenue)}</td>
                      <td style={{ ...tdStyle, color: colors.textSecondary }}>
                        PKR {Math.round(c.revenue * rate).toLocaleString()}
                      </td>
                      <td style={tdStyle}>{formatHours(c.hours)}</td>
                      <td style={{
                        ...tdStyle, fontWeight: 700,
                        color: c.hours === 0 ? colors.textMuted : isAboveRate ? colors.success : colors.error,
                      }}>
                        {c.hours > 0 ? formatCurrency(c.revPerHour) : '--'}
                      </td>
                      <td style={{ ...tdStyle, color: colors.textSecondary }}>
                        {c.hours > 0 ? `PKR ${Math.round(c.revPerHour * rate).toLocaleString()}` : '--'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: radius.full,
                          fontSize: 11, fontWeight: 600,
                          background: c.billingType === 'retainer' ? colors.successMuted : colors.infoMuted,
                          color: c.billingType === 'retainer' ? colors.success : colors.info,
                        }}>
                          {c.billingType === 'retainer' ? 'Retainer' : 'One-Time'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
