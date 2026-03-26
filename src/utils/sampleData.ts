import type { Prospect, InboundLead, Client, Post, Task, Settings, KnowledgeGraph } from '../types';
import { genId, today } from './helpers';

const d = (offset: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split('T')[0];
};

const emptyKG: KnowledgeGraph = {
  targetDemographics: '', competitors: [], leadSource: '', brandVoice: '',
  techStack: [], keyContacts: [], industryNotes: '', contentGoals: '',
  idealCustomerProfile: '', tonePreferences: '', painPoints: '', uniqueSellingPoints: '',
};

export const sampleSettings: Settings = {
  name: 'Ahmad Farooq',
  linkedinUrl: 'https://linkedin.com/in/ahmadfarooq',
  email: 'ahmad@example.com',
  currency: 'USD',
  goals: {
    monthlyMrr: 15000,
    monthlyNewClients: 3,
    weeklyDms: 50,
    weeklyPosts: 15,
    monthlyImpressions: 500000,
  },
  finance: {
    hourlyRate: 75,
    exchangeRate: 278,
    cacTotal: 500,
  },
  theme: 'dark',
};

export const sampleProspects: Prospect[] = [
  {
    id: genId(), name: 'Sarah Chen', company: 'TechFlow AI', linkedinUrl: '', email: 'sarah@techflow.ai',
    status: 'call_booked', source: 'cold_outreach', dealValue: 3000,
    firstContactDate: d(-14), lastContactDate: d(-1), nextFollowUp: d(1),
    notes: 'Interested in thought leadership content', activities: [
      { id: genId(), date: d(-14), type: 'dm_sent', notes: 'Initial outreach about LinkedIn content' },
      { id: genId(), date: d(-10), type: 'they_replied', notes: 'Replied positively, asked for examples' },
      { id: genId(), date: d(-7), type: 'follow_up', notes: 'Sent portfolio link' },
      { id: genId(), date: d(-1), type: 'call_scheduled', notes: 'Discovery call booked for Friday' },
    ],
    createdAt: d(-14), updatedAt: d(-1),
  },
  {
    id: genId(), name: 'James Wilson', company: 'ScaleUp VC', linkedinUrl: '', email: '',
    status: 'dm_sent', source: 'cold_outreach', dealValue: 5000,
    firstContactDate: d(-3), lastContactDate: d(-3), nextFollowUp: d(2),
    notes: 'VC partner, could be a great case study', activities: [
      { id: genId(), date: d(-3), type: 'dm_sent', notes: 'Personalized DM about VC thought leadership' },
    ],
    createdAt: d(-3), updatedAt: d(-3),
  },
  {
    id: genId(), name: 'Maria Gonzalez', company: 'CloudServe', linkedinUrl: '', email: 'maria@cloudserve.io',
    status: 'proposal_sent', source: 'referral', dealValue: 4000,
    firstContactDate: d(-21), lastContactDate: d(-2), nextFollowUp: d(-1),
    notes: 'Referred by David Kim', activities: [
      { id: genId(), date: d(-21), type: 'dm_sent', notes: 'Intro via David Kim' },
      { id: genId(), date: d(-18), type: 'they_replied', notes: 'Very interested' },
      { id: genId(), date: d(-14), type: 'call_completed', notes: 'Great call, wants 5 posts/week' },
      { id: genId(), date: d(-2), type: 'proposal_sent', notes: 'Sent $4K/mo proposal' },
    ],
    createdAt: d(-21), updatedAt: d(-2),
  },
  {
    id: genId(), name: 'Alex Turner', company: 'DevOps Pro', linkedinUrl: '', email: '',
    status: 'research', source: 'content_reply', dealValue: 2500,
    firstContactDate: d(-1), lastContactDate: d(-1), nextFollowUp: d(3),
    notes: 'Commented on 3 posts, seems very engaged', activities: [],
    createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: genId(), name: 'Lisa Park', company: 'DataMinds', linkedinUrl: '', email: '',
    status: 'replied', source: 'cold_outreach', dealValue: 3500,
    firstContactDate: d(-7), lastContactDate: d(-4), nextFollowUp: d(0),
    notes: 'Looking for B2B SaaS content', activities: [
      { id: genId(), date: d(-7), type: 'dm_sent', notes: 'Cold outreach' },
      { id: genId(), date: d(-4), type: 'they_replied', notes: 'Asked about pricing' },
    ],
    createdAt: d(-7), updatedAt: d(-4),
  },
  {
    id: genId(), name: 'Tom Brady', company: 'FinStack', linkedinUrl: '', email: '',
    status: 'won', source: 'inbound', dealValue: 3000,
    firstContactDate: d(-30), lastContactDate: d(-5), nextFollowUp: '',
    notes: 'Converted from inbound', activities: [
      { id: genId(), date: d(-30), type: 'they_replied', notes: 'Reached out via DM' },
      { id: genId(), date: d(-25), type: 'call_completed', notes: 'Discovery call' },
      { id: genId(), date: d(-20), type: 'proposal_sent', notes: 'Sent proposal' },
      { id: genId(), date: d(-5), type: 'won', notes: 'Signed!' },
    ],
    createdAt: d(-30), updatedAt: d(-5),
  },
];

