import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import PriorityCard from '../components/PriorityCard';
import { mockDashboardStats, mockPriorities } from '../data/mockData';
import { 
  Image, 
  AlertOctagon, 
  Navigation, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowUpRight, 
  Crosshair, 
  Scan,
  Radio
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [radarScanning, setRadarScanning] = useState(true);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert (GovTech Incident Banner matching login notice styling) */}
      <div className="theme-card p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 shadow-sm border-l-4 border-l-amber-500 bg-[var(--bg-card)]">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm tracking-wide font-mono text-[var(--text-primary)]">
                ODISHA FLOODS 2026
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                DEFCON 2 ACTIVE
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              AI neural models and telemetry streams active. Responder verification required for priority dispatch.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('priorities')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center space-x-2 font-mono cursor-pointer"
        >
          <span>PRIORITY QUEUE</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Metric Cards Grid (Standardized SIH Overview Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Drone Images Analyzed" 
          value={mockDashboardStats.totalImages} 
          icon={Image} 
          badgeColor="bg-blue-500/10 text-blue-600 dark:text-blue-400" 
          borderColor="border-[var(--border-color)]"
        />
        <StatCard 
          label="Damaged Structures" 
          value={mockDashboardStats.damagedBuildings} 
          icon={AlertOctagon} 
          badgeColor="bg-red-500/10 text-red-600 dark:text-red-400" 
          borderColor="border-[var(--border-color)]"
        />
        <StatCard 
          label="Blocked Supply Routes" 
          value={mockDashboardStats.blockedRoutes} 
          icon={Navigation} 
          badgeColor="bg-amber-500/10 text-amber-600 dark:text-amber-400" 
          borderColor="border-[var(--border-color)]"
        />
        <StatCard 
          label="Pending Verification" 
          value={mockDashboardStats.pendingVerification} 
          icon={CheckCircle2} 
          badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
          borderColor="border-[var(--border-color)]"
        />
      </div>

      {/* Geospatial Radar HUD + Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Radar Visualizer */}
        <div className="lg:col-span-2 theme-card rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center space-x-2 font-mono">
                <Crosshair className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-[var(--text-primary)]">
                  Interactive Geospatial Radar HUD
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Simulated real-time satellite sweep over Bhubaneswar sector
              </p>
            </div>
            
            <button 
              onClick={() => setActiveTab('map')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono font-semibold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>TACTICAL MAP</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Radar HUD Screen */}
          <div 
            onClick={() => setActiveTab('map')}
            className="w-full h-80 rounded-lg relative flex items-center justify-center overflow-hidden border border-[var(--border-color)] group cursor-pointer bg-[var(--bg-main)]"
          >
            {/* Concentric Radar Rings */}
            <div className="absolute w-64 h-64 border border-blue-500/20 rounded-full"></div>
            <div className="absolute w-44 h-44 border border-blue-500/25 rounded-full"></div>
            <div className="absolute w-24 h-24 border border-blue-500/30 rounded-full"></div>
            <div className="absolute w-full h-[1px] bg-blue-500/15"></div>
            <div className="absolute h-full w-[1px] bg-blue-500/15"></div>

            {/* Rotating Radar Sweep Line */}
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500/15 via-transparent to-transparent animate-radar pointer-events-none"></div>

            {/* Target Hotspots */}
            <div className="absolute top-[30%] left-[65%] w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-[30%] left-[65%] w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>

            <div className="absolute top-[60%] left-[35%] w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
            <div className="absolute top-[60%] left-[35%] w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>

            {/* Center Overlay Tag */}
            <div className="z-10 bg-[var(--bg-card)]/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-[var(--border-color)] shadow-md group-hover:scale-105 transition-transform flex items-center space-x-3">
              <Scan className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-pulse" />
              <div className="font-mono text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">2 HOTSPOTS DETECTED IN SECTOR</p>
                <p className="text-[10px] text-[var(--text-secondary)]">CLICK TO LAUNCH INTERACTIVE GEOSPATIAL MAP</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-[var(--border-color)] flex justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span>COORDINATES: 20.2961° N, 85.8245° E</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
              <Radio className="w-3 h-3 inline animate-pulse" />
              <span>RADAR TELEMETRY LOCK: 100%</span>
            </span>
          </div>
        </div>

        {/* Priority Queue Column */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider font-mono">
              Priority Queue
            </h3>
            <button 
              onClick={() => setActiveTab('priorities')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All Queue →
            </button>
          </div>

          <div className="space-y-3">
            {mockPriorities.slice(0, 2).map((item) => (
              <PriorityCard 
                key={item.id} 
                priority={item} 
                onViewEvidence={() => setActiveTab('evidence')} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}