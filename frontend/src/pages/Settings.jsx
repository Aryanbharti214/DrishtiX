import React, { useState } from 'react';
import { Moon, Sun, Globe, User, LogOut, ChevronRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getTranslation, languages } from '../services/translations';

export default function Settings({ onSignOut }) {
  const { language, setLanguage, isDarkMode, setIsDarkMode, userProfile } = useSettings();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const t = (keyPath) => getTranslation(language, keyPath);

  const handleSignOut = () => {
    setShowSignOutConfirm(false);
    onSignOut();
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="theme-card p-6 rounded-xl border-l-4 border-l-orange-600 bg-[var(--bg-card)]">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Manage your preferences and account settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Section */}
        <div className="theme-card p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-600/15 border border-orange-600/30 rounded-lg text-orange-600">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('settings.appearance')}
            </h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors">
              <input
                type="radio"
                name="theme"
                checked={isDarkMode}
                onChange={() => setIsDarkMode(true)}
                className="w-4 h-4 cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-medium text-[var(--text-primary)]">
                  {t('settings.darkMode')}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Tactical dark mode for low-light operations
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors">
              <input
                type="radio"
                name="theme"
                checked={!isDarkMode}
                onChange={() => setIsDarkMode(false)}
                className="w-4 h-4 cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-medium text-[var(--text-primary)]">
                  {t('settings.lightMode')}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Clean light mode for daytime operations
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Language Section */}
        <div className="theme-card p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-600/15 border border-orange-600/30 rounded-lg text-orange-600">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('settings.language')}
            </h2>
          </div>
          <div className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg transition-colors ${
                  language === lang.code
                    ? 'bg-orange-600/20 border border-orange-600/40 text-orange-600'
                    : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{lang.name}</div>
                </div>
                {language === lang.code && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Section */}
        <div className="theme-card p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-600/15 border border-orange-600/30 rounded-lg text-orange-600">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('settings.profile')}
            </h2>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg border border-[var(--border-color)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">
                {t('settings.officerId')}
              </div>
              <div className="text-sm font-mono text-[var(--text-primary)]">
                {userProfile.officerId}
              </div>
            </div>
            <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg border border-[var(--border-color)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">
                {t('settings.role')}
              </div>
              <div className="text-sm text-[var(--text-primary)]">
                {userProfile.role}
              </div>
            </div>
            <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg border border-[var(--border-color)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">
                {t('settings.agency')}
              </div>
              <div className="text-sm text-[var(--text-primary)]">
                {userProfile.agency}
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="theme-card p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-600/15 border border-red-600/30 rounded-lg text-red-600">
              <LogOut className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('settings.account')}
            </h2>
          </div>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-red-600/10 border border-red-600/40 rounded-lg text-red-600 hover:bg-red-600/20 transition-colors font-medium"
          >
            <span>{t('settings.signOut')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              {t('settings.signOut')}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              {t('settings.confirmSignOut')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-2 bg-[var(--bg-card-hover)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-color)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {t('settings.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
