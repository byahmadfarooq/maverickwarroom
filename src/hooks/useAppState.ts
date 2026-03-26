import { useState, useCallback, useEffect } from 'react';
import type { Prospect, InboundLead, Client, Post, Task, Settings, Section } from '../types';
import { loadFromStorage, saveToStorage, clearAllStorage } from '../utils/storage';
import { sampleSettings, sampleProspects, sampleInbound, sampleClients, samplePosts, sampleTasks } from '../utils/sampleData';

const emptyKG = {
  targetDemographics: '', competitors: [], leadSource: '', brandVoice: '',
  techStack: [], keyContacts: [], industryNotes: '', contentGoals: '',
  idealCustomerProfile: '', tonePreferences: '', painPoints: '', uniqueSellingPoints: '',
};

// Ensure clients loaded from old localStorage have all required fields
function sanitizeClients(raw: unknown[]): import('../types').Client[] {
  return raw.map((c: any) => {
    const merged = {
      billingType: 'retainer', projectValue: 0, email: '',
      churnDate: null, churnReason: null,
      ...c,
    };
    merged.knowledgeGraph = { ...emptyKG, ...(c.knowledgeGraph ?? {}) };
    merged.activities = c.activities ?? [];
    merged.pillars = c.pillars ?? [];
    return merged as import('../types').Client;
  });
}

const defaultSettings: Settings = {
  name: '', linkedinUrl: '', email: '', currency: 'USD',
  goals: { monthlyMrr: 10000, monthlyNewClients: 2, weeklyDms: 30, weeklyPosts: 10, monthlyImpressions: 200000 },
  finance: { hourlyRate: 50, exchangeRate: 278, cacTotal: 0 },
  theme: 'dark',
};

export function useAppState() {
  const [prospects, setProspects] = useState<Prospect[]>(() => loadFromStorage('prospects', []));
  const [inbound, setInbound] = useState<InboundLead[]>(() => loadFromStorage('inbound', []));
  const [clients, setClients] = useState<Client[]>(() => sanitizeClients(loadFromStorage<unknown[]>('clients', [])));
  const [posts, setPosts] = useState<Post[]>(() => loadFromStorage('posts', []));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tasks', []));
  const [settings, setSettings] = useState<Settings>(() => {
    // Deep-merge so that new keys (e.g. finance) always exist even if old data lacks them
    const raw = loadFromStorage<Partial<Settings>>('settings', defaultSettings);
    return {
      ...defaultSettings,
      ...raw,
      goals: { ...defaultSettings.goals, ...(raw.goals ?? {}) },
      finance: { ...defaultSettings.finance, ...(raw.finance ?? {}) },
    };
  });
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => { saveToStorage('prospects', prospects); }, [prospects]);
  useEffect(() => { saveToStorage('inbound', inbound); }, [inbound]);
  useEffect(() => { saveToStorage('clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('posts', posts); }, [posts]);
  useEffect(() => { saveToStorage('tasks', tasks); }, [tasks]);
  useEffect(() => { saveToStorage('settings', settings); }, [settings]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const loadSampleData = useCallback(() => {
    setProspects(sampleProspects);
    setInbound(sampleInbound);
    setClients(sampleClients);
    setPosts(samplePosts);
    setTasks(sampleTasks);
    setSettings(sampleSettings);
    toast('Sample data loaded successfully');
  }, [toast]);

  const clearAllData = useCallback(() => {
    setProspects([]);
    setInbound([]);
    setClients([]);
    setPosts([]);
    setTasks([]);
    setSettings(defaultSettings);
    clearAllStorage();
    toast('All data cleared');
  }, [toast]);

  const updateProspect = useCallback((id: string, updates: Partial<Prospect>) => {
    setProspects((p) => p.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x)));
  }, []);
  const deleteProspect = useCallback((id: string) => {
    setProspects((p) => p.filter((x) => x.id !== id));
  }, []);

  const updateInbound = useCallback((id: string, updates: Partial<InboundLead>) => {
    setInbound((l) => l.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x)));
  }, []);
  const deleteInbound = useCallback((id: string) => {
    setInbound((l) => l.filter((x) => x.id !== id));
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients((c) => c.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x)));
  }, []);
  const deleteClient = useCallback((id: string) => {
    setClients((c) => c.filter((x) => x.id !== id));
  }, []);

  const updatePost = useCallback((id: string, updates: Partial<Post>) => {
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x)));
  }, []);
  const deletePost = useCallback((id: string) => {
    setPosts((p) => p.filter((x) => x.id !== id));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x)));
  }, []);
  const deleteTask = useCallback((id: string) => {
    setTasks((t) => t.filter((x) => x.id !== id));
  }, []);

  return {
    prospects, setProspects, updateProspect, deleteProspect,
    inbound, setInbound, updateInbound, deleteInbound,
    clients, setClients, updateClient, deleteClient,
    posts, setPosts, updatePost, deletePost,
    tasks, setTasks, updateTask, deleteTask,
    settings, setSettings,
    activeSection, setActiveSection,
    toasts, toast,
    loadSampleData, clearAllData,
  };
}

export type AppContext = ReturnType<typeof useAppState>;
