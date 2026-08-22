import React, { useState } from "react";
import { Globe, Layers3, LogOut, Moon, Route, Sun, User } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { getTranslation, languages } from "../services/translations";

function Section({ icon: Icon, title, children }) {
  return <section className="theme-card rounded-xl border border-[var(--border-color)] p-6"><div className="mb-5 flex items-center gap-3"><span className="rounded-lg border border-orange-500/25 bg-orange-500/10 p-2 text-orange-500"><Icon className="h-5 w-5" /></span><h2 className="text-lg font-bold">{title}</h2></div>{children}</section>;
}

export default function Settings({ onSignOut }) {
  const { language, setLanguage, isDarkMode, setIsDarkMode, userProfile, mapPreferences, setMapPreferences } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const t = (key) => getTranslation(language, key);
  const toggleMap = (key) => setMapPreferences((current) => ({ ...current, [key]: !current[key] }));

  return <div className="space-y-6">
    <div className="theme-card rounded-xl border-l-4 border-l-orange-600 p-6"><h1 className="text-3xl font-extrabold">{t("settings.title")}</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Manage your operational display and session preferences.</p></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Section icon={User} title={t("settings.profile")}><dl className="space-y-4 text-sm">{[[t("settings.officerId"), userProfile.officerId], [t("settings.role"), userProfile.role], [t("settings.agency"), userProfile.agency]].map(([label, value]) => <div key={label}><dt className="text-xs text-[var(--text-muted)]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl></Section>
      <Section icon={isDarkMode ? Moon : Sun} title={t("settings.appearance")}><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setIsDarkMode(false)} className={`rounded-lg border p-4 text-sm font-bold ${!isDarkMode ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-[var(--border-color)]"}`}><Sun className="mx-auto mb-2 h-5 w-5" />{t("settings.lightMode")}</button><button type="button" onClick={() => setIsDarkMode(true)} className={`rounded-lg border p-4 text-sm font-bold ${isDarkMode ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-[var(--border-color)]"}`}><Moon className="mx-auto mb-2 h-5 w-5" />{t("settings.darkMode")}</button></div></Section>
      <Section icon={Globe} title={t("settings.language")}><div className="space-y-2">{languages.map((item) => <button type="button" key={item.code} onClick={() => setLanguage(item.code)} className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm ${language === item.code ? "border-orange-500 bg-orange-500/10" : "border-[var(--border-color)]"}`}><span className="font-semibold">{item.nativeName}</span><span className="text-xs text-[var(--text-muted)]">{item.name}</span></button>)}</div></Section>
      <Section icon={Layers3} title={t("settings.map")}><div className="space-y-3"><Preference icon={Layers3} label="Show evidence clusters" checked={mapPreferences.showClusters} onChange={() => toggleMap("showClusters")} /><Preference icon={Route} label="Show selected-cluster relationships" checked={mapPreferences.showRelations} onChange={() => toggleMap("showRelations")} /></div><p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">These preferences control existing map overlays and are saved on this device.</p></Section>
    </div>
    <Section icon={LogOut} title={t("settings.account")}><div className="flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-[var(--text-secondary)]">End the current authorized session on this device.</p>{confirming ? <div className="flex gap-2"><button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-bold">Cancel</button><button type="button" onClick={onSignOut} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">{t("settings.signOut")}</button></div> : <button type="button" onClick={() => setConfirming(true)} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"><LogOut className="h-4 w-4" />{t("settings.signOut")}</button>}</div></Section>
  </div>;
}

function Preference({ icon: Icon, label, checked, onChange }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-color)] p-3"><Icon className="h-4 w-4 text-orange-500" /><span className="flex-1 text-sm font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-orange-600" /></label>;
}