export const sampleInbound: InboundLead[] = [
  {
    id: genId(), name: 'Rachel Adams', company: 'GrowthLab', linkedinUrl: '',
    source: 'post_comment', sourcePostId: null, message: 'Love your content strategy framework! Do you offer this as a service?',
    status: 'new', response: '', activities: [],
    dateReceived: d(-1), lastActionDate: d(-1), nextStep: 'Reply to comment', notes: '',
    createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: genId(), name: 'Kevin Zhao', company: 'B2B Rocket', linkedinUrl: '',
    source: 'dm', sourcePostId: null, message: 'Hey, saw your posts about LinkedIn ghostwriting. What are your rates?',
    status: 'contacted', response: 'Thanks Kevin! Sent over my services deck.', activities: [
      { id: genId(), date: d(-2), type: 'they_replied', notes: 'Sent services info' },
    ],
    dateReceived: d(-3), lastActionDate: d(-2), nextStep: 'Follow up if no reply', notes: '',
    createdAt: d(-3), updatedAt: d(-2),
  },
  {
    id: genId(), name: 'Diana Ross', company: 'SaaSMetrics', linkedinUrl: '',
    source: 'connection_request', sourcePostId: null, message: 'Would love to connect - interested in your content services',
    status: 'qualified', response: 'Connected and had initial chat', activities: [
      { id: genId(), date: d(-5), type: 'they_replied', notes: 'Accepted connection' },
      { id: genId(), date: d(-4), type: 'follow_up', notes: 'Qualified - good fit' },
    ],
    dateReceived: d(-5), lastActionDate: d(-4), nextStep: 'Book discovery call', notes: 'Has 50K followers, serious buyer',
    createdAt: d(-5), updatedAt: d(-4),
  },
];

export const sampleClients: Client[] = [
  {
    id: 'client-1', name: 'David Kim', company: 'NexGen Solutions', linkedinUrl: '', email: 'david@nexgen.io',
    retainer: 3500, billingType: 'retainer', projectValue: 0, status: 'active', startDate: d(-90),
    churnDate: null, churnReason: null,
    pillars: ['Leadership', 'AI/Tech', 'Company Culture'],
    postingSchedule: 'Mon, Wed, Fri', notes: 'Great communicator, fast approvals',
    knowledgeGraph: {
      ...emptyKG,
      targetDemographics: 'B2B SaaS founders, 25-45, Series A-C',
      competitors: ['TechCorp', 'InnovateLabs'],
      brandVoice: 'Authoritative yet approachable, data-driven',
      contentGoals: 'Thought leadership, lead generation',
    },
    activities: [
      { id: genId(), date: d(-7), type: 'meeting', notes: 'Monthly strategy review' },
    ],
    createdAt: d(-90), updatedAt: d(-7),
  },
  {
    id: 'client-2', name: 'Emily Zhang', company: 'Quantum Capital', linkedinUrl: '', email: 'emily@quantum.vc',
    retainer: 5000, billingType: 'retainer', projectValue: 0, status: 'active', startDate: d(-60),
    churnDate: null, churnReason: null,
    pillars: ['Venture Capital', 'Startup Advice', 'Market Trends'],
    postingSchedule: 'Tue, Thu', notes: 'High-touch client, premium service',
    knowledgeGraph: {
      ...emptyKG,
      targetDemographics: 'Startup founders, early-stage investors',
      brandVoice: 'Sharp, insightful, visionary',
      contentGoals: 'Deal flow, brand awareness',
    },
    activities: [],
    createdAt: d(-60), updatedAt: d(-7),
  },
  {
    id: 'client-3', name: 'Robert Chen', company: 'BuildRight', linkedinUrl: '', email: 'robert@buildright.com',
    retainer: 2500, billingType: 'retainer', projectValue: 0, status: 'active', startDate: d(-120),
    churnDate: null, churnReason: null,
    pillars: ['Construction Tech', 'Entrepreneurship'],
    postingSchedule: 'Mon, Wed, Fri', notes: 'Long-term client, very loyal',
    knowledgeGraph: emptyKG,
    activities: [],
    createdAt: d(-120), updatedAt: d(-14),
  },
  {
    id: 'client-4', name: 'Anna White', company: 'FitTech', linkedinUrl: '', email: '',
    retainer: 3000, billingType: 'retainer', projectValue: 0, status: 'churned', startDate: d(-180),
    churnDate: d(-30), churnReason: 'budget',
    pillars: ['HealthTech', 'Fitness'],
    postingSchedule: 'Tue, Thu', notes: 'Budget cuts, might return Q3',
    knowledgeGraph: emptyKG,
    activities: [],
    createdAt: d(-180), updatedAt: d(-30),
  },
];

