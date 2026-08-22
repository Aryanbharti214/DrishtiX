import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { localizeDocument } from "../services/translations";

const SettingsContext = createContext(null);

export function SettingsProvider({
  children,
}) {
  const [language, setLanguage] =
    useState(() => {
      return (
        localStorage.getItem(
          "drishtix-language"
        ) || "en"
      );
    });

  const [
    isDarkMode,
    setIsDarkMode,
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        "drishtix-dark-mode"
      );

    if (saved === null) {
      return true;
    }

    return saved === "true";
  });

  const [
    userProfile,
    setUserProfile,
  ] = useState({
    officerId: "NDRF-2026",
    role: "Senior Officer",
    agency:
      "National Disaster Response Force",
  });

  const [mapPreferences, setMapPreferences] = useState(() => {
    try {
      return { showClusters: true, showRelations: true, ...(JSON.parse(localStorage.getItem("drishtix-map-preferences")) || {}) };
    } catch {
      return { showClusters: true, showRelations: true };
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "drishtix-language",
      language
    );
  }, [language]);

  useEffect(() => {
    localStorage.setItem(
      "drishtix-dark-mode",
      String(isDarkMode)
    );
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("drishtix-map-preferences", JSON.stringify(mapPreferences));
  }, [mapPreferences]);

  useEffect(() => {
    const apply = () => localizeDocument(language);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,

      isDarkMode,
      setIsDarkMode,

      userProfile,
      setUserProfile,
      mapPreferences,
      setMapPreferences,
    }),
    [
      language,
      isDarkMode,
      userProfile,
      mapPreferences,
    ]
  );

  return (
    <SettingsContext.Provider
      value={value}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context =
    useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider"
    );
  }

  return context;
}
