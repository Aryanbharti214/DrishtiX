import React from 'react';
import ConfidenceBadge from '../components/ConfidenceBadge';
import StatusBadge from '../components/StatusBadge';
import { mockMapFindings } from '../data/mockData';

export default function Findings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          AI Damage Findings
        </h2>

        <p className="text-xs theme-text-muted">
          List of all structural and route damages detected by AI models.
        </p>
      </div>

      <div className="theme-card rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs uppercase tracking-wider">
              <th className="p-4">Finding ID</th>
              <th className="p-4">Location</th>
              <th className="p-4">Type</th>
              <th className="p-4">Confidence</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-primary)]">
            {mockMapFindings.map((finding) => (
              <tr
                key={finding.id}
                className="hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <td className="p-4 font-bold">{finding.id}</td>
                <td className="p-4">{finding.title}</td>
                <td className="p-4">{finding.type}</td>
                <td className="p-4">
                  <ConfidenceBadge confidence={finding.confidence} />
                </td>
                <td className="p-4">
                  <StatusBadge status={finding.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}