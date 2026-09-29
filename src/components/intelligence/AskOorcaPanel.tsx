/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Layers, 
  ExternalLink, 
  Compass, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  HelpCircle,
  Clock,
  ArrowRight,
  Fish,
  Info
} from 'lucide-react';
import { 
  IntelligenceMessage, 
  AgentExecutionStep, 
  EvidenceItem, 
  DataStatus 
} from '../../types/marineIntelligence';
import { PRESET_INTELLIGENCE_QUERIES } from '../../data/marineIntelligenceData';

// =========================================================================
// STEP 1: COMPONENT PROPS DEFINITION
// =========================================================================
interface AskOorcaPanelProps {
  messages: IntelligenceMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onFocusPfz?: (pfzId: string) => void;
  onFocusAlert?: (alertId: string) => void;
}

// =========================================================================
// STEP 2: EXAMPLE QUERIES LIST (EMERGENCY PS-26176 SIMPLIFICATION SECTION 9)
// =========================================================================
const EXAMPLE_QUERIES = [
  'Where are the nearest marine anomalies?',
  'Why was this area flagged?',
  'Is it safe to go fishing tomorrow?',
  'Where is fishing activity highest?',
  'Which areas have favourable fishing conditions?',
  'Are there weather risks near my location?',
  'What environmental changes are occurring?',
  'Which fishing areas should be avoided?'
];

// =========================================================================
// STEP 3: STATUS BADGE HELPER (DATA HONESTY COMPLIANCE - STEP 18)
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
// STEP 4: ASK OORCA CONVERSATIONAL PANEL COMPONENT
// =========================================================================
export const AskOorcaPanel: React.FC<AskOorcaPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onFocusPfz,
  onFocusAlert,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedPipelineMap, setExpandedPipelineMap] = useState<Record<string, boolean>>({});
  const [expandedEvidenceMap, setExpandedEvidenceMap] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleExampleClick = (query: string) => {
    if (isLoading) return;
    onSendMessage(query);
  };

  const togglePipeline = (messageId: string) => {
    setExpandedPipelineMap(prev => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  const toggleEvidence = (messageId: string) => {
    setExpandedEvidenceMap(prev => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  return (
    <div 
      id="ask-oorca-panel"
      className="h-full flex flex-col bg-neutral-950 border-r border-white/10 text-white font-geist select-none"
    >
      {/* =======================================================================
          STEP 5: PANEL SUBHEADER / IDENTITY BAR
          ======================================================================= */}
      <div className="h-11 px-4 border-b border-white/10 flex items-center justify-between bg-black/40 text-xs font-mono-code shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-white/90">ASK OORCA</span>
          <span className="text-[10px] text-white/40 border-l border-white/10 pl-2">
            Multi-Agent Reasoning Core
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>8 Agents Active</span>
        </div>
      </div>

      {/* =======================================================================
          STEP 6: CLICKABLE EXAMPLE QUERIES DOCK (STEP 5)
          ======================================================================= */}
      <div className="p-3 border-b border-white/10 bg-white/[0.02] shrink-0">
        <div className="flex items-center justify-between text-[11px] text-white/50 mb-2 font-mono-code">
          <span>RECOMMENDED QUERIES</span>
          <span className="text-[10px]">CLICK TO RUN</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {EXAMPLE_QUERIES.map((query, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(query)}
              disabled={isLoading}
              className="text-left text-xs px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 transition-all cursor-pointer truncate max-w-full disabled:opacity-50"
            >
              <span className="text-white/40 mr-1.5 font-mono-code text-[10px]">›</span>
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* =======================================================================
          STEP 7: CONVERSATION THREAD SCROLL AREA (STEP 4 & 6)
          ======================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          if (message.sender === 'user') {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/15 text-white text-sm shadow-md">
                  <div className="text-[10px] font-mono-code text-white/40 mb-1 flex items-center justify-end gap-1">
                    <span>YOU</span>
                    <span>·</span>
                    <span>{message.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{message.queryText}</p>
                </div>
              </div>
            );
          }

          // OORCA Structured Response Card
          const isPipelineOpen = !!expandedPipelineMap[message.id];
          const isEvidenceOpen = !!expandedEvidenceMap[message.id];

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full rounded-xl border border-white/15 bg-neutral-900/90 shadow-2xl p-4 backdrop-blur-md">
                
                {/* Response Card Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10 text-xs font-mono-code">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span className="font-semibold text-white tracking-wide">OORCA INTELLIGENCE</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {message.confidencePercentage && (
                      <span className="text-white/70">
                        Confidence: <strong className="text-emerald-400 font-mono-code">{message.confidencePercentage}%</strong>
                      </span>
                    )}
                    <span className="text-white/30">|</span>
                    <span className="text-white/40">{message.timestamp}</span>
                  </div>
                </div>

                {/* Direct Answer (Step 4) */}
                <p className="text-sm text-white/95 leading-relaxed mb-4">
                  {message.directAnswer}
                </p>

                {/* Structured WHY? Breakdown (Prompt Step 4) */}
                {message.whyChecklist && (
                  <div className="rounded-lg bg-black/40 border border-white/10 p-3 mb-3 text-xs">
                    <div className="font-mono-code text-[11px] text-white/60 mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span className="font-semibold text-white/90">WHY THIS EVALUATION?</span>
                      <span className="text-[10px] text-emerald-400/80">MULTI-CRITERIA SYNTHESIS</span>
                    </div>

                    <div className="space-y-1.5 font-geist">
                      {/* 1. Wind conditions */}
                      <div className="flex items-start gap-2">
                        {message.whyChecklist.windConditions.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-white/80">
                          <strong className="text-white/90 font-medium">Wind conditions: </strong>
                          {message.whyChecklist.windConditions.summary}
                        </div>
                      </div>

                      {/* 2. Wave conditions */}
                      <div className="flex items-start gap-2">
                        {message.whyChecklist.waveConditions.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-white/80">
                          <strong className="text-white/90 font-medium">Wave conditions: </strong>
                          {message.whyChecklist.waveConditions.summary}
                        </div>
                      </div>

                      {/* 3. Weather forecast */}
                      <div className="flex items-start gap-2">
                        {message.whyChecklist.weatherForecast.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-white/80">
                          <strong className="text-white/90 font-medium">Weather forecast: </strong>
                          {message.whyChecklist.weatherForecast.summary}
                        </div>
                      </div>

                      {/* 4. Ocean conditions */}
                      <div className="flex items-start gap-2">
                        {message.whyChecklist.oceanConditions.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-white/80">
                          <strong className="text-white/90 font-medium">Ocean conditions: </strong>
                          {message.whyChecklist.oceanConditions.summary}
                        </div>
                      </div>

                      {/* 5. Marine advisories */}
                      <div className="flex items-start gap-2">
                        {message.whyChecklist.marineAdvisories.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-white/80">
                          <strong className="text-white/90 font-medium">Marine advisories: </strong>
                          {message.whyChecklist.marineAdvisories.summary}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources Row */}
                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] font-mono-code text-white/50">
                    <span className="text-white/40">Sources:</span>
                    {message.sources.map((src, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Related Action Shortcuts (e.g. Focus PFZ or Alert) */}
                <div className="flex flex-wrap items-center gap-2 mb-3 pt-2 border-t border-white/10 text-xs">
                  {message.relatedPfzId && onFocusPfz && (
                    <button
                      onClick={() => onFocusPfz(message.relatedPfzId!)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono-code transition-all cursor-pointer"
                    >
                      <Fish className="w-3.5 h-3.5" />
                      <span>Focus {message.relatedPfzId} on Map</span>
                    </button>
                  )}

                  {message.relatedAlertId && onFocusAlert && (
                    <button
                      onClick={() => onFocusAlert(message.relatedAlertId!)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono-code transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>View Alert Warning</span>
                    </button>
                  )}

                  {/* Toggle Evidence Provenance (Step 12) */}
                  <button
                    onClick={() => toggleEvidence(message.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-mono-code transition-all cursor-pointer"
                  >
                    <span>Evidence / Provenance</span>
                    {isEvidenceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Toggle OORCA Reasoning Pipeline (Step 11) */}
                  <button
                    onClick={() => togglePipeline(message.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-mono-code transition-all cursor-pointer"
                  >
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>OORCA Reasoning Pipeline</span>
                    {isPipelineOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Collapsible Evidence / Provenance Section (Step 12) */}
                {isEvidenceOpen && message.evidence && (
                  <div className="rounded-lg bg-black/60 border border-white/10 p-3 mb-3 text-xs font-mono-code">
                    <div className="text-[11px] text-white/60 uppercase tracking-wider mb-2 font-semibold">
                      DATA PROVENANCE & SENSOR AUDIT
                    </div>
                    <div className="divide-y divide-white/5">
                      {message.evidence.map((ev) => (
                        <div key={ev.id} className="py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 w-16 uppercase text-[10px]">{ev.domain}</span>
                            <span className="text-white/90">{ev.metric}:</span>
                            <strong className="text-white font-medium">{ev.value}</strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-[10px]">{ev.source}</span>
                            {renderDataStatusBadge(ev.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible 8-Agent Pipeline Visualizer (Step 11) */}
                {isPipelineOpen && message.pipelineSteps && (
                  <div className="rounded-lg bg-black/70 border border-white/10 p-3 mb-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono-code text-cyan-300 uppercase tracking-wider mb-2.5 pb-1 border-b border-white/10">
                      <span className="font-semibold">OORCA REASONING PIPELINE EXECUTION</span>
                      <span className="text-white/40 text-[10px]">COLLABORATIVE AGENTS TRACE</span>
                    </div>

                    <div className="space-y-2">
                      {message.pipelineSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs font-geist">
                          <div className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono-code text-[10px] text-white/60 shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 font-mono-code text-[11px]">
                              <span className="font-semibold text-white/90">{step.agentName}</span>
                              <span className="text-emerald-400 text-[10px]">{step.latencyMs}ms</span>
                            </div>
                            <div className="text-[11px] text-white/60 truncate">{step.actionTaken}</div>
                            <div className="text-[10px] text-white/45 italic mt-0.5">{step.outputSummary}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-ups (Step 6) */}
                {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-[10px] font-mono-code text-white/40 uppercase mb-1.5">
                      SUGGESTED FOLLOW-UPS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {message.suggestedFollowUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExampleClick(fu)}
                          className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer text-left"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-white/15 bg-neutral-900/80 p-4 w-full">
              <div className="flex items-center gap-2.5 text-xs font-mono-code text-white/70 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-white font-medium">OORCA REASONING PIPELINE EXECUTING...</span>
              </div>
              <div className="space-y-1.5 text-[11px] font-mono-code text-white/50 pl-4 border-l border-white/15">
                <div>Planner Agent evaluating marine intent...</div>
                <div className="text-white/70">Weather & Ocean Analytics Agents synchronizing...</div>
                <div>Geospatial Agent verifying geofences...</div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* =======================================================================
          STEP 8: INPUT QUERY FORM
          ======================================================================= */}
      <form 
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/10 bg-black/60 shrink-0"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask OORCA about sea safety, fishing zones, wind, or waves..."
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/15 hover:border-white/25 focus:border-white/40 rounded-lg pl-3 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all font-geist"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-md bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white cursor-pointer transition-all"
            title="Send Query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono-code text-white/35 mt-1.5 px-1">
          <span>Multi-turn contextual reasoning enabled</span>
          <span>Shift + Enter for multiline</span>
        </div>
      </form>
    </div>
  );
};

export default AskOorcaPanel;
