import React from 'react';
import PriorityCard from '../components/PriorityCard';
import { mockPriorities } from '../data/mockData';

export default function Priorities({ setActiveTab }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900">Priority Inspection Queue</h2>
        <p className="text-xs text-gray-500">Ranked automatically by Damage, Vulnerability, and Road Accessibility metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPriorities.map((item) => (
          <PriorityCard 
            key={item.id} 
            priority={item} 
            onViewEvidence={() => setActiveTab && setActiveTab('evidence')} 
          />
        ))}
      </div>
    </div>
  );
}