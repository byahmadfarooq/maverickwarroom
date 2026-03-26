import { v4 as uuidv4 } from 'uuid';
import { CLIENT_PALETTE } from './theme';

// Returns a stable color for a client based on its index in the clients array
export function getClientColor(index: number): string {
  return CLIENT_PALETTE[index % CLIENT_PALETTE.length];
}

export const genId = (): string => uuidv4();
export const today = (): string => new Date().toISOString().split('T')[0];
export const now = (): string => new Date().toISOString();

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDualCurrency(usd: number, rate: number): string {
  const pkr = Math.round(usd * rate);
  return `$${usd.toLocaleString()} / PKR ${pkr.toLocaleString()}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${h.toFixed(1)}h`;
}

export function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function daysAgo(date: string): number {
  return daysBetween(date, today());
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  return date < today();
}

export function isThisWeek(date: string): boolean {
  const d = new Date(date);
  const n = new Date();
  const startOfWeek = new Date(n);
  startOfWeek.setDate(n.getDate() - n.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

export function isThisMonth(date: string): boolean {
  const d = new Date(date);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export function isLastNDays(date: string, n: number): boolean {
  const d = new Date(date);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  return d >= cutoff;
}

export function getWeekDates(offset: number = 0): Date[] {
  const n = new Date();
  const start = new Date(n);
  start.setDate(n.getDate() - n.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export function timeAgo(ds: string): string {
  const d = new Date(ds);
  const n = new Date();
  const seconds = Math.floor((n.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just Now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m Ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h Ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d Ago`;
  return formatDateShort(ds.split('T')[0]);
}

export function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Unicode text conversion for LinkedIn
const BOLD_MAP: Record<string, string> = {};
const ITALIC_MAP: Record<string, string> = {};

const boldUpper = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭';
const boldLower = '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇';
const boldDigits = '𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵';
const italicUpper = '𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡';
const italicLower = '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻';

for (let i = 0; i < 26; i++) {
  BOLD_MAP[String.fromCharCode(65 + i)] = [...boldUpper][i];
  BOLD_MAP[String.fromCharCode(97 + i)] = [...boldLower][i];
  ITALIC_MAP[String.fromCharCode(65 + i)] = [...italicUpper][i];
  ITALIC_MAP[String.fromCharCode(97 + i)] = [...italicLower][i];
}
for (let i = 0; i < 10; i++) {
  BOLD_MAP[String(i)] = [...boldDigits][i];
}

export function toUnicodeBold(text: string): string {
  return [...text].map((c) => BOLD_MAP[c] || c).join('');
}

export function toUnicodeItalic(text: string): string {
  return [...text].map((c) => ITALIC_MAP[c] || c).join('');
}

export function convertFormattedToUnicode(html: string): string {
  let text = html;
  // Bold
  text = text.replace(/<b>(.*?)<\/b>/gi, (_, content) => toUnicodeBold(content));
  text = text.replace(/<strong>(.*?)<\/strong>/gi, (_, content) => toUnicodeBold(content));
  // Italic
  text = text.replace(/<i>(.*?)<\/i>/gi, (_, content) => toUnicodeItalic(content));
  text = text.replace(/<em>(.*?)<\/em>/gi, (_, content) => toUnicodeItalic(content));
  // Underline - no unicode equivalent, keep as-is
  text = text.replace(/<u>(.*?)<\/u>/gi, '$1');
  // Line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p><p>/gi, '\n\n');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  return text;
}
