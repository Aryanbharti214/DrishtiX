import React from 'react';
import { Shield, FileText, Calendar, HardDrive } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';

export default function EvidenceCard({ evidence }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-start border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-brand-blue" />
          <h4 className="font-bold text-navy-900 text-sm">{evidence?.title || "Evidence Record #102"}</h4>
        </div>
        <ConfidenceBadge confidence={evidence?.confidence || 91} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Timestamp: {evidence?.timestamp || "12 Aug 2026, 17:04 IST"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-gray-400" />
          <span>Source: {evidence?.source || "Drone Feed #4 (Raw)"}</span>
        </div>
      </div>

      <div className="bg-surface-bg p-3 rounded text-xs text-gray-700">
        <p className="font-semibold text-navy-900 mb-1">AI Detection Summary:</p>
        <p>{evidence?.summary || "Structural failure detected along north wall. Road blockade confirmed within 15 meters."}</p>
      </div>
    </div>
  );
}