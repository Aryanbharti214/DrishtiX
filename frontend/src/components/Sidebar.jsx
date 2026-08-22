import React, { useState } from "react";
import { Activity, AlertTriangle, CheckCircle, FileText, Flame, Image as ImageIcon, LayoutDashboard, Map as MapIcon, PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { getTranslation } from "../services/translations";
import BrandName from "./BrandName";

export default function Sidebar({ activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const { language } = useSettings();
  const t = (key) => getTranslation(language, key);
  const items = [
    ["dashboard", "nav.dashboard", LayoutDashboard], ["disasters", "nav.disasters", Activity], ["map", "nav.map", MapIcon],
    ["imagery", "nav.imagery", ImageIcon], ["findings", "nav.findings", AlertTriangle], ["verify", "nav.verify", CheckCircle],
    ["priorities", "nav.priorities", Flame], ["evidence", "nav.evidence", FileText], ["settings", "nav.settings", SettingsIcon],
  ];
  return <aside className={`${collapsed ? "w-[4.75rem]" : "w-72"} sticky top-0 z-40 flex h-screen shrink-0 select-none flex-col justify-between border-r border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-lg transition-[width] duration-200`}>
    <div>
      <div className="border-b border-[var(--border-color)] p-4"><div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        <div className="flex items-center gap-2.5"><div className="rounded-lg border border-orange-600/30 bg-orange-600/10 p-2 text-orange-500"><ShieldCheck className="h-5 w-5" /></div>{!collapsed && <div><h1 className="font-mono text-base font-extrabold tracking-wider"><BrandName /></h1><p className="text-[10px] font-medium text-[var(--text-secondary)]">{t("sidebar.command")}</p></div>}</div>
        {!collapsed && <span className="badge-official rounded px-2 py-0.5">{t("sidebar.official")}</span>}
      </div></div>
      <nav className="space-y-1 p-3.5">{!collapsed && <p className="px-3 pb-1.5 pt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t("sidebar.modules")}</p>}
        {items.map(([id, key, Icon]) => { const active = activeTab === id; return <button key={id} type="button" title={collapsed ? t(key) : undefined} onClick={() => setActiveTab(id)} className={`flex w-full items-center rounded-lg px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${collapsed ? "justify-center" : "gap-3"} ${active ? "border-l-4 border-orange-600 bg-orange-600/15 font-bold text-orange-500" : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"}`}><Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{t(key)}</span>}</button>; })}
      </nav>
    </div>
    <div className="border-t border-[var(--border-color)] bg-[var(--bg-card-hover)] p-3"><button type="button" onClick={() => setCollapsed(v => !v)} className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]" title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}{!collapsed && <span className="text-xs font-semibold">{t("sidebar.collapse")}</span>}</button></div>
  </aside>;
}
