import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Login } from './components/auth/Login';
import { AppCtx } from './hooks/AppContext';
import { useAppState } from './hooks/useAppState';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { OutboundTracker } from './components/outbound/OutboundTracker';
import { InboundTracker } from './components/inbound/InboundTracker';
import { Clients } from './components/clients/Clients';
import { ContentCalendar } from './components/content/ContentCalendar';
import { PostPerformance } from './components/posts/PostPerformance';
import { Analytics } from './components/analytics/Analytics';
import { TaskManager } from './components/tasks/TaskManager';
import { Finance } from './components/finance/Finance';
import { SettingsSection } from './components/settings/Settings';
import { colors } from './utils/theme';

const SectionRouter: React.FC = () => {
  const { activeSection } = React.useContext(AppCtx);
  switch (activeSection) {
    case 'dashboard': return <Dashboard />;
    case 'outbound': return <OutboundTracker />;
    case 'inbound': return <InboundTracker />;
    case 'clients': return <Clients />;
    case 'content': return <ContentCalendar />;
    case 'posts': return <PostPerformance />;
    case 'analytics': return <Analytics />;
    case 'tasks': return <TaskManager />;
    case 'finance': return <Finance />;
    case 'settings': return <SettingsSection />;
    default: return <Dashboard />;
  }
};

function AppInner() {
  const state = useAppState();
  return (
    <AppCtx.Provider value={state}>
      <Layout>
        <SectionRouter />
      </Layout>
    </AppCtx.Provider>
  );
}

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Still loading
  if (session === undefined) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: colors.bg, color: colors.textMuted, fontFamily: 'Inter, sans-serif', fontSize: 14,
      }}>
        Loading…
      </div>
    );
  }

  if (!session) return <Login />;

  return <AppInner />;
}

export default App;
