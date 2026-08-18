import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, Globe } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getTranslation, languages } from '../services/translations';

export default function UserMenu({ onNavigate, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { language, setLanguage, userProfile } = useSettings();

  const t = (keyPath) => getTranslation(language, keyPath);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSettings = () => {
    onNavigate('settings');
    setIsOpen(false);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    onSignOut();
  };

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg theme-card hover:bg-[var(--bg-card-hover)] transition-colors border border-[var(--border-color)]"
        title="User Menu"
      >
        <div className="w-8 h-8 bg-orange-600/20 border border-orange-600/40 rounded-full flex items-center justify-center text-orange-600">
          <User className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-[var(--text-primary)] hidden sm:inline">
          {userProfile.officerId}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl z-[9999] overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card-hover)]">
            <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">
              {t('settings.profile')}
            </div>
            <div className="text-sm font-mono text-[var(--text-primary)]">
              {userProfile.officerId}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              {userProfile.role}
            </div>
          </div>

          {/* Language Selection */}
          <div className="px-4 py-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
              <Globe className="w-3 h-3" />
              {t('settings.language')}
            </div>
            <div className="space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    language === lang.code
                      ? 'bg-orange-600/20 text-orange-600 font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors text-sm border-b border-[var(--border-color)]"
          >
            <Settings className="w-4 h-4 text-orange-600" />
            <span>{t('settings.title')}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-600/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('settings.signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
