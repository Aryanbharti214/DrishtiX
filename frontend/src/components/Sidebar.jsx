import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle, 
  Flame, 
  FileText, 
  ShieldCheck,
  Radio,
  Activity,
  Settings as SettingsIcon
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../services/translations';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { language } = useSettings();
  const t = (keyPath) => getTranslation(language, keyPath);

  const menuItems = [
    { id: 'dashboard', translationKey: 'nav.dashboard', icon: LayoutDashboard },
    { id: 'map', translationKey: 'nav.map', icon: MapIcon },
    { id: 'imagery', translationKey: 'nav.imagery', icon: ImageIcon },
    { id: 'findings', translationKey: 'nav.findings', icon: AlertTriangle },
    { id: 'verify', translationKey: 'nav.verify', icon: CheckCircle },
    { id: 'priorities', translationKey: 'nav.priorities', icon: Flame },
    { id: 'evidence', translationKey: 'nav.evidence', icon: FileText },
    { id: 'settings', translationKey: 'nav.settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-72 bg-[var(--bg-card)] text-[var(--text-primary)] border-r border-[var(--border-color)] flex flex-col justify-between h-screen sticky top-0 z-40 transition-colors duration-200 shadow-lg select-none">
      <div>
        {/* Government Portal Header Branding */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600/15 to-orange-500/10 border border-orange-600/30 text-orange-600 dark:text-orange-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold tracking-wider text-base font-mono text-[var(--text-primary)]">
                  DRISHTIX
                </h1>
                <p className="text-[10px] text-[var(--text-secondary)] font-medium">DISASTER COMMAND</p>
              </div>
            </div>
            <span className="badge-official px-2 py-0.5 rounded">
              OFFICIAL
            </span>
          </div>
        </div>

        {/* Live Incident Status Card (GovTech Amber / Red State) */}
        <div className="mx-3.5 mt-3.5 p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-primary)] tracking-wide">
              ODISHA FLOOD 2026
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
            DEFCON 2
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3.5 space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono px-3 pt-2 pb-1.5">
            Disaster Modules
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-orange-600/15 text-orange-600 dark:text-orange-500 border-l-4 border-orange-600 dark:border-orange-500 shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-orange-600 dark:text-orange-500' : 'text-[var(--text-muted)]'
                  }`}
                />
                <span>{t(item.translationKey)}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Telemetry Live Footer */}
      <div className="p-3.5 border-t border-[var(--border-color)] flex items-center justify-between font-mono text-xs bg-[var(--bg-card-hover)]">
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">NDRF RADAR LIVE</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border-color)] text-[var(--text-muted)] font-semibold">
          v2.4
        </span>
      </div>
    </aside>
  );
}