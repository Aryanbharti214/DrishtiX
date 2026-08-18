import React, { useState } from 'react';
import { Sparkles, Scan, Eye, Layers, Upload, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export default function Imagery() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <h2 className="text-xl font-extrabold tracking-wide font-mono">DRONE & SATELLITE INTELLIGENCE</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interactive dual-layer imagery analysis & automated structural AI damage detection
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center space-x-2 ${
              showBoundingBoxes 
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-lg' 
                : 'theme-card text-slate-400'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>AI BOUNDING BOXES: {showBoundingBoxes ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Comparison Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Before/After Image Slider */}
        <div className="lg:col-span-2 theme-card rounded-2xl p-5 space-y-4 shadow-2xl relative">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowLeftRight className="w-4 h-4 text-sky-400" /> DRAG SLIDER TO COMPARE CHANGE
            </span>
            <span className="text-sky-400 font-bold">GRID #402-A (Bhubaneswar Floodplain)</span>
          </div>

          {/* Interactive Image Container */}
          <div className="relative h-96 w-full rounded-xl overflow-hidden select-none border border-slate-700/50 group">
            {/* After Image (Background layer) */}
            <img 
              src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80" 
              alt="After Disaster Flood Inundation"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute top-4 right-4 bg-red-600/90 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-md shadow-md z-10">
              POST-DISASTER (12 AUG 2026)
            </span>

            {/* Before Image (Clipped Overlay) */}
            <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ width: `${sliderPosition}%` }}
            >
              <img 
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80" 
                alt="Before Disaster Pre-event"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              <span className="absolute top-4 left-4 bg-emerald-600/90 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-md shadow-md z-10">
                PRE-DISASTER ARCHIVE
              </span>
            </div>

            {/* AI Bounding Box Overlays */}
            {showBoundingBoxes && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Damage Box 1 */}
                <div className="absolute top-[35%] left-[60%] w-28 h-20 border-2 border-red-500 bg-red-500/20 rounded-md animate-pulse">
                  <span className="absolute -top-5 left-0 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                    STRUCTURAL COLLAPSE (98%)
                  </span>
                </div>

                {/* Damage Box 2 */}
                <div className="absolute top-[60%] left-[25%] w-36 h-24 border-2 border-amber-500 bg-amber-500/20 rounded-md">
                  <span className="absolute -top-5 left-0 bg-amber-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                    ROADWAY BLOCKED (87%)
                  </span>
                </div>
              </div>
            )}

            {/* Range Input Control */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliderPosition} 
              onChange={(e) => setSliderPosition(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />

            {/* Visual Divider Line */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-sky-400 pointer-events-none z-20 shadow-[0_0_15px_#00f0ff]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-sky-400 text-slate-900 rounded-full flex items-center justify-center shadow-lg font-bold">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>AI Model: <b>ResNet-50 FloodNet v4</b></span>
            <span>Inference Speed: <b>42ms</b></span>
          </div>
        </div>

        {/* Direct Imagery Upload & Live AI Analysis Panel */}
        <div className="theme-card rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm uppercase font-mono tracking-wider mb-1">Ingest New Drone Footage</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload geotagged JPG/PNG imagery or drone orthomosaics for automated neural analysis.
            </p>

            {/* Drop Zone */}
            <div className="border-2 border-dashed border-slate-700/80 hover:border-sky-400 rounded-xl p-6 text-center space-y-3 cursor-pointer transition-all bg-sky-500/5 group">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold">Click to upload or drag & drop</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">GeoTIFF, JPG, PNG up to 50MB</p>
              </div>
            </div>
          </div>

          {/* AI Analysis Summary */}
          <div className="space-y-3 pt-4 border-t border-slate-700/50 font-mono text-xs">
            <p className="text-slate-400 font-bold uppercase text-[10px]">CURRENT INGESTION TELEMETRY</p>
            <div className="flex justify-between">
              <span className="text-slate-400">Detections Flagged:</span>
              <span className="text-red-400 font-bold">14 Hazards</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Average Confidence:</span>
              <span className="text-emerald-400 font-bold">94.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Priority Level:</span>
              <span className="text-amber-400 font-bold">HIGH (URGENT)</span>
            </div>

            <button 
              onClick={() => alert("Simulation: AI analysis completed! 3 new structural collapses appended to Priority Dispatch Queue.")}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-slate-900 font-bold font-mono text-xs rounded-xl shadow-lg transition-all mt-2 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>RUN NEURAL DETECTION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}