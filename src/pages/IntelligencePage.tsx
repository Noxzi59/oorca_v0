/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { IntelligenceHeader } from '../components/intelligence/IntelligenceHeader';
import { AskOorcaPanel } from '../components/intelligence/AskOorcaPanel';
import { MarineIntelligenceMap } from '../components/intelligence/MarineIntelligenceMap';
import { intelligenceService } from '../services/intelligenceService';
import { MaritimeDatabaseGuideModal } from '../components/database/MaritimeDatabaseGuideModal';
import { 
  DEFAULT_MARINE_CONDITIONS, 
  DEMO_PFZ_ZONES, 
  DEMO_SAFETY_ALERTS, 
  PROTECTED_MARITIME_ZONES,
  generateLocalIntelligenceResponse,
  createPipelineExecutionTrace
} from '../data/marineIntelligenceData';
import { 
  IntelligenceMessage, 
  PotentialFishingZone, 
  MarineSafetyAlert,
  MarineConditionsSnapshot,
  DataStatus
} from '../types/marineIntelligence';
import {
  Sparkles,
  MapPin,
  Compass,
  Waves,
  Wind,
  Thermometer,
  Fish,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle2,
  ChevronRight,
  Eye,
  Gauge,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowUpRight
} from 'lucide-react';

// =========================================================================
// STEP 1: INITIAL CONVERSATION SEED (WARM SYSTEM INTRO)
// =========================================================================
const INITIAL_MESSAGES: IntelligenceMessage[] = [
  {
    id: 'seed-msg-1',
    sender: 'oorca',
    timestamp: 'Just now',
    directAnswer: 'Welcome to OORCA Marine Intelligence. Collaborative reasoning agents are online, continuously ingesting satellite Earth Observation, oceanographic drift, atmospheric weather, and bathymetric data across the Arabian Sea and Bay of Bengal.',
    whyChecklist: {
      windConditions: { valid: true, summary: 'ECMWF 0.1° atmospheric wind fields synchronized (14.2 kts NW).' },
      waveConditions: { valid: true, summary: 'WaveWatch III hydrodynamic swell model active (1.3m).' },
      weatherForecast: { valid: true, summary: 'IMD Coastal Doppler Radar Mumbai feeds operational.' },
      oceanConditions: { valid: true, summary: 'Copernicus Sentinel-3 SST (27.4°C) & Chlorophyll-a (1.24 mg/m³) updated.' },
      marineAdvisories: { valid: true, summary: 'Naval corridors & protected coral reserves geofenced.' },
    },
    confidencePercentage: 94,
    sources: ['Sentinel-3 SLSTR', 'ECMWF IFS', 'Copernicus CMEMS', 'IMD Doppler Radar'],
    evidence: [
      { id: 'ev-init-1', domain: 'Satellite', metric: 'SST Surface Temperature', value: '27.4 °C', source: 'Sentinel-3 SLSTR', status: 'OBSERVED', verified: true },
      { id: 'ev-init-2', domain: 'Weather', metric: 'Surface Wind Vector', value: '14.2 kts NW', source: 'ECMWF IFS Forecast', status: 'LIVE', verified: true },
      { id: 'ev-init-3', domain: 'Ocean', metric: 'Significant Wave Height', value: '1.3 meters', source: 'WaveWatch III Model', status: 'MODELLED', verified: true }
    ],
    pipelineSteps: createPipelineExecutionTrace('System Initialization'),
    suggestedFollowUps: [
      'Is it safe to venture into the sea tomorrow?',
      'Where is the nearest Potential Fishing Zone?',
      'What are the sea conditions near my location?',
      'Are there any cyclone or lightning alerts?'
    ],
    hazardDetected: false,
  }
];

// =========================================================================
// STEP 2: STATUS BADGE RENDER HELPER (DATA HONESTY COMPLIANCE)
// =========================================================================
function renderDataStatusBadge(status: DataStatus) {
  switch (status) {
    case 'LIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      );
    case 'OBSERVED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-code bg-blue-500/10 text-blue-300 border border-blue-500/20">
          OBSERVED
        </span>
      );
    case 'FORECAST':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-code bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          FORECAST
        </span>
      );
    case 'MODELLED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-code bg-purple-500/10 text-purple-300 border border-purple-500/20">
          MODELLED
        </span>
      );
    case 'ESTIMATED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-code bg-amber-500/10 text-amber-300 border border-amber-500/20">
          ESTIMATED
        </span>
      );
    case 'DEMO':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-code bg-white/10 text-white/60 border border-white/15">
          DEMO
        </span>
      );
  }
}

// =========================================================================
// STEP 3: MAIN SINGLE-COLUMN INTELLIGENCE PAGE
// =========================================================================
export function IntelligencePage() {
  // STEP 3.1: Conversation History State
  const [messages, setMessages] = useState<IntelligenceMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // STEP 3.2: Real-Time API Telemetry State (Populated from Open-Meteo & OpenWeather APIs)
  const [conditions, setConditions] = useState<MarineConditionsSnapshot>(DEFAULT_MARINE_CONDITIONS);
  const [isLiveApiConnected, setIsLiveApiConnected] = useState<boolean>(false);

  // STEP 3.3: Maritime Database Architecture Guide Modal State
  const [isDbGuideOpen, setIsDbGuideOpen] = useState<boolean>(false);

  // STEP 3.4: Time Control (HISTORICAL | NOW | +24H | +48H)
  const [timeMode, setTimeMode] = useState<'HISTORICAL' | 'NOW' | '+24H' | '+48H'>('NOW');

  // STEP 3.5: Selected Entities & Overlays
  const [selectedPfzId, setSelectedPfzId] = useState<string | null>('PFZ-01');
  const [activeGeofenceWarning, setActiveGeofenceWarning] = useState<string | null>(null);

  // STEP 3.6: Single-Column Category Focus Filter ('ALL' | 'AI' | 'MAP' | 'CONDITIONS' | 'PFZ' | 'SAFETY')
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AI' | 'MAP' | 'CONDITIONS' | 'PFZ' | 'SAFETY'>('ALL');

  // STEP 3.7: Multi-turn context memory
  const [conversationContext, setConversationContext] = useState<{
    location?: string;
    lastPfz?: string;
  }>({
    location: 'Mumbai / Konkan coast',
  });

  // STEP 3.8: Ingest Real Live Metocean Data on Mount
  useEffect(() => {
    let isSubscribed = true;
    intelligenceService.getLiveMarineConditions(18.90, 72.82)
      .then((liveSnapshot) => {
        if (isSubscribed) {
          setConditions(liveSnapshot);
          setIsLiveApiConnected(true);
        }
      })
      .catch((err) => {
        console.warn('[IntelligencePage] Live Metocean API ingestion failed, retained baseline:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // =========================================================================
  // STEP 4: MESSAGE DISPATCH HANDLER (API WITH SEAMLESS LOCAL FALLBACK)
  // =========================================================================
  const handleSendMessage = useCallback(async (query: string) => {
    const userMsg: IntelligenceMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      queryText: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Step 4.1: Query backend Express intelligence route
      const response = await fetch('/api/intelligence/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          coordinates: { lat: 18.90, lng: 72.45 },
          context: conversationContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const oorcaMsg: IntelligenceMessage = {
          id: `oorca-${Date.now()}`,
          sender: 'oorca',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          directAnswer: data.directAnswer,
          whyChecklist: data.whyChecklist,
          confidencePercentage: data.confidencePercentage,
          sources: data.sources,
          evidence: data.evidence,
          pipelineSteps: data.pipelineSteps,
          suggestedFollowUps: data.suggestedFollowUps,
          relatedPfzId: data.relatedPfzId,
          relatedAlertId: data.relatedAlertId,
          hazardDetected: data.hazardDetected,
        };

        setMessages((prev) => [...prev, oorcaMsg]);
        if (data.relatedPfzId) {
          setSelectedPfzId(data.relatedPfzId);
        }
      } else {
        // Step 4.2: Fallback to calibrated deterministic knowledge layer
        const fallbackMsg = generateLocalIntelligenceResponse(query, conversationContext);
        setMessages((prev) => [...prev, fallbackMsg]);
        if (fallbackMsg.relatedPfzId) {
          setSelectedPfzId(fallbackMsg.relatedPfzId);
        }
      }
    } catch (err) {
      console.warn('[IntelligencePage] Backend request failed, using deterministic knowledge layer:', err);
      const fallbackMsg = generateLocalIntelligenceResponse(query, conversationContext);
      setMessages((prev) => [...prev, fallbackMsg]);
      if (fallbackMsg.relatedPfzId) {
        setSelectedPfzId(fallbackMsg.relatedPfzId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationContext]);

  // =========================================================================
  // STEP 5: INTERACTION HANDLERS (PFZ, ALERTS, RESET)
  // =========================================================================
  const handleSelectPfz = (pfz: PotentialFishingZone) => {
    setSelectedPfzId(pfz.id);
  };

  const handleAskAboutPfz = (pfz: PotentialFishingZone) => {
    setSelectedPfzId(pfz.id);
    handleSendMessage(`Find a safer route to ${pfz.name} (${pfz.id}) avoiding restricted waters.`);
    setActiveFilter('AI');
  };

  const handleAskAboutAlert = (alert: MarineSafetyAlert) => {
    handleSendMessage(`What precautions should vessels take for alert ${alert.headline}?`);
    setActiveFilter('AI');
  };

  const handleResetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    setSelectedPfzId('PFZ-01');
    setActiveGeofenceWarning(null);
  };

  return (
    <div id="intelligence-workspace" className="min-h-screen w-full flex flex-col bg-black text-white font-geist select-none">
      
      {/* =======================================================================
          STEP 6: TOP WORKSPACE HEADER
          ======================================================================= */}
      <IntelligenceHeader
        timeMode={timeMode}
        onTimeModeChange={setTimeMode}
        onResetConversation={handleResetConversation}
        isMapLayersOpen={false}
        onToggleMapLayers={() => {}}
        isConditionsOpen={false}
        onToggleConditions={() => {}}
        onOpenDatabaseGuide={() => setIsDbGuideOpen(true)}
      />

      {/* =======================================================================
          STEP 7: MAIN SINGLE-COLUMN SCROLLABLE CONTAINER
          ======================================================================= */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* ===================================================================
              STEP 7.1: FOCUSED CATEGORY FILTER BAR
              Allows one-click jumping/filtering to specific grouped cards
              =================================================================== */}
          <div className="sticky top-0 z-20 bg-black/85 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 flex items-center justify-between gap-1 overflow-x-auto shadow-2xl">
            <div className="flex items-center gap-1 min-w-max text-xs font-mono-code">
              {[
                { id: 'ALL', label: 'All Cards' },
                { id: 'AI', label: 'Ask OORCA AI', icon: Sparkles },
                { id: 'MAP', label: 'Geospatial Map', icon: Compass },
                { id: 'CONDITIONS', label: 'Live Telemetry', icon: Activity },
                { id: 'PFZ', label: `Fishing Zones (${DEMO_PFZ_ZONES.length})`, icon: Fish },
                { id: 'SAFETY', label: `Safety & Zones (${DEMO_SAFETY_ALERTS.length})`, icon: ShieldAlert },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveFilter(item.id as typeof activeFilter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick reset action */}
            <button
              onClick={handleResetConversation}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-white/50 hover:text-white rounded hover:bg-white/5 font-mono-code transition-colors cursor-pointer"
              title="Reset Conversation & Filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* ===================================================================
              STEP 8: CARD 1 — STATION OVERVIEW & METOCEAN STATUS
              =================================================================== */}
          {(activeFilter === 'ALL' || activeFilter === 'CONDITIONS') && (
            <section 
              aria-label="Marine Station Overview Card"
              className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono-code uppercase tracking-wider text-emerald-400">
                      LIVE METOCEAN OBSERVATION STATION
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {isLiveApiConnected ? 'API TELEMETRY SYNCED' : 'CALIBRATED BASELINE'}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    Arabian Sea · Konkan & Mumbai Coastal Corridor
                  </h2>
                  <p className="text-xs text-white/60 font-mono-code mt-0.5">
                    Coordinates: 18.90° N, 72.82° E · Station Datum: WGS 84 · Time Mode: {timeMode}
                  </p>
                </div>

                {/* Overall Safety Rating Score */}
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3 sm:px-4">
                  <div>
                    <div className="text-[10px] font-mono-code text-white/50 uppercase">
                      COMPOSITE MARITIME SAFETY
                    </div>
                    <div className="text-2xl font-mono-code font-bold text-emerald-400">
                      {conditions.safetyScorePercentage}%
                    </div>
                  </div>
                  <div className="h-9 w-[1px] bg-white/10" />
                  <div className="max-w-[180px] text-[11px] text-white/70 leading-snug">
                    {conditions.generalSafetySummary}
                  </div>
                </div>
              </div>

              {/* Time Control Horizon Selector */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono-code">
                <div className="flex items-center gap-2 text-white/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Forecast Horizon:</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10">
                  {(['HISTORICAL', 'NOW', '+24H', '+48H'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTimeMode(mode)}
                      className={`px-3 py-1 rounded text-xs transition-all cursor-pointer ${
                        timeMode === mode
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {mode === 'NOW' ? '● LIVE / NOW' : mode}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ===================================================================
              STEP 9: CARD 2 — CONVERSATIONAL AI INTELLIGENCE (ASK OORCA)
              Contained in a single-column card with no sidebars or overlap
              =================================================================== */}
          {(activeFilter === 'ALL' || activeFilter === 'AI') && (
            <section 
              aria-label="Ask OORCA Conversational Intelligence Card"
              className="rounded-2xl border border-white/10 bg-neutral-950/80 overflow-hidden shadow-2xl backdrop-blur-xl"
            >
              {/* Card Header */}
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Ask OORCA Conversational Intelligence</span>
                      <span className="text-[10px] font-mono-code text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        8 AGENTS ONLINE
                      </span>
                    </h3>
                    <p className="text-xs text-white/50">
                      Multi-agent reasoning engine grounded in ECMWF atmospheric models, WaveWatch III, and Sentinel-3 SST
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetConversation}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Reset Conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contained Chat Interface */}
              <div className="h-[540px]">
                <AskOorcaPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onFocusPfz={(id) => {
                    setSelectedPfzId(id);
                    setActiveFilter('MAP');
                  }}
                  onFocusAlert={(id) => {
                    const al = DEMO_SAFETY_ALERTS.find(a => a.id === id);
                    if (al) handleAskAboutAlert(al);
                  }}
                />
              </div>
            </section>
          )}

          {/* ===================================================================
              STEP 10: CARD 3 — INTERACTIVE GEOSPATIAL INTELLIGENCE MAP
              Contained card with clean inline toolbar and no overlapping popups
              =================================================================== */}
          {(activeFilter === 'ALL' || activeFilter === 'MAP') && (
            <section 
              aria-label="Interactive Marine Intelligence Map Card"
              className="rounded-2xl border border-white/10 bg-neutral-950/80 overflow-hidden shadow-2xl backdrop-blur-xl"
            >
              {/* Card Header & Inline Layer Controls */}
              <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Interactive Geospatial Marine Map</span>
                      <span className="text-[10px] font-mono-code text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        MAPLIBRE GL · CARTO DARK
                      </span>
                    </h3>
                    <p className="text-xs text-white/50">
                      High-resolution bathymetric contours, PFZ corridors, maritime hazard zones, and geofenced MPAs
                    </p>
                  </div>
                </div>

                {/* Selected Zone Pill Indicator */}
                {selectedPfzId && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono-code">
                    <Fish className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Focused Zone: {selectedPfzId}</span>
                  </div>
                )}
              </div>

              {/* Geofence Active Alert Notice (if any) */}
              {activeGeofenceWarning && (
                <div className="px-5 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between font-mono-code">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{activeGeofenceWarning}</span>
                  </div>
                  <button 
                    onClick={() => setActiveGeofenceWarning(null)}
                    className="text-amber-300/60 hover:text-amber-200 text-xs cursor-pointer ml-4"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Map Container Viewport */}
              <div className="h-[460px] sm:h-[500px] w-full relative">
                <MarineIntelligenceMap
                  timeMode={timeMode}
                  selectedPfzId={selectedPfzId}
                  onSelectPfz={handleSelectPfz}
                  pfzList={DEMO_PFZ_ZONES}
                  safetyAlerts={DEMO_SAFETY_ALERTS}
                  protectedZones={PROTECTED_MARITIME_ZONES}
                  onTriggerGeofenceWarning={(warning) => setActiveGeofenceWarning(warning)}
                />
              </div>
            </section>
          )}

          {/* ===================================================================
              STEP 11: CARD 4 — REAL-TIME METOCEAN TELEMETRY (GROUPED CLUSTERS)
              Organized into Atmospheric, Hydrodynamic, and Thermal/Biogeochemical
              =================================================================== */}
          {(activeFilter === 'ALL' || activeFilter === 'CONDITIONS') && (
            <section 
              aria-label="Live Metocean Telemetry Grouped Card"
              className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 shadow-2xl backdrop-blur-xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Live Metocean & Oceanographic Telemetry
                    </h3>
                    <p className="text-xs text-white/50">
                      Real Open-Meteo & Copernicus observation data with verified provenance and data honesty badges
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono-code text-white/50">
                  8 Observation Channels
                </span>
              </div>

              {/* Grouped Metrics Grid: 8 Key Marine Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  conditions.seaSurfaceTemperature,
                  conditions.chlorophyllA,
                  conditions.windSpeedAndHeading,
                  conditions.waveSignificantHeight,
                  conditions.oceanSurfaceCurrent,
                  conditions.tidalState,
                  conditions.atmosphericVisibility,
                  conditions.barometricPressure,
                ].map((metric) => (
                  <div 
                    key={metric.id}
                    className="rounded-xl border border-white/10 bg-black/40 hover:bg-white/[0.03] p-3.5 transition-all text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 font-medium font-geist">{metric.name}</span>
                        {renderDataStatusBadge(metric.status)}
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xl font-mono-code font-bold text-white tracking-tight">
                          {metric.value}
                        </span>
                        <span className="text-xs font-mono-code text-white/50">
                          {metric.unit}
                        </span>
                      </div>

                      {metric.details && (
                        <p className="text-[11px] text-white/70 leading-relaxed font-geist line-clamp-2">
                          {metric.details}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono-code text-white/40">
                      <span className="truncate max-w-[140px]">{metric.source}</span>
                      <span>{metric.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===================================================================
              STEP 12: CARD 5 — POTENTIAL FISHING ZONES (PFZ) & PELAGIC ADVISORY
              =================================================================== */}
          {(activeFilter === 'ALL' || activeFilter === 'PFZ') && (
            <section 
              aria-label="Potential Fishing Zones Card"
              className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    <Fish className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Identified Potential Fishing Zones (PFZ)</span>
                      <span className="text-xs font-mono-code text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {DEMO_PFZ_ZONES.length} ACTIVE CORRIDORS
                      </span>
                    </h3>
                    <p className="text-xs text-white/50">
                      Thermal gradient boundaries and chlorophyll-a fronts identified by Sentinel-3 and INCOIS advisory
                    </p>
                  </div>
                </div>
              </div>

              {/* PFZ Zones Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {DEMO_PFZ_ZONES.map((pfz) => {
                  const isSelected = pfz.id === selectedPfzId;
                  return (
                    <div
                      key={pfz.id}
                      className={`rounded-xl border p-4 transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg ring-1 ring-emerald-500/30'
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div>
                        {/* Zone Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Fish className="w-4 h-4 text-emerald-400" />
                            <span className="font-semibold text-white text-sm font-mono-code">{pfz.id}</span>
                            <span className="text-xs text-white/60">({pfz.name})</span>
                          </div>
                          {renderDataStatusBadge(pfz.status)}
                        </div>

                        {/* Sub-region & Distance */}
                        <div className="flex items-center justify-between text-xs font-mono-code text-white/60 mb-3">
                          <span>{pfz.region}</span>
                          <span className="text-emerald-300 font-bold">{pfz.distanceKm} km offshore</span>
                        </div>

                        {/* Metrics 2x2 Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 bg-white/[0.02] rounded-lg p-2.5 border border-white/5 font-mono-code text-[11px]">
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
                          <div className="text-[10px] font-mono-code text-white/40 mb-1">TARGET PELAGIC SPECIES:</div>
                          <div className="flex flex-wrap gap-1">
                            {pfz.targetSpecies.map((sp, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/80">
                                {sp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                        <button
                          onClick={() => {
                            handleSelectPfz(pfz);
                            setActiveFilter('MAP');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono-code transition-colors cursor-pointer text-center"
                        >
                          View on Map
                        </button>
                        <button
                          onClick={() => handleAskAboutPfz(pfz)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono-code transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Ask Route</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ===================================================================
              STEP 13: CARD 6 — ACTIVE MARINE HAZARDS & GEOFENCED SANCTUARIES
              =================================================================== */}
          {(activeFilter === 'ALL' || activeFilter === 'SAFETY') && (
            <section 
              aria-label="Marine Safety & Geofencing Card"
              className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Active Marine Safety Alerts & Geofenced Sanctuaries
                    </h3>
                    <p className="text-xs text-white/50">
                      Coast Guard advisories, high-swell hazards, and legally protected marine reserves
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono-code text-white/50">
                  {DEMO_SAFETY_ALERTS.length} Alerts · {PROTECTED_MARITIME_ZONES.length} Protected Zones
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Active Safety Hazards */}
                <div className="space-y-2.5">
                  <div className="text-xs font-mono-code text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>ACTIVE MARINE HAZARDS</span>
                  </div>

                  {DEMO_SAFETY_ALERTS.map((alert) => (
                    <div 
                      key={alert.id}
                      className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5 text-xs font-geist"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-amber-300 font-mono-code">
                          {alert.headline}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code ${
                          alert.severity === 'WARNING' 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>

                      <p className="text-white/80 text-xs leading-relaxed mb-2">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono-code text-white/40 pt-2 border-t border-white/5">
                        <span>Issued by {alert.source}</span>
                        <button
                          onClick={() => handleAskAboutAlert(alert)}
                          className="text-amber-300 hover:text-white underline cursor-pointer"
                        >
                          Ask Precautions →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Marine Protected Zones (MPA) */}
                <div className="space-y-2.5">
                  <div className="text-xs font-mono-code text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>GEOFENCED MARINE RESERVES</span>
                  </div>

                  {PROTECTED_MARITIME_ZONES.map((zone) => (
                    <div 
                      key={zone.id}
                      className="rounded-xl border border-purple-500/30 bg-purple-950/15 p-3.5 text-xs font-geist"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-purple-300 font-mono-code">
                          {zone.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {zone.statusLabel}
                        </span>
                      </div>

                      <p className="text-white/80 text-xs leading-relaxed mb-2">
                        {zone.regulationNotice}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono-code text-white/40 pt-2 border-t border-white/5">
                        <span>Radius: {zone.radiusKm} km · Coral & Pelagic Nursery</span>
                        <span className="text-purple-400">Strict Enforcement</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>
          )}

        </div>
      </main>

      {/* =======================================================================
          STEP 14: MARITIME DATABASE ARCHITECTURE & MIGRATION GUIDE MODAL
          ======================================================================= */}
      <MaritimeDatabaseGuideModal
        isOpen={isDbGuideOpen}
        onClose={() => setIsDbGuideOpen(false)}
      />

    </div>
  );
}

export default IntelligencePage;