export const samplePosts: Post[] = [
  {
    id: genId(), clientId: 'client-1', title: '5 Leadership Lessons from Scaling to 100 Employees',
    content: 'Here are 5 leadership lessons I learned...', pillar: 'Leadership',
    status: 'published', scheduledDate: d(-5), publishedDate: d(-5),
    impressions: 12500, reactions: 234, comments: 45, saves: 67, shares: 23,
    profileViews: 89, linkClicks: 12, dmsFromPost: 3, leadsFromPost: 1,
    postUrl: '', notes: '', imageUrl: '', trackingLog: [
      { id: genId(), date: d(-5), impressions: 2000, reactions: 50, comments: 10, saves: 10, shares: 3, profileViews: 15, linkClicks: 2, dmsFromPost: 0, leadsFromPost: 0 },
      { id: genId(), date: d(-4), impressions: 8000, reactions: 150, comments: 30, saves: 40, shares: 12, profileViews: 50, linkClicks: 7, dmsFromPost: 1, leadsFromPost: 0 },
      { id: genId(), date: d(-3), impressions: 12500, reactions: 234, comments: 45, saves: 67, shares: 23, profileViews: 89, linkClicks: 12, dmsFromPost: 3, leadsFromPost: 1 },
    ],
    commentLog: [], dmLog: [], createdAt: d(-7), updatedAt: d(-3),
  },
  {
    id: genId(), clientId: 'client-1', title: 'Why AI Won\'t Replace Your Job (But This Will)',
    content: 'AI is a tool, not a replacement...', pillar: 'AI/Tech',
    status: 'published', scheduledDate: d(-3), publishedDate: d(-3),
    impressions: 28000, reactions: 456, comments: 89, saves: 120, shares: 45,
    profileViews: 156, linkClicks: 34, dmsFromPost: 5, leadsFromPost: 2,
    postUrl: '', notes: 'Went semi-viral', imageUrl: '', trackingLog: [
      { id: genId(), date: d(-3), impressions: 5000, reactions: 100, comments: 20, saves: 20, shares: 8, profileViews: 30, linkClicks: 5, dmsFromPost: 1, leadsFromPost: 0 },
      { id: genId(), date: d(-2), impressions: 18000, reactions: 300, comments: 60, saves: 80, shares: 30, profileViews: 100, linkClicks: 20, dmsFromPost: 3, leadsFromPost: 1 },
      { id: genId(), date: d(-1), impressions: 28000, reactions: 456, comments: 89, saves: 120, shares: 45, profileViews: 156, linkClicks: 34, dmsFromPost: 5, leadsFromPost: 2 },
    ],
    commentLog: [], dmLog: [], createdAt: d(-5), updatedAt: d(-1),
  },
  {
    id: genId(), clientId: 'client-2', title: 'The VC Funding Playbook for 2025',
    content: 'Here\'s what I look for in a pitch...', pillar: 'Venture Capital',
    status: 'published', scheduledDate: d(-2), publishedDate: d(-2),
    impressions: 8900, reactions: 178, comments: 34, saves: 45, shares: 12,
    profileViews: 67, linkClicks: 23, dmsFromPost: 2, leadsFromPost: 0,
    postUrl: '', notes: '', imageUrl: '', trackingLog: [], commentLog: [], dmLog: [],
    createdAt: d(-4), updatedAt: d(-1),
  },
  {
    id: genId(), clientId: 'personal', title: 'How I Built a $15K/mo Ghostwriting Business',
    content: 'Here\'s my journey building a LinkedIn ghostwriting agency...', pillar: 'Personal Brand',
    status: 'published', scheduledDate: d(-4), publishedDate: d(-4),
    impressions: 35000, reactions: 620, comments: 112, saves: 180, shares: 67,
    profileViews: 234, linkClicks: 45, dmsFromPost: 8, leadsFromPost: 3,
    postUrl: '', notes: 'Best personal post this month', imageUrl: '', trackingLog: [], commentLog: [], dmLog: [],
    createdAt: d(-6), updatedAt: d(-2),
  },
  {
    id: genId(), clientId: 'client-1', title: 'Company Culture Is Your Competitive Advantage',
    content: 'Culture eats strategy for breakfast...', pillar: 'Company Culture',
    status: 'scheduled', scheduledDate: d(1), publishedDate: null,
    impressions: 0, reactions: 0, comments: 0, saves: 0, shares: 0,
    profileViews: 0, linkClicks: 0, dmsFromPost: 0, leadsFromPost: 0,
    postUrl: '', notes: '', imageUrl: '', trackingLog: [], commentLog: [], dmLog: [],
    createdAt: d(-2), updatedAt: d(-2),
  },
  {
    id: genId(), clientId: 'client-2', title: 'Why Most Startups Fail at Fundraising',
    content: 'The number one mistake founders make...', pillar: 'Startup Advice',
    status: 'drafting', scheduledDate: d(3), publishedDate: null,
    impressions: 0, reactions: 0, comments: 0, saves: 0, shares: 0,
    profileViews: 0, linkClicks: 0, dmsFromPost: 0, leadsFromPost: 0,
    postUrl: '', notes: 'Need client review', imageUrl: '', trackingLog: [], commentLog: [], dmLog: [],
    createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: genId(), clientId: 'client-3', title: 'How Technology Is Transforming Construction',
    content: 'The construction industry is ripe for disruption...', pillar: 'Construction Tech',
    status: 'published', scheduledDate: d(-1), publishedDate: d(-1),
    impressions: 5600, reactions: 98, comments: 23, saves: 34, shares: 8,
    profileViews: 45, linkClicks: 11, dmsFromPost: 1, leadsFromPost: 0,
    postUrl: '', notes: '', imageUrl: '', trackingLog: [], commentLog: [], dmLog: [],
    createdAt: d(-3), updatedAt: today(),
  },
  {
    id: genId(), clientId: 'client-3', title: 'The Entrepreneurial Mindset in Construction',
    content: 'What building a company taught me about building buildings...', pillar: 'Entrepreneurship',
    status: 'review', scheduledDate: d(2), publishedDate: null,
    impressions: 0, reactions: 0, comments: 0, saves: 0, shares: 0,
    profileViews: 0, linkClicks: 0, dmsFromPost: 0, leadsFromPost: 0,
    postUrl: '', notes: '', imageUrl: '', trackingLog: [], commentLog: [], dmLog: [],
    createdAt: d(-1), updatedAt: d(-1),
  },
];

