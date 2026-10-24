/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface HeaderProps {
  pulseHeatingActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ pulseHeatingActive }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Simple clean title with no fancy english brand icons */}
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            풍력 발전기 결빙 방지 관제 시스템
          </h1>
        </div>

        {/* Status pill on right */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2 font-medium">
            <span className={`w-2 h-2 rounded-full ${pulseHeatingActive ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            터빈 4호기 (3.5MW)
          </span>
        </div>
      </div>
    </header>
  );
};
