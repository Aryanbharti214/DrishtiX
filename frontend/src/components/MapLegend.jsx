import React from 'react';

export default function MapLegend() {
  const legendItems = [
    { label: 'Severe Damage / High Risk', color: 'bg-brand-red' },
    { label: 'Moderate Damage / Warning', color: 'bg-brand-amber' },
    { label: 'Verified Safe / Cleared', color: 'bg-brand-green' },
    { label: 'Blocked Supply Line', color: 'bg-brand-blue' },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-md space-y-2 text-xs">
      <p className="font-bold text-navy-900 text-[11px] uppercase tracking-wider">Tactical Map Legend</p>
      <div className="space-y-1.5">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${item.color} inline-block shadow-sm`}></span>
            <span className="text-gray-700 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}