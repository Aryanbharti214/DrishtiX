import React from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import StatusBadge from './StatusBadge';
import { MapPin, AlertCircle } from 'lucide-react';

export default function FindingCard({ finding, onSelect }) {
  return (
    <div 
      onClick={() => onSelect && onSelect(finding)}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:border-brand-blue transition-all cursor-pointer shadow-sm space-y-3"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <AlertCircle className={`w-4 h-4 ${
            finding?.severity === 'Severe' ? 'text-brand-red' : 'text-brand-amber'
          }`} />
          <h4 className="font-bold text-navy-900 text-sm">{finding?.title || "Building Damage #102"}</h4>
        </div>
        <StatusBadge status={finding?.status || "Pending"} />
      </div>

      <div className="flex items-center text-xs text-gray-500 space-x-1">
        <MapPin className="w-3.5 h-3.5" />
        <span>{finding?.location || "Bhubaneswar Sector 4"}</span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
        <span className="text-gray-500">AI Model Output:</span>
        <ConfidenceBadge confidence={finding?.confidence || 91} />
      </div>
    </div>
  );
}