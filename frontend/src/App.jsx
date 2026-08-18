import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DisasterMap from './pages/DisasterMap';
import Priorities from './pages/Priorities';
import Verification from './pages/Verification';
import Findings from './pages/Findings';
import Evidence from './pages/Evidence';
import Imagery from './pages/Imagery';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { getHealth } from './services/api';
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isDarkMode } = useSettings();

  useEffect(() => { async function checkSystemHealth() { try { const result = await getHealth(); console.log( "DrishtiX system health:", result ); } catch (error) { console.error( "DrishtiX health check failed:", error ); } } checkSystemHealth(); }, []);
  // Apply dark/light mode to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  // Show Login page before entering the command center
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] font-sans transition-colors">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col">
        <Header eventName="Odisha Flood 2026" onNavigate={setActiveTab} onSignOut={handleSignOut} />

        <main className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard setActiveTab={setActiveTab} />
          )}

          {activeTab === 'map' && <DisasterMap />}

          {activeTab === 'priorities' && (
            <Priorities setActiveTab={setActiveTab} />
          )}

          {activeTab === 'verify' && <Verification />}

          {activeTab === 'findings' && <Findings />}

          {activeTab === 'evidence' && <Evidence />}

          {activeTab === 'imagery' && <Imagery />}

          {activeTab === 'settings' && (
            <Settings onSignOut={handleSignOut} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}