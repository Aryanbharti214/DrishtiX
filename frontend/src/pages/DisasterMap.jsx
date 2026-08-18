import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import { mockMapFindings } from '../data/mockData';
import { Filter, MapPin, Target, Crosshair, Pencil, ShieldAlert, Waves, Sparkles, Check } from 'lucide-react';

export default function DisasterMap() {
  const center = [20.2961, 85.8245];
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [strokeMarkingActive, setStrokeMarkingActive] = useState(false);
  const [pencilNotes, setPencilNotes] = useState([
    { id: 1, title: 'Bridge Collapse Hazard', lat: 20.3010, lng: 85.8200 },
    { id: 2, title: 'Hospital Evacuation Zone', lat: 20.2910, lng: 85.8350 }
  ]);

  const filteredFindings = mockMapFindings.filter(f => 
    filterSeverity === 'All' ? true : f.severity === filterSeverity
  );

  // Inundation area polygon
  const floodPolygon = [
    [20.3100, 85.8150],
    [20.3150, 85.8400],
    [20.2850, 85.8450],
    [20.2800, 85.8100],
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col theme-card rounded-2xl overflow-hidden shadow-2xl relative border-2 border-red-500/40">
      {/* Disaster Command Toolbar */}
      <div className="bg-slate-950 p-4 px-6 border-b border-red-500/40 flex flex-wrap justify-between items-center gap-4 z-10 font-mono">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="font-black tracking-wider text-sm text-white uppercase">TACTICAL DISASTER MAP & STROKE MARKER</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Use stroke pencil tool to mark high-hazard disaster boundaries</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Stroke Pencil Mode Button */}
          <button
            onClick={() => setStrokeMarkingActive(!strokeMarkingActive)}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
              strokeMarkingActive 
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/40 border-2 border-white animate-pulse' 
                : 'bg-slate-900 text-orange-400 border border-orange-500/50 hover:bg-orange-500/10'
            }`}
          >
            <Pencil className="w-4 h-4" />
            <span>{strokeMarkingActive ? 'DRAWING DISASTER STROKE: ACTIVE' : 'ENABLE STROKE PENCIL TOOL'}</span>
          </button>

          {/* Severity Filters */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 p-1 rounded-xl text-xs">
            <span className="text-slate-400 px-2 text-[11px]">FILTER:</span>
            {['All', 'Severe', 'Moderate'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  filterSeverity === sev 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className={`flex-1 w-full relative z-0 ${strokeMarkingActive ? 'cursor-crosshair' : ''}`}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; CartoDB Dark Matter'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Inundation Flood Zone */}
          <Polygon 
            positions={floodPolygon}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.2,
              weight: 3,
              dashArray: '6, 12'
            }}
          />

          {/* Disaster Hotspot Rings */}
          {filteredFindings.map((finding) => (
            <Circle
              key={`ring-${finding.id}`}
              center={[finding.lat, finding.lng]}
              radius={finding.severity === 'Severe' ? 550 : 350}
              pathOptions={{
                color: finding.severity === 'Severe' ? '#ef4444' : '#f97316',
                fillColor: finding.severity === 'Severe' ? '#ef4444' : '#f97316',
                fillOpacity: 0.3,
                weight: 2
              }}
            />
          ))}

          {/* Disaster Markers */}
          {filteredFindings.map((finding) => (
            <Marker key={finding.id} position={[finding.lat, finding.lng]}>
              <Popup>
                <div className="p-2 space-y-2 text-slate-900 font-sans">
                  <div className="flex justify-between items-center border-b pb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      finding.severity === 'Severe' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      🚨 {finding.severity} HAZARD
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{finding.id}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{finding.title}</h4>
                  <p className="text-xs text-slate-600">Disaster Type: <b>{finding.type}</b></p>
                  
                  <button 
                    onClick={() => alert(`Marked Hazard Zone ${finding.id} for NDRF Deployment`)}
                    className="w-full mt-2 py-2 bg-red-600 text-white font-extrabold text-[11px] rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1 shadow-md"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>DISPATCH RESCUE TEAM</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Pencil Stroke Drawing HUD Overlay */}
        {strokeMarkingActive && (
          <div className="absolute top-5 left-5 z-[1000] stroke-pencil-box bg-slate-950/95 p-4 rounded-xl text-white font-mono text-xs max-w-xs space-y-2 shadow-2xl">
            <div className="flex items-center justify-between text-orange-400 font-bold border-b border-orange-500/40 pb-2">
              <span className="flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-orange-400" /> PENCIL STROKE ACTIVE
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            </div>
            <p className="text-[11px] text-slate-300">
              Click anywhere on the map to place tactical disaster sketch pins & hazard perimeters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}