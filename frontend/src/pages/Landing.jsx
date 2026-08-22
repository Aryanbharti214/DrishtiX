import React from "react";
import { ArrowRight, Bot, CheckCircle2, Image, Moon, ShieldCheck, Sun, Target } from "lucide-react";
import BrandName from "../components/BrandName";
import { useSettings } from "../context/SettingsContext";
import { getTranslation } from "../services/translations";

export default function Landing({ onAccess }) {
  const { language, isDarkMode, setIsDarkMode } = useSettings();
  const t = (key) => getTranslation(language, key);
  const workflow = [
    [Image, t("landing.workflow.imagery")],
    [Bot, t("landing.workflow.ai")],
    [CheckCircle2, t("landing.workflow.verify")],
    [Target, t("landing.workflow.priority")],
  ];

  return (
    <div className="landing-page min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-[76vh] overflow-hidden flex flex-col">
        <img src="/drishtix-flood-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="landing-hero-overlay-primary absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30" />
        <div className="landing-hero-overlay-secondary absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/45" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-2.5 text-orange-500">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <BrandName className="font-mono text-lg font-black tracking-[0.16em]" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"} className="landing-theme-toggle rounded-lg border border-white/20 bg-white/10 p-2 backdrop-blur hover:bg-white/15">
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-blue-700" />}
            </button>
            <button type="button" onClick={onAccess} className="landing-access-button rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur hover:bg-white/15">
              {t("landing.authorizedLogin")}
            </button>
          </div>
        </nav>

        <div className="relative z-10 flex flex-1 items-center px-6 py-16 md:px-12 lg:px-20">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-orange-400">{t("landing.eyebrow")}</p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {t("landing.titlePrefix")} <span className="text-orange-500">{t("landing.titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">{t("landing.description")}</p>
            <button type="button" onClick={onAccess} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-black shadow-lg shadow-orange-950/40 hover:bg-orange-500">
              {t("landing.accessPlatform")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-3 md:grid-cols-4">
          {workflow.map(([Icon, label], index) => (
            <div key={label} className="landing-workflow-card relative rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <Icon className="h-5 w-5 text-orange-500" />
                <span className="font-mono text-[10px] text-slate-600">0{index + 1}</span>
              </div>
              <p className="text-sm font-bold">{label}</p>
            </div>
          ))}
        </div>
        <div className="landing-about mt-14 grid gap-6 border-t border-slate-800 pt-10 md:grid-cols-[1fr_2fr]">
          <h2 className="text-2xl font-black">{t("landing.aboutTitle")}</h2>
          <p className="leading-7 text-slate-400">{t("landing.aboutText")}</p>
        </div>
      </section>

      <footer className="landing-footer border-t border-slate-800 px-6 py-6 text-center text-xs text-slate-500">
        <BrandName className="font-mono font-bold tracking-widest" /> · {t("landing.footer")}
      </footer>
    </div>
  );
}
