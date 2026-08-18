import React from 'react';
import { ShieldCheck, FileCheck, Cpu, Image as ImageIcon } from 'lucide-react';

export default function Evidence() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Audit & Evidence Chain
        </h2>

        <p className="text-xs text-muted-foreground">
          Verifiable trace from raw drone imagery to final priority score.
        </p>
      </div>

      {/* Evidence Card */}
      <div className="bg-background text-foreground p-6 rounded-lg border border-border shadow-sm space-y-6">

        {/* Location Summary */}
        <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border border-border">

          <div className="p-3 bg-blue-600 text-white rounded-full">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-foreground text-sm">
              Location: Building #102
            </h3>

            <p className="text-xs text-muted-foreground">
              Priority Rank #1 • Overall Priority Score: 91/100
            </p>
          </div>

        </div>

        {/* Step-by-Step Chain */}
        <div className="space-y-4 border-l-2 border-blue-600 pl-6 ml-4">

          {/* Step 1 */}
          <div className="relative">

            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-background"></span>

            <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
              <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>1. Raw Image Ingestion</span>
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              Source: Drone Feed #4 • Timestamp: 12 Aug 2026, 17:04 IST
            </p>

          </div>

          {/* Step 2 */}
          <div className="relative pt-2">

            <span className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-blue-600 border-2 border-background"></span>

            <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>2. AI Inference Engine</span>
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              Model: Damage Model v1.2 • Class: Severe Building Damage (91% confidence)
            </p>

          </div>

          {/* Step 3 */}
          <div className="relative pt-2">

            <span className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-green-600 border-2 border-background"></span>

            <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
              <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>3. Responder Verification</span>
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              Verified by: NDRF Responder Megha • Status: Confirmed
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}