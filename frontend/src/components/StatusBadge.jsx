import React from 'react';

export default function StatusBadge({ status }) {
  const isVerified = status === 'Verified' || status === 'Confirmed';
  
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
      isVerified 
        ? 'bg-green-100 text-brand-green border border-green-200' 
        : 'bg-amber-100 text-brand-amber border border-amber-200'
    }`}>
      {status}
    </span>
  );
}