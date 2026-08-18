// src/pages/login.jsx
import React, { useState } from 'react';

export default function Login({onLogin}) {
  const [credentials, setCredentials] = useState({ agencyId: '', password: '' });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Connect to services/api.js when backend is ready
    onLogin(credentials);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Gradient glow effects - Multi-color accent */}
      <div className="absolute w-[500px] h-[500px] bg-blue-800/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-[400px] h-[400px] bg-orange-900/5 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />
      <div className="absolute w-[300px] h-[300px] bg-cyan-900/5 rounded-full blur-3xl pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl backdrop-blur-md p-8 relative z-10">
        
        {/* Header & Status Beacon */}
        {/* Header & Status Beacon */}
<div className="text-center mb-8">

  {/* Platform Name with accent underline */}
  <div className="mb-5">
    <h2 className="text-3xl font-extrabold tracking-[0.25em] text-white">
      DRISHTIX
    </h2>
    <div className="flex gap-2 justify-center mt-2">
      <div className="w-8 h-0.5 bg-blue-600 rounded-full" />
      <div className="w-8 h-0.5 bg-orange-600 rounded-full" />
      <div className="w-8 h-0.5 bg-cyan-600 rounded-full" />
    </div>
  </div>

  {/* Official Access Badge with enhanced styling */}
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-900/30 to-orange-800/20 border border-orange-700/40 text-orange-300 text-xs font-mono tracking-wide uppercase mb-4">
    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
    Official Access Portal
  </div>

  <h1 className="text-2xl font-bold text-white tracking-tight">
    Disaster Response Command
  </h1>

  <p className="text-sm text-slate-400 mt-1">
    Emergency Operations & Situation Analysis
  </p>
  </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Agency ID / Email Input */}
          <div>
            <label 
              htmlFor="agencyId" 
              className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2"
            >
              Officer ID / Agency Email
            </label>
            <input
              id="agencyId"
              name="agencyId"
              type="text"
              required
              value={credentials.agencyId}
              onChange={handleChange}
              placeholder="NDRF-8829 / official@gov.in"
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label 
                htmlFor="password" 
                className="block text-xs font-medium uppercase tracking-wider text-slate-300"
              >
                Access Key / Password
              </label>
              <a 
                href="#forgot" 
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                Reset Key?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-orange-900/20 to-orange-800/10 border-l-2 border-orange-600/80 px-3 py-2 rounded-r-md">
            <p className="text-[11px] leading-relaxed text-slate-300">
              <span className="text-orange-400 font-semibold">Security Notice:</span> All sessions encrypted & logged for incident auditing.
            </p>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-orange-950/50 border border-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all active:scale-[0.99]"
          >
            Authenticate Session
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-mono">
            SECURE ACCESS LAYER • LEVEL 4 DISPATCH
          </p>
        </div>
      </div>
    </div>
  );
}