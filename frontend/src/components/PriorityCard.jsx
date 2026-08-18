import React from 'react';
import { ShieldAlert, ChevronRight, Check, Target, Compass } from 'lucide-react';

export default function PriorityCard({ priority, onViewEvidence }) {
  return (
    <div className="theme-card rounded-xl p-4 space-y-3.5 shadow-sm border border-[var(--border-color)] bg-[var(--bg-card)] transition-all hover:border-[var(--brand-primary)]">

      {/* Card Header & Priority Ranking */}
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/25 flex items-center font-mono">
              <ShieldAlert className="w-3 h-3 mr-1 animate-pulse" />
              PRIORITY #{priority.rank}
            </span>

            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              LOC-{priority.id}
            </span>
          </div>

          <h3 className="text-sm font-bold tracking-wide text-[var(--text-primary)] truncate">
            {priority.title}
          </h3>

          <p className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center space-x-1">
            <Compass className="w-3 h-3 text-[var(--text-muted)] inline mr-0.5" />
            <span>{priority.location}</span>
          </p>
        </div>

        {/* Priority Score Metric Box */}
        <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-right shrink-0">
          <p className="text-[8.5px] font-mono tracking-wider text-[var(--text-muted)] uppercase font-semibold">
            PRIORITY INDEX
          </p>
          <p className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
            {priority.priorityScore}
            <span className="text-[10px] text-[var(--text-muted)] font-normal">
              /100
            </span>
          </p>
        </div>
      </div>

      {/* Analytical Assessment Meters */}
      <div className="space-y-2 text-xs font-mono">
        {/* Structural Severity Meter */}
        <div>
          <div className="flex justify-between text-[10.5px] mb-1">
            <span className="text-[var(--text-secondary)]">STRUCTURAL SEVERITY</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {priority.damageScore}%
            </span>
          </div>
          <div className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${priority.damageScore}%` }}
            />
          </div>
        </div>

        {/* Vulnerability Index Meter */}
        <div>
          <div className="flex justify-between text-[10.5px] mb-1">
            <span className="text-[var(--text-secondary)]">VULNERABILITY INDEX</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {priority.vulnerabilityScore}%
            </span>
          </div>
          <div className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${priority.vulnerabilityScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Rationale Breakdown */}
      <div className="p-2.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-1.5">
        <p className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
          AI RATIONALE
        </p>
        <div className="space-y-1">
          {priority.reasons?.map((reason, index) => (
            <div key={index} className="flex items-start text-[11px] text-[var(--text-secondary)]">
              <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5 mt-0.5 flex-shrink-0" />
              <span className="leading-tight">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Evidence CTA Button */}
      <button
        onClick={() => onViewEvidence && onViewEvidence(priority)}
        className="w-full py-2 px-3 rounded-lg text-xs font-semibold font-mono flex items-center justify-between transition-all bg-[var(--bg-surface-elevated)] hover:bg-blue-600/10 hover:text-blue-600 dark:hover:text-blue-400 border border-[var(--border-color)] text-[var(--text-primary)] cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <Target className="w-3.5 h-3.5 text-blue-500" />
          <span>AUDIT EVIDENCE CHAIN</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      </button>

    </div>
  );
}