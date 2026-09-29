/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MarineConditionsSnapshot, 
  PotentialFishingZone, 
  MarineSafetyAlert, 
  ProtectedMaritimeZone,
  DataStatus
} from '../../types/marineIntelligence';
import { 
  Activity, 
  Fish, 
  AlertTriangle, 
  ShieldAlert, 
  Waves, 
  Wind, 
  Thermometer, 
  Eye, 
  Gauge, 
  ExternalLink, 
  Navigation, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

// =========================================================================
// STEP 1: COMPONENT PROPS DEFINITION
// =========================================================================
interface MarineConditionsPanelProps {
  conditions: MarineConditionsSnapshot;
  pfzList: PotentialFishingZone[];
  safetyAlerts: MarineSafetyAlert[];
  protectedZones: ProtectedMaritimeZone[];
  selectedPfzId: string | null;
  onSelectPfz: (pfz: PotentialFishingZone) => void;
  onAskAboutPfz: (pfz: PotentialFishingZone) => void;
  onAskAboutAlert: (alert: MarineSafetyAlert) => void;
}

// =========================================================================
// STEP 2: STATUS BADGE HELPER (DATA HONESTY COMPLIANCE - STEP 18)
// =========================================================================
function renderDataStatusBadge(status: DataStatus) {
  switch (status) {
    case 'LIVE':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      );
    case 'OBSERVED':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-blue-500/10 text-blue-300 border border-blue-500/20">
          OBSERVED
        </span>
      );
    case 'FORECAST':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          FORECAST
        </span>
      );
    case 'MODELLED':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-purple-500/10 text-purple-300 border border-purple-500/20">
          MODELLED
        </span>
      );
    case 'ESTIMATED':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-amber-500/10 text-amber-300 border border-amber-500/20">
          ESTIMATED
        </span>
      );
    // STEP 2.5: Real Data Honesty - Graceful UNAVAILABLE Status
    case 'UNAVAILABLE':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-zinc-800 text-zinc-400 border border-zinc-700">
          UNAVAILABLE
        </span>
      );
    case 'DEMO':
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-white/10 text-white/60 border border-white/15">
          DEMO
        </span>
      );
  }
}