export const sampleTasks: Task[] = [
  {
    id: genId(), title: 'Write LinkedIn bio update', description: 'Update personal LinkedIn headline and summary',
    category: 'personal', clientId: null, status: 'todo', priority: 'medium',
    dueDate: d(2), timeEntries: [], timerRunning: false, timerStartedAt: null,
    createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: genId(), title: 'Draft 3 posts for David Kim', description: 'Q2 content batch for NexGen Solutions',
    category: 'client', clientId: 'client-1', status: 'in_progress', priority: 'high',
    dueDate: d(1), timeEntries: [
      { id: genId(), date: d(-1), hours: 2.5, isManual: true, notes: 'Research and outline' },
    ], timerRunning: false, timerStartedAt: null,
    createdAt: d(-2), updatedAt: d(-1),
  },
  {
    id: genId(), title: 'Strategy call prep for Quantum Capital', description: 'Prepare slides and analytics report',
    category: 'client', clientId: 'client-2', status: 'todo', priority: 'urgent',
    dueDate: d(0), timeEntries: [], timerRunning: false, timerStartedAt: null,
    createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: genId(), title: 'Outbound DM campaign - Week 12', description: 'Send 50 personalized DMs to SaaS founders',
    category: 'personal', clientId: null, status: 'in_progress', priority: 'high',
    dueDate: d(3), timeEntries: [
      { id: genId(), date: d(-1), hours: 1.0, isManual: true, notes: 'First 15 DMs' },
    ], timerRunning: false, timerStartedAt: null,
    createdAt: d(-2), updatedAt: d(-1),
  },
];
