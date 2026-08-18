import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('drishtix-language') || 'en';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem('drishtix-dark-mode'); return saved === null ? true : saved === 'true'; });
  });

  const [userProfile, setUserProfile] = useState({
    officerId: 'NDRF-2026',
    role: 'Senior Officer',
    agency: 'National Disaster Response Force',
  });

  // Persist language preference
  useEffect(() => {
    localStorage.setItem('drishtix-language', language);
  }, [language]);

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('drishtix-dark-mode', isDarkMode);
  }, [isDarkMode]);

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        isDarkMode,
        setIsDarkMode,
        userProfile,
        setUserProfile,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
