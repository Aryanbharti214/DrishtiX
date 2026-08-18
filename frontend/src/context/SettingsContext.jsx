import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  const value = useMemo(
    () => ({
      language,
      setLanguage,

      isDarkMode,
      setIsDarkMode,

      userProfile,
      setUserProfile,
    }),
    [
      language,
      isDarkMode,
      userProfile,
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