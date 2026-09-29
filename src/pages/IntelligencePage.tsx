/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { IntelligenceHeader } from '../components/intelligence/IntelligenceHeader';
import { AskOorcaPanel } from '../components/intelligence/AskOorcaPanel';
import { MarineIntelligenceMap } from '../components/intelligence/MarineIntelligenceMap';
import { MarineConditionsPanel } from '../components/intelligence/MarineConditionsPanel';
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
  MarineSafetyAlert 
} from '../types/marineIntelligence';

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
// STEP 2: MAIN INTELLIGENCE PAGE COMPONENT
// =========================================================================
export function IntelligencePage() {
  // State: Conversation History
  const [messages, setMessages] = useState<IntelligenceMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State: Time Control (HISTORICAL | NOW | +24H | +48H) (Step 13)
  const [timeMode, setTimeMode] = useState<'HISTORICAL' | 'NOW' | '+24H' | '+48H'>('NOW');

  // State: Selected Entities & Overlays
  const [selectedPfzId, setSelectedPfzId] = useState<string | null>('PFZ-01');
  const [isConditionsOpen, setIsConditionsOpen] = useState<boolean>(true);
  const [isMapLayersOpen, setIsMapLayersOpen] = useState<boolean>(false);
  const [activeGeofenceWarning, setActiveGeofenceWarning] = useState<string | null>(null);

  // Multi-turn context memory (Step 6)
  const [conversationContext, setConversationContext] = useState<{
    location?: string;
    lastPfz?: string;
  }>({
    location: 'Mumbai / Konkan coast',
  });

  // =========================================================================
  // STEP 3: MESSAGE DISPATCH HANDLER (API WITH SEAMLESS LOCAL FALLBACK)
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
      // Step 3.1: Query backend Express intelligence route
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
        // Step 3.2: Fallback to local intelligence model
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
  // STEP 4: INTERACTION SHORTCUTS (FOCUS PFZ, ASSESS ROUTE, RESET)
  // =========================================================================
  const handleSelectPfz = (pfz: PotentialFishingZone) => {
    setSelectedPfzId(pfz.id);
  };

  const handleAskAboutPfz = (pfz: PotentialFishingZone) => {
    setSelectedPfzId(pfz.id);
    handleSendMessage(`Find a safer route to ${pfz.name} (${pfz.id}) avoiding restricted waters.`);
  };

  const handleAskAboutAlert = (alert: MarineSafetyAlert) => {
    handleSendMessage(`What precautions should vessels take for alert ${alert.headline}?`);
  };

  const handleResetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    setSelectedPfzId('PFZ-01');
    setActiveGeofenceWarning(null);
  };

  return (
    <div id="intelligence-workspace" className="h-[calc(100vh-0px)] w-full flex flex-col bg-black text-white font-geist overflow-hidden select-none">
      
      {/* =======================================================================
          STEP 5: TOP WORKSPACE HEADER
          ======================================================================= */}
      <IntelligenceHeader
        timeMode={timeMode}
        onTimeModeChange={setTimeMode}
        onResetConversation={handleResetConversation}
        isMapLayersOpen={isMapLayersOpen}
        onToggleMapLayers={() => setIsMapLayersOpen(!isMapLayersOpen)}
        isConditionsOpen={isConditionsOpen}
        onToggleConditions={() => setIsConditionsOpen(!isConditionsOpen)}
      />

      {/* =======================================================================
          STEP 6: MAIN 3-COLUMN WORKSPACE LAYOUT (STEP 3 OF PROMPT)
          LEFT: Conversational Intelligence (Ask OORCA)
          CENTER: Interactive Marine Map (MapLibre GL)
          RIGHT: Conditions, PFZ, Safety Alerts & Geofencing
          ======================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: Conversational Intelligence (Ask OORCA) */}
        <section 
          aria-label="Ask OORCA Conversational Intelligence Panel"
          className="w-full md:w-[380px] lg:w-[440px] xl:w-[480px] shrink-0 h-full z-10"
        >
          <AskOorcaPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onFocusPfz={(id) => setSelectedPfzId(id)}
            onFocusAlert={(id) => {
              const al = DEMO_SAFETY_ALERTS.find(a => a.id === id);
              if (al) handleAskAboutAlert(al);
            }}
          />
        </section>

        {/* CENTER COLUMN: Interactive Marine Map */}
        <section 
          aria-label="Interactive Marine Intelligence Map"
          className="flex-1 h-full relative"
        >
          <MarineIntelligenceMap
            timeMode={timeMode}
            selectedPfzId={selectedPfzId}
            onSelectPfz={handleSelectPfz}
            pfzList={DEMO_PFZ_ZONES}
            safetyAlerts={DEMO_SAFETY_ALERTS}
            protectedZones={PROTECTED_MARITIME_ZONES}
            onTriggerGeofenceWarning={(warning) => setActiveGeofenceWarning(warning)}
          />
        </section>

        {/* RIGHT COLUMN: Conditions, PFZ, Alerts & Geofencing (Toggleable on small screens) */}
        {isConditionsOpen && (
          <aside 
            aria-label="Marine Conditions and Potential Fishing Zones Panel"
            className="hidden lg:block w-[340px] xl:w-[380px] shrink-0 h-full z-10"
          >
            <MarineConditionsPanel
              conditions={DEFAULT_MARINE_CONDITIONS}
              pfzList={DEMO_PFZ_ZONES}
              safetyAlerts={DEMO_SAFETY_ALERTS}
              protectedZones={PROTECTED_MARITIME_ZONES}
              selectedPfzId={selectedPfzId}
              onSelectPfz={handleSelectPfz}
              onAskAboutPfz={handleAskAboutPfz}
              onAskAboutAlert={handleAskAboutAlert}
            />
          </aside>
        )}

      </div>

    </div>
  );
}

export default IntelligencePage;
