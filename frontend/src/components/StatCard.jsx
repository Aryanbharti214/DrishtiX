import React from 'react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  badgeColor,
  borderColor
}) {
  return (
    <div
      className={`theme-card p-5 rounded-2xl border-l-4 ${borderColor} shadow-xl flex items-center justify-between transition-all`}
    >
      <div className="space-y-1">

        {/* Label */}
        <p className="text-[11px] font-mono font-bold theme-text-muted uppercase tracking-wider">
          {label}
        </p>

        {/* Number */}
        <p className="text-3xl font-black font-mono tracking-tight">
          {value}
        </p>

      </div>

      {/* Icon */}
      <div
        className={`p-3.5 rounded-xl ${badgeColor} border border-white/5`}
      >
        <Icon className="w-6 h-6" />
      </div>

    </div>
  );
}