// =========================================================================
// STEP 3: MAIN PANEL COMPONENT
// =========================================================================
export const MarineConditionsPanel: React.FC<MarineConditionsPanelProps> = ({
  conditions,
  pfzList,
  safetyAlerts,
  protectedZones,
  selectedPfzId,
  onSelectPfz,
  onAskAboutPfz,
  onAskAboutAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'CONDITIONS' | 'PFZ' | 'ALERTS' | 'GEOFENCING'>('CONDITIONS');

  return (
    <div 
      id="marine-conditions-panel"
      className="h-full flex flex-col bg-neutral-950 border-l border-white/10 text-white font-geist select-none"
    >
      {/* =======================================================================
          STEP 4: TAB SWITCHER HEADER (STEP 2 OF REQUIREMENTS)
          ======================================================================= */}
      <div className="h-11 px-2 border-b border-white/10 flex items-center justify-between bg-black/40 text-xs font-mono-code shrink-0">
        <div className="flex items-center gap-1 w-full justify-between">
          <button
            onClick={() => setActiveTab('CONDITIONS')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'CONDITIONS'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            CONDITIONS
          </button>

          <button
            onClick={() => setActiveTab('PFZ')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'PFZ'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>PFZ</span>
            <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {pfzList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'ALERTS'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>SAFETY</span>
            <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {safetyAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('GEOFENCING')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'GEOFENCING'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            GEOFENCE
          </button>
        </div>
      </div>

      {/* =======================================================================
          STEP 5: TAB 1 — MARINE CONDITIONS (STEP 7: SST, CHL, WIND, WAVE, CURRENT, TIDE, VISIBILITY)
          ======================================================================= */}
      {activeTab === 'CONDITIONS' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Top Status & Composite Safety Score */}
          <div className="rounded-xl border border-white/15 bg-neutral-900/80 p-3.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono-code text-white/50 mb-2">
              <span className="uppercase">OVERALL MARITIME SAFETY SCORE</span>
              <span className="text-emerald-400 font-bold">{conditions.safetyScorePercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
              <div 
                className="h-full bg-emerald-400 transition-all duration-700"
                style={{ width: `${conditions.safetyScorePercentage}%` }}
              />
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              {conditions.generalSafetySummary}
            </p>
          </div>

          {/* Metric Cards Grid (Step 7 requirement: VALUE, STATUS, SOURCE, TIMESTAMP) */}
          <div className="space-y-2.5">
            {[
              conditions.seaSurfaceTemperature,
              conditions.chlorophyllA,
              conditions.windSpeedAndHeading,
              conditions.waveSignificantHeight,
              conditions.oceanSurfaceCurrent,
              conditions.tidalState,
              conditions.atmosphericVisibility,
              conditions.barometricPressure,
              conditions.fishingActivity,
            ].filter(Boolean).map((metric) => (
              <div 
                key={metric.id}
                className="rounded-lg border border-white/10 bg-black/40 hover:bg-white/[0.04] p-3 transition-colors text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/60 font-medium font-geist">{metric.name}</span>
                  {renderDataStatusBadge(metric.status)}
                </div>

                <div className="flex items-baseline justify-between mb-1.5">
                  <span className={`text-lg font-mono-code font-semibold ${
                    metric.status === 'UNAVAILABLE' ? 'text-zinc-400 italic text-sm' : 'text-white'
                  }`}>
                    {metric.value}
                  </span>
                  <span className="text-[10px] font-mono-code text-white/40">
                    {metric.unit}
                  </span>
                </div>

                {metric.error && (
                  <div className="mb-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-mono-code flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span>{metric.error}</span>
                  </div>
                )}

                {metric.details && !metric.error && (
                  <p className="text-[11px] text-white/70 leading-relaxed mb-2 font-geist">
                    {metric.details}
                  </p>
                )}

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono-code text-white/40">
                  <span className="truncate max-w-[180px]">{metric.source}</span>
                  <span>{metric.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* =======================================================================
          STEP 6: TAB 2 — POTENTIAL FISHING ZONES (STEP 8: PFZ-01, DISTANCE, SST, CHL, PRODUCTIVITY, CONFIDENCE, TIME)
          ======================================================================= */}
      {activeTab === 'PFZ' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="text-xs font-mono-code text-white/50 flex items-center justify-between pb-1 border-b border-white/10">
            <span>IDENTIFIED FISHING ADVISORIES</span>
            <span className="text-emerald-400 font-semibold">{pfzList.length} ZONES</span>
          </div>

          {pfzList.map((pfz) => {
            const isSelected = pfz.id === selectedPfzId;
            return (
              <div
                key={pfz.id}
                className={`rounded-xl border p-3.5 transition-all text-xs ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg ring-1 ring-emerald-500/30'
                    : 'border-white/10 bg-neutral-900/60 hover:border-white/20'
                }`}
              >
                {/* Zone Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Fish className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-white text-sm font-mono-code">{pfz.id}</span>
                    <span className="text-[11px] text-white/60">({pfz.name})</span>
                  </div>
                  {renderDataStatusBadge(pfz.status)}
                </div>

                {/* Sub-region & Distance */}
                <div className="flex items-center justify-between text-[11px] font-mono-code text-white/60 mb-3">
                  <span>{pfz.region}</span>
                  <span className="text-emerald-300 font-bold">{pfz.distanceKm} km offshore</span>
                </div>

                {/* Metrics 2x2 Grid (Step 8) */}
                <div className="grid grid-cols-2 gap-2 mb-3 bg-black/40 rounded-lg p-2.5 border border-white/5 font-mono-code">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase">SST THERMAL</div>
                    <div className="text-white font-semibold">{pfz.sstCelsius} °C</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase">CHLOROPHYLL</div>
                    <div className="text-white font-semibold">{pfz.chlorophyllMgM3} mg/m³</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase">PRODUCTIVITY</div>
                    <div className={`font-semibold ${pfz.productivity === 'VERY HIGH' ? 'text-emerald-400' : 'text-cyan-300'}`}>
                      {pfz.productivity}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase">CONFIDENCE</div>
                    <div className="text-emerald-400 font-bold">{pfz.confidencePercentage}%</div>
                  </div>
                </div>

                {/* Target Species */}
                <div className="mb-3">
                  <div className="text-[10px] font-mono-code text-white/40 uppercase mb-1">
                    TARGET PELAGIC SPECIES
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pfz.targetSpecies.map((sp, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/70">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => onSelectPfz(pfz)}
                    className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-mono-code flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Focus Map</span>
                  </button>

                  <button
                    onClick={() => onAskAboutPfz(pfz)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-mono-code flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Assess Route</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =======================================================================
          STEP 7: TAB 3 — SAFETY & ALERTS (STEP 9: CYCLONE, HIGH WAVES, LIGHTNING, STRONG WINDS, HEAVY RAIN, ETC.)
          ======================================================================= */}
      {activeTab === 'ALERTS' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="text-xs font-mono-code text-white/50 flex items-center justify-between pb-1 border-b border-white/10">
            <span>OFFICIAL MARITIME ADVISORIES</span>
            <span className="text-amber-400 font-semibold">{safetyAlerts.length} ACTIVE</span>
          </div>

          {safetyAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-3.5 text-xs transition-colors ${
                alert.severity === 'CRITICAL'
                  ? 'border-red-500/40 bg-red-950/20'
                  : alert.severity === 'WARNING'
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-white/10 bg-neutral-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono-code uppercase font-semibold ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {alert.type} · {alert.severity}
                </span>
                {renderDataStatusBadge(alert.status)}
              </div>

              <h4 className="font-semibold text-white text-xs mb-1 font-geist">
                {alert.headline}
              </h4>

              <p className="text-[11px] text-white/70 leading-relaxed mb-2 font-geist">
                {alert.description}
              </p>

              <div className="rounded bg-black/40 p-2 border border-white/5 text-[11px] text-amber-200/90 mb-2 font-geist">
                <strong>Action: </strong>{alert.advisoryAction}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono-code text-white/40">
                <span className="truncate max-w-[170px]">{alert.source}</span>
                <button
                  onClick={() => onAskAboutAlert(alert)}
                  className="text-white/70 hover:text-white underline cursor-pointer"
                >
                  Consult OORCA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =======================================================================
          STEP 8: TAB 4 — GEOFENCING & PROTECTED MARITIME REGIONS (STEP 10)
          ======================================================================= */}
      {activeTab === 'GEOFENCING' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="text-xs font-mono-code text-white/50 flex items-center justify-between pb-1 border-b border-white/10">
            <span>RESTRICTED & PROTECTED REGIONS</span>
            <span className="text-purple-400 font-semibold">{protectedZones.length} BOUNDARIES</span>
          </div>

          {protectedZones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-xl border border-white/10 bg-neutral-900/60 p-3.5 text-xs hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-white font-geist text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  {zone.name}
                </span>
                <span className="text-[10px] font-mono-code text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  {zone.statusLabel}
                </span>
              </div>

              <p className="text-[11px] text-white/70 leading-relaxed mb-2 font-geist">
                {zone.regulationNotice}
              </p>

              <div className="rounded bg-black/40 p-2 border border-white/5 text-[10px] font-mono-code text-red-300/80 mb-2">
                ⚠️ {zone.penaltyWarning}
              </div>

              <div className="text-[10px] font-mono-code text-white/40 flex items-center justify-between pt-1 border-t border-white/5">
                <span>Radius: {zone.radiusKm} km</span>
                <span>{zone.center.lat.toFixed(3)}°N, {zone.center.lng.toFixed(3)}°E</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MarineConditionsPanel;
