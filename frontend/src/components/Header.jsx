import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Activity,
} from 'lucide-react';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../services/translations';
import BrandedText from './BrandedText';

export default function Header({ eventName, onNavigate, onSignOut }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isDarkMode, setIsDarkMode, language } = useSettings();

  const t = (keyPath) => getTranslation(language, keyPath);

  // Live clock - updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date and time separately so we can use a comma
  const datePart = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(currentTime);

  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  }).format(currentTime);

  const formattedDateTime = `${datePart}, ${timePart}`;

  return (
    <header className="theme-card border-b px-6 py-4 flex flex-wrap justify-between items-center gap-6 sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-card)] border-[var(--border-color)] transition-colors">

      {/* Event Title */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">

        <div className="space-y-1 flex-1">

          {/* Event Name */}
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-3 flex-wrap text-[var(--text-primary)]">

            <span><BrandedText>{eventName}</BrandedText></span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/30">

              <Activity className="w-3 h-3 mr-1 animate-pulse" />

              {t('header.criticalEvent')}

            </span>

          </h2>

          {/* Live Date & Time */}
          <div className="flex items-center space-x-2 font-mono text-[11px] flex-wrap">
            <span className="text-[var(--text-secondary)] font-medium">
              {formattedDateTime}
            </span>
          </div>

        </div>
      </div>

      {/* Search Bar */}
      <SearchBar onNavigate={onNavigate} />

      {/* Controls */}
      <div className="flex items-center space-x-3 flex-shrink-0">

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-mono text-xs font-black shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
        >

          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">{t('header.lightMode')}</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-100" />
              <span className="hidden sm:inline">{t('header.darkMode')}</span>
            </>
          )}

        </button>

        {/* User Menu */}
        <UserMenu onNavigate={onNavigate} onSignOut={onSignOut} />

      </div>
    </header>
  );
}
