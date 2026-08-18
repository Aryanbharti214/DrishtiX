import React, { useState } from 'react';
import { Check, X, Edit3 } from 'lucide-react';

export default function Verification() {
  const [status, setStatus] = useState('Pending');

  return (
    <div className="max-w-3xl mx-auto bg-background text-foreground rounded-lg border border-border p-6 shadow-sm space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Responder Review: Finding #LOC-102
          </h2>

          <p className="text-xs text-muted-foreground">
            Verify AI prediction before publishing to responder units.
          </p>
        </div>

        <span
          className={`text-xs px-2.5 py-1 rounded font-bold uppercase ${
            status === 'Confirmed'
              ? 'bg-green-100 text-green-700'
              : status === 'Corrected'
              ? 'bg-amber-100 text-amber-700'
              : status === 'Rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Bounding Box Visualizer */}
        <div className="bg-muted h-64 rounded-lg flex items-center justify-center text-muted-foreground text-xs relative overflow-hidden border border-border">

          <span className="z-10">
            [ Bounding Box Visualizer ]
          </span>

          <div className="absolute inset-8 border-2 border-red-500 rounded flex items-start justify-end p-2">
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              Severe 91%
            </span>
          </div>
        </div>

        {/* AI Assessment */}
        <div className="space-y-4">

          <div className="bg-muted p-4 rounded-md space-y-2 border border-border">

            <p className="text-xs font-semibold text-muted-foreground uppercase">
              AI Assessment
            </p>

            <p className="text-sm font-bold text-foreground">
              Severe Structural Damage
            </p>

            <p className="text-xs text-muted-foreground">
              Model: Damage Model v1.2
            </p>

            <p className="text-xs text-muted-foreground">
              Confidence:{' '}
              <b className="text-green-600 dark:text-green-400">
                91%
              </b>
            </p>

          </div>

          <p className="text-xs font-semibold text-foreground">
            Is this prediction correct?
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">

            <button
              onClick={() => setStatus('Confirmed')}
              className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirm</span>
            </button>

            <button
              onClick={() => setStatus('Corrected')}
              className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Correct</span>
            </button>

            <button
              onClick={() => setStatus('Rejected')}
              className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}