// ── Activity ──
export interface Activity {
  id: string;
  date: string;
  type:
    | 'dm_sent'
    | 'follow_up'
    | 'they_replied'
    | 'call_scheduled'
    | 'call_completed'
    | 'proposal_sent'
    | 'they_replied_proposal'
    | 'won'
    | 'lost'
    | 'note'
    | 'meeting'
    | 'feedback'
    | 'scope_change';
  notes: string;
}

// ── Prospects ──
export type ProspectStatus =
  | 'research'
  | 'dm_sent'
  | 'replied'
  | 'call_booked'
  | 'proposal_sent'
  | 'negotiating'
  | 'won'
  | 'lost';

export type ProspectSource =
  | 'cold_outreach'
  | 'referral'
  | 'inbound'
  | 'content_reply'
  | 'event'
  | 'other';

export interface Prospect {
  id: string;
  name: string;
  company: string;
  linkedinUrl: string;
  email: string;
  status: ProspectStatus;
  source: ProspectSource;
  dealValue: number;
  firstContactDate: string;
  lastContactDate: string;
  nextFollowUp: string;
  notes: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

// ── Inbound ──
export type InboundSource =
  | 'post_comment'
  | 'dm'
  | 'connection_request'
  | 'profile_view'
  | 'other';

export type InboundStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'call_booked'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'not_qualified';

export interface InboundLead {
  id: string;
  name: string;
  company: string;
  linkedinUrl: string;
  source: InboundSource;
  sourcePostId: string | null;
  message: string;
  status: InboundStatus;
  response: string;
  activities: Activity[];
  dateReceived: string;
  lastActionDate: string;
  nextStep: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Client Knowledge Graph ──
export interface KeyContact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface KnowledgeGraph {
  targetDemographics: string;
  competitors: string[];
  leadSource: string;
  brandVoice: string;
  techStack: string[];
  keyContacts: KeyContact[];
  industryNotes: string;
  contentGoals: string;
  idealCustomerProfile: string;
  tonePreferences: string;
  painPoints: string;
  uniqueSellingPoints: string;
}

// ── Client ──
export type ClientStatus = 'active' | 'paused' | 'churned';
export type BillingType = 'retainer' | 'one_time';

export interface Client {
  id: string;
  name: string;
  company: string;
  linkedinUrl: string;
  email: string;
  retainer: number;
  billingType: BillingType;
  projectValue: number;
  status: ClientStatus;
  startDate: string;
  churnDate: string | null;
  churnReason: string | null;
  pillars: string[];
  postingSchedule: string;
  notes: string;
  knowledgeGraph: KnowledgeGraph;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

// ── Posts ──
export type PostStatus = 'idea' | 'drafting' | 'review' | 'ready' | 'scheduled' | 'published';

export interface TrackingEntry {
  id: string;
  date: string;
  impressions: number;
  reactions: number;
  comments: number;
}

export interface CommentEntry {
  id: string;
  commenterName: string;
  company: string;
  commentText: string;
  isLead: boolean;
  notes: string;
  date: string;
}

export interface DmEntry {
  id: string;
  senderName: string;
  company: string;
  messageSummary: string;
  isLead: boolean;
  converted: boolean;
  linkedInboundId: string | null;
  date: string;
}

export interface Post {
  id: string;
  clientId: string; // 'personal' for personal posts
  title: string;
  content: string;
  pillar: string;
  status: PostStatus;
  scheduledDate: string;
  publishedDate: string | null;
  impressions: number;
  reactions: number;
  comments: number;
  saves: number;
  shares: number;
  profileViews: number;
  linkClicks: number;
  dmsFromPost: number;
  leadsFromPost: number;
  postUrl: string;
  notes: string;
  imageUrl: string;
  trackingLog: TrackingEntry[];
  commentLog: CommentEntry[];
  dmLog: DmEntry[];
  createdAt: string;
  updatedAt: string;
}

// ── Tasks ──
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskCategory = 'personal' | 'client';

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  isManual: boolean;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  clientId: string | null;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  timeEntries: TimeEntry[];
  timerRunning: boolean;
  timerStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Finance ──
export interface FinanceSettings {
  hourlyRate: number;
  exchangeRate: number; // 1 USD = X PKR
  cacTotal: number; // total marketing/sales spend
}

// ── Settings ──
export interface Settings {
  name: string;
  linkedinUrl: string;
  email: string;
  currency: string;
  goals: {
    monthlyMrr: number;
    monthlyNewClients: number;
    weeklyDms: number;
    weeklyPosts: number;
    monthlyImpressions: number;
  };
  finance: FinanceSettings;
  theme: 'dark' | 'light';
}

// ── Navigation ──
export type Section =
  | 'dashboard'
  | 'outbound'
  | 'inbound'
  | 'clients'
  | 'content'
  | 'posts'
  | 'analytics'
  | 'tasks'
  | 'finance'
  | 'settings';

export interface AppState {
  prospects: Prospect[];
  inbound: InboundLead[];
  clients: Client[];
  posts: Post[];
  tasks: Task[];
  settings: Settings;
  activeSection: Section;
}
