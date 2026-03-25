import React from 'react';
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
import { SettingsSection } from './components/settings/Settings';

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
    case 'settings': return <SettingsSection />;
    default: return <Dashboard />;
  }
};

function App() {
  const state = useAppState();

  return (
    <AppCtx.Provider value={state}>
      <Layout>
        <SectionRouter />
      </Layout>
    </AppCtx.Provider>
  );
}

export default App;
