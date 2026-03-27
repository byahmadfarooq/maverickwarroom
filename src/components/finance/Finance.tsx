import React, { useContext, useMemo, useState } from 'react';
import { AppCtx } from '../../hooks/AppContext';
import { colors, radius } from '../../utils/theme';
import { Card, SectionHeader, StatCard, Btn, Field, Input, Select } from '../shared/FormElements';
import { Modal } from '../shared/Modal';
import { DollarIcon, TrendingUpIcon, UsersIcon, BarChartIcon, PlusIcon, TrashIcon } from '../shared/Icons';
import { formatCurrency, formatDualCurrency, formatPercent, formatHours, daysBetween, today, genId, now, isOverdue, formatDate } from '../../utils/helpers';
import type { Client, Invoice, InvoiceStatus } from '../../types';

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  borderBottom: `1px solid ${colors.border}`,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: colors.textPrimary,
  borderBottom: `1px solid ${colors.border}`,
};

const emptyInvoiceForm = { clientId: '', description: '', amount: '', dueDate: today() };

export const Finance: React.FC = () => {
  const { clients, tasks, settings, invoices, setInvoices, updateInvoice, deleteInvoice, toast } = useContext(AppCtx);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ ...emptyInvoiceForm });
  const setIF = (k: string, v: string) => setInvoiceForm((f) => ({ ...f, [k]: v }));
  const rate = settings?.finance?.exchangeRate ?? 278;

  const data = useMemo(() => {
    const finance = settings?.finance ?? { hourlyRate: 50, exchangeRate: 278, cacTotal: 0 };
    const activeRetainer = clients.filter((c) => c.status === 'active' && c.billingType === 'retainer');
    const activeOneTime = clients.filter((c) => c.status === 'active' && c.billingType === 'one_time');
    const allActive = clients.filter((c) => c.status === 'active');

    const mrr = activeRetainer.reduce((s, c) => s + c.retainer, 0);
    const oneTimeRevenue = activeOneTime.reduce((s, c) => s + c.projectValue, 0);
    const totalRevenue = mrr + oneTimeRevenue;

    // Unit Economics
    const totalClientsAcquired = clients.length;
    const cac = totalClientsAcquired > 0 ? finance.cacTotal / totalClientsAcquired : 0;

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
    const hourlyRate = finance.hourlyRate;

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

    // Invoices
    const totalReceivables = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
    const overdueInvoices = invoices.filter((i) => i.status !== 'paid' && isOverdue(i.dueDate)).length;

    return {
      mrr, oneTimeRevenue, totalRevenue,
      cac, ltv, ltvCacRatio, avgRetainer, avgLifespan, profitMargin,
      totalHours, revenuePerHour, hourlyRate,
      clientProfitability,
      totalReceivables, overdueInvoices,
    };
  }, [clients, tasks, settings, invoices]);

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

      {/* Invoices */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Invoices & Payments</h3>
        <Btn size="sm" onClick={() => { setInvoiceForm({ ...emptyInvoiceForm }); setShowInvoiceModal(true); }}>
          <PlusIcon size={13} /> New Invoice
        </Btn>
      </div>
      {data.totalReceivables > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            padding: '5px 12px', borderRadius: radius.md, fontSize: 13, fontWeight: 600,
            background: colors.warningMuted, color: colors.warning,
          }}>
            {formatCurrency(data.totalReceivables)} outstanding
          </span>
          {data.overdueInvoices > 0 && (
            <span style={{
              padding: '5px 12px', borderRadius: radius.md, fontSize: 13, fontWeight: 600,
              background: `${colors.error}18`, color: colors.error,
            }}>
              {data.overdueInvoices} overdue
            </span>
          )}
        </div>
      )}
      {invoices.length === 0 ? (
        <Card style={{ marginBottom: 28 }}>
          <div style={{ textAlign: 'center', padding: '24px', color: colors.textMuted, fontSize: 13 }}>
            No invoices yet. Create your first invoice to track payments.
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...invoices].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((inv) => {
                  const clientName = inv.clientId === 'personal'
                    ? 'Personal'
                    : clients.find((c) => c.id === inv.clientId)?.name || '--';
                  const over = inv.status !== 'paid' && isOverdue(inv.dueDate);
                  const statusColor = inv.status === 'paid' ? colors.success
                    : over ? colors.error : colors.warning;
                  const statusLabel = inv.status === 'paid' ? 'Paid'
                    : over ? 'Overdue' : 'Unpaid';
                  return (
                    <tr key={inv.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{clientName}</td>
                      <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inv.description || '--'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: colors.accent }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td style={{ ...tdStyle, color: over ? colors.error : colors.textSecondary }}>
                        {formatDate(inv.dueDate)}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 10px', borderRadius: radius.full, fontSize: 11, fontWeight: 600,
                          background: `${statusColor}18`, color: statusColor,
                        }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {inv.status !== 'paid' && (
                            <Btn size="sm" variant="secondary" onClick={() => {
                              updateInvoice(inv.id, { status: 'paid', paidDate: today() });
                              toast('Invoice marked as paid', 'success');
                            }}>
                              Mark Paid
                            </Btn>
                          )}
                          <Btn size="sm" variant="danger" onClick={() => {
                            deleteInvoice(inv.id);
                            toast('Invoice deleted');
                          }}>
                            <TrashIcon size={12} />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
      {/* New Invoice Modal */}
      <Modal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="New Invoice" width={460}>
        <Field label="Client" required>
          <Select value={invoiceForm.clientId} onChange={(e) => setIF('clientId', e.target.value)}>
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Description">
          <Input value={invoiceForm.description} onChange={(e) => setIF('description', e.target.value)} placeholder="e.g. March retainer" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Amount (USD)" required>
            <Input type="number" min="0" value={invoiceForm.amount} onChange={(e) => setIF('amount', e.target.value)} placeholder="500" />
          </Field>
          <Field label="Due Date" required>
            <Input type="date" value={invoiceForm.dueDate} onChange={(e) => setIF('dueDate', e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</Btn>
          <Btn
            disabled={!invoiceForm.clientId || !invoiceForm.amount}
            onClick={() => {
              const inv: Invoice = {
                id: genId(), clientId: invoiceForm.clientId,
                description: invoiceForm.description,
                amount: parseFloat(invoiceForm.amount) || 0,
                dueDate: invoiceForm.dueDate,
                status: 'unpaid' as InvoiceStatus,
                paidDate: null,
                createdAt: now(),
              };
              setInvoices((prev) => [...prev, inv]);
              toast('Invoice created', 'success');
              setShowInvoiceModal(false);
            }}
          >
            Create Invoice
          </Btn>
        </div>
      </Modal>
    </div>
  );
};
