import { useState, useCallback, useEffect } from 'react';
import type { Prospect, InboundLead, Client, Post, Settings, Section } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { sampleSettings, sampleProspects, sampleInbound, sampleClients, samplePosts } from '../utils/sampleData';

const defaultSettings: Settings = {
  name: '', linkedinUrl: '', email: '', currency: 'USD',
  goals: { monthlyMrr: 10000, monthlyNewClients: 2, weeklyDms: 30, weeklyPosts: 10, monthlyImpressions: 200000 },
  theme: 'dark',
};

export function useAppState() {
  const [prospects, setProspects] = useState<Prospect[]>(() => loadFromStorage('prospects', []));
  const [inbound, setInbound] = useState<InboundLead[]>(() => loadFromStorage('inbound', []));
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage('clients', []));
  const [posts, setPosts] = useState<Post[]>(() => loadFromStorage('posts', []));
  const [settings, setSettings] = useState<Settings>(() => loadFromStorage('settings', defaultSettings));
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => { saveToStorage('prospects', prospects); }, [prospects]);
  useEffect(() => { saveToStorage('inbound', inbound); }, [inbound]);
  useEffect(() => { saveToStorage('clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('posts', posts); }, [posts]);
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
    setSettings(sampleSettings);
    toast('Sample data loaded!');
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

  return {
    prospects, setProspects, updateProspect, deleteProspect,
    inbound, setInbound, updateInbound, deleteInbound,
    clients, setClients, updateClient, deleteClient,
    posts, setPosts, updatePost, deletePost,
    settings, setSettings,
    activeSection, setActiveSection,
    toasts, toast,
    loadSampleData,
  };
}

export type AppContext = ReturnType<typeof useAppState>;
