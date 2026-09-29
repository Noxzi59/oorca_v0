/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OorcaBrandLogo } from '../brand/OorcaBrandLogo';
import { 
  Sparkles, 
  RotateCcw, 
  ShieldAlert, 
  Compass, 
  Clock, 
  Activity,
  Layers,
  ChevronRight,
  // STEP 1.5: Database Guide Icon
  Database
} from 'lucide-react';

// =========================================================================
// STEP 1: COMPONENT PROPS DEFINITION
// =========================================================================
interface IntelligenceHeaderProps {
  timeMode: 'HISTORICAL' | 'NOW' | '+24H' | '+48H';
  onTimeModeChange: (mode: 'HISTORICAL' | 'NOW' | '+24H' | '+48H') => void;
  onResetConversation: () => void;
  isMapLayersOpen: boolean;
  onToggleMapLayers: () => void;
  isConditionsOpen: boolean;
  onToggleConditions: () => void;
  // STEP 1.6: Database Guide Modal Trigger
  onOpenDatabaseGuide?: () => void;
}

// =========================================================================
// STEP 2: INTELLIGENCE HEADER COMPONENT (OORCA ESTABLISHED AESTHETIC)
// =========================================================================
export const IntelligenceHeader: React.FC<IntelligenceHeaderProps> = ({
  timeMode,
  onTimeModeChange,
  onResetConversation,
  isMapLayersOpen,
  onToggleMapLayers,
  isConditionsOpen,
  onToggleConditions,
  onOpenDatabaseGuide,
}) => {
  const navigate = useNavigate();

  return (
    <header 
      id="intelligence-header"
      className="h-14 bg-black/95 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none font-geist backdrop-blur-xl"
    >
      {/* =======================================================================
          STEP 3: LEFT BRANDING & TITLING
          ======================================================================= */}
      <div className="flex items-center gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <OorcaBrandLogo size="sm" asLink />
          <Link to="/" className="text-base font-semibold tracking-tight text-white hover:text-white/80 transition-colors">
            OORCA
          </Link>
        </div>

        {/* Thin Vertical Separator */}
        <div className="h-4 w-[1px] bg-white/15 mx-1" />

        {/* Primary Page Identity */}
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium text-white flex items-center gap-1.5">
            <span>Marine Intelligence</span>
          </h1>

          {/* Subtitle / SIH Badge */}
          <span className="hidden md:inline-flex px-2 py-0.5 text-[9px] uppercase font-mono-code tracking-widest text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 rounded">
            PS-26176 AGENT ENGINE
          </span>
        </div>

        {/* Subtitle description */}
        <span className="hidden xl:inline-block text-[11px] text-white/45 font-mono-code border-l border-white/10 pl-3">
          Conversational intelligence for the ocean
        </span>
      </div>

      {/* =======================================================================
          STEP 4: CENTER TIME CONTROL (HISTORICAL | NOW | +24H | +48H)
          ======================================================================= */}
      <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs font-mono-code">
        {(['HISTORICAL', 'NOW', '+24H', '+48H'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onTimeModeChange(mode)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              timeMode === mode
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {mode === 'NOW' ? '● LIVE / NOW' : mode}
          </button>
        ))}
      </div>

      {/* =======================================================================
          STEP 5: RIGHT CONTROLS & DUAL-EXPERIENCE INVESTIGATION GATEWAY
          ======================================================================= */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* STEP 5.1: Toggle Conditions Button (Commented out in single-column layout for easy update) */}
        {/* 
        {onToggleConditions && (
          <button
            onClick={onToggleConditions}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono-code transition-all cursor-pointer ${
              isConditionsOpen 
                ? 'bg-white text-black border-white font-semibold' 
                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
            }`}
            title="Toggle Marine Conditions & PFZ Panel"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Conditions & PFZ</span>
          </button>
        )}
        */}

        {/* Clear / New Conversation Button */}
        <button
          onClick={onResetConversation}
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
          title="Reset Ask OORCA Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* STEP 5.5: Maritime Database Guide Trigger Button (COMMENTED OUT FOR EASY UPDATE LATER) */}
        {/* 
        {onOpenDatabaseGuide && (
          <button
            onClick={onOpenDatabaseGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono-code transition-all cursor-pointer"
            title="Open Maritime Database Architecture & Migration Guide"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">DB Architect</span>
          </button>
        )}
        */}

        {/* Dual Mode Switcher: Link to PS-26143 Incident Investigation */}
        <Link
          to="/simulation"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 text-xs font-mono-code transition-all cursor-pointer"
          title="Switch to PS-26143 Marine Oil Spill Incident Investigation & Drift Simulation"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden xs:inline">Incident Investigation</span>
          <ChevronRight className="w-3 h-3 text-red-400/70" />
        </Link>
      </div>
    </header>
  );
};

export default IntelligenceHeader;
