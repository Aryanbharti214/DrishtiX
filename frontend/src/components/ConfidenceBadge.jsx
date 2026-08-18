import React from 'react';

export default function ConfidenceBadge({ confidence }) {
  let colorClass = 'bg-green-100 text-brand-green border-green-200';
  if (confidence < 70) colorClass = 'bg-amber-100 text-brand-amber border-amber-200';
  if (confidence < 50) colorClass = 'bg-red-100 text-brand-red border-red-200';

  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${colorClass}`}>
      {confidence}% Confidence
    </span>
  );
}