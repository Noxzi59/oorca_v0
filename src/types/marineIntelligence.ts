/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =========================================================================
// STEP 1: PROVENANCE AND DATA STATUS ENUMS (DATA HONESTY COMPLIANCE)
// =========================================================================
export type DataStatus = 
  | 'LIVE' 
  | 'OBSERVED' 
  | 'MODELLED' 
  | 'FORECAST' 
  | 'ESTIMATED' 
  | 'DEMO';

// =========================================================================
// STEP 2: METOCEAN & MARINE CONDITION METRICS
// =========================================================================
export interface MarineMetricItem {
  id: string;
  name: string;
  value: string | number;
  unit: string;
  status: DataStatus;
  source: string;
  timestamp: string;
  assessment?: 'optimal' | 'moderate' | 'caution' | 'hazardous';
  details?: string;
}

export interface MarineConditionsSnapshot {
  seaSurfaceTemperature: MarineMetricItem;
  chlorophyllA: MarineMetricItem;
  windSpeedAndHeading: MarineMetricItem;
  waveSignificantHeight: MarineMetricItem;
  oceanSurfaceCurrent: MarineMetricItem;
  tidalState: MarineMetricItem;
  atmosphericVisibility: MarineMetricItem;
  barometricPressure: MarineMetricItem;
  generalSafetySummary: string;
  safetyScorePercentage: number; // 0 - 100
}

// =========================================================================
// STEP 3: POTENTIAL FISHING ZONES (PFZ) DEFINITION
// =========================================================================
export interface PotentialFishingZone {
  id: string;
  name: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
    formatted: string;
  };
  distanceKm: number;
  sstCelsius: number;
  chlorophyllMgM3: number;
  thermalFrontGradient: string;
  productivity: 'HIGH' | 'VERY HIGH' | 'MODERATE';
  confidencePercentage: number;
  observationTimeUtc: string;
  recommendedDepthMeters: number;
  targetSpecies: string[];
  status: DataStatus;
  dataSource: string;
  safeRouteRecommended: boolean;
  navigationalNotes: string;
}

// =========================================================================
// STEP 4: MARINE SAFETY & HAZARD ALERTS DEFINITION
// =========================================================================
export type MarineHazardType = 
  | 'CYCLONE' 
  | 'HIGH WAVES' 
  | 'LIGHTNING' 
  | 'STRONG WINDS' 
  | 'HEAVY RAIN' 
  | 'MARINE ADVISORY' 
  | 'RESTRICTED AREA' 
  | 'ECOLOGICALLY SENSITIVE ZONE';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFORMATIONAL';

export interface MarineSafetyAlert {
  id: string;
  type: MarineHazardType;
  severity: AlertSeverity;
  headline: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  validTime: string;
  source: string;
  description: string;
  advisoryAction: string;
  status: DataStatus;
}

// =========================================================================
// STEP 5: GEOFENCING & PROTECTED MARITIME REGIONS
// =========================================================================
export interface ProtectedMaritimeZone {
  id: string;
  name: string;
  type: 'MPA' | 'RESTRICTED_MILITARY' | 'OFFSHORE_OIL_SECURITY' | 'CORAL_SANCTUARY';
  statusLabel: string;
  regulationNotice: string;
  center: {
    lat: number;
    lng: number;
  };
  radiusKm: number;
  penaltyWarning: string;
}

// =========================================================================
// STEP 6: EVIDENCE & DATA PROVENANCE ITEM
// =========================================================================
export interface EvidenceItem {
  id: string;
  domain: 'Weather' | 'Ocean' | 'Satellite' | 'Model' | 'Regulatory';
  metric: string;
  value: string;
  source: string;
  status: DataStatus;
  verified: boolean;
}

// =========================================================================
// STEP 7: OORCA 8-AGENT REASONING PIPELINE TRACE
// =========================================================================
export type AgentName = 
  | 'Planner Agent'
  | 'Marine Data Agent'
  | 'Weather Agent'
  | 'Ocean Analytics Agent'
  | 'Geospatial Agent'
  | 'Risk Assessment Agent'
  | 'Visualization Agent'
  | 'Reporting Agent';

export interface AgentExecutionStep {
  agentName: AgentName;
  status: 'pending' | 'running' | 'completed' | 'skipped';
  actionTaken: string;
  outputSummary: string;
  latencyMs: number;
}

// =========================================================================
// STEP 8: STRUCTURED CONVERSATIONAL QUERY & RESPONSE
// =========================================================================
export interface WhyReasoningChecklist {
  windConditions: { valid: boolean; summary: string };
  waveConditions: { valid: boolean; summary: string };
  weatherForecast: { valid: boolean; summary: string };
  oceanConditions: { valid: boolean; summary: string };
  marineAdvisories: { valid: boolean; summary: string };
}

export interface IntelligenceMessage {
  id: string;
  sender: 'user' | 'oorca';
  timestamp: string;
  queryText?: string;
  directAnswer?: string;
  whyChecklist?: WhyReasoningChecklist;
  confidencePercentage?: number;
  sources?: string[];
  evidence?: EvidenceItem[];
  pipelineSteps?: AgentExecutionStep[];
  suggestedFollowUps?: string[];
  relatedPfzId?: string;
  relatedAlertId?: string;
  hazardDetected?: boolean;
}
