/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// STEP 1: Safe MapLibre configuration and circular error serialization guard
import { initializeMapLibreWorker, attachSafeMapErrorHandler } from '../../utils/maplibreSetup';
import { 
  PotentialFishingZone, 
  MarineSafetyAlert, 
  ProtectedMaritimeZone 
} from '../../types/marineIntelligence';
import { DEFAULT_CARTO_API_KEY, getCartoApiKey } from '../../services/mapService';
import { 
  Fish, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Maximize2, 
  Compass, 
  Anchor, 
  Waves, 
  Wind, 
  Flame, 
  Thermometer, 
  Info,
  MapPin,
  CheckCircle2,
  X
} from 'lucide-react';

// =========================================================================
// STEP 1: COMPONENT PROPS DEFINITION
// =========================================================================
interface MarineIntelligenceMapProps {
  timeMode: 'HISTORICAL' | 'NOW' | '+24H' | '+48H';
  selectedPfzId: string | null;
  onSelectPfz: (pfz: PotentialFishingZone) => void;
  pfzList: PotentialFishingZone[];
  safetyAlerts: MarineSafetyAlert[];
  protectedZones: ProtectedMaritimeZone[];
  onTriggerGeofenceWarning?: (warning: string) => void;
}

// =========================================================================
// STEP 2: HELPER TO CREATE CIRCLE GEOJSON FOR PFZ & GEOFENCES
// =========================================================================
function createGeoCircle(
  lng: number, 
  lat: number, 
  radiusKm: number, 
  points: number = 32
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceRadians = radiusKm / 6371.0088;
  const centerLatRad = (lat * Math.PI) / 180;
  const centerLngRad = (lng * Math.PI) / 180;

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const latPointRad = Math.asin(
      Math.sin(centerLatRad) * Math.cos(distanceRadians) +
      Math.cos(centerLatRad) * Math.sin(distanceRadians) * Math.cos(angle)
    );
    const lngPointRad = centerLngRad + Math.atan2(
      Math.sin(angle) * Math.sin(distanceRadians) * Math.cos(centerLatRad),
      Math.cos(distanceRadians) - Math.sin(centerLatRad) * Math.sin(latPointRad)
    );
    coords.push([(lngPointRad * 180) / Math.PI, (latPointRad * 180) / Math.PI]);
  }

  return {
    type: 'Feature',
    properties: { radiusKm },
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

// =========================================================================
// STEP 3: PRE-SET REGIONAL VIEWS
// =========================================================================
const REGIONAL_PRESETS = [
  { name: 'Mumbai / Konkan', lat: 18.90, lng: 72.45, zoom: 8.4 },
  { name: 'Bay of Bengal', lat: 13.50, lng: 80.80, zoom: 7.5 },
  { name: 'Gujarat Coast', lat: 21.00, lng: 71.80, zoom: 7.6 },
  { name: 'Strait of Hormuz', lat: 26.00, lng: 56.50, zoom: 8.0 },
];

export const MarineIntelligenceMap: React.FC<MarineIntelligenceMapProps> = ({
  timeMode,
  selectedPfzId,
  onSelectPfz,
  pfzList,
  safetyAlerts,
  protectedZones,
  onTriggerGeofenceWarning,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // STEP 4: Layer Visibility States (Step 14)
  const [showSst, setShowSst] = useState<boolean>(true);
  const [showChlorophyll, setShowChlorophyll] = useState<boolean>(true);
  const [showWind, setShowWind] = useState<boolean>(true);
  const [showPfz, setShowPfz] = useState<boolean>(true);
  const [showProtected, setShowProtected] = useState<boolean>(true);
  const [showAlerts, setShowAlerts] = useState<boolean>(true);
  const [showSpills, setShowSpills] = useState<boolean>(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // STEP 5: Interactive Inspection & Geofence Warning Banner
  const [inspectedLocation, setInspectedLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
    warning?: string;
  } | null>(null);

  // Markers ref for smooth cleanup and updates
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Keep references to dynamic callbacks to avoid rebuilding map on re-render
  const warningCallbackRef = useRef(onTriggerGeofenceWarning);
  warningCallbackRef.current = onTriggerGeofenceWarning;

  const protectedZonesRef = useRef(protectedZones);
  protectedZonesRef.current = protectedZones;

  // =========================================================================
  // STEP 6: INITIALIZE MAPLIBRE GL INSTANCE WITH CARTO DARK BASEMAP
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // STEP 6.1: Initialize global worker
    initializeMapLibreWorker();

    const cartoKey = getCartoApiKey();
    const cartoParam = cartoKey ? `?key=${encodeURIComponent(cartoKey)}` : '';
    const tileUrl = `https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png${cartoParam}`;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: '&copy; CARTO &copy; OpenStreetMap',
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [72.45, 18.90], // Default Konkan / Mumbai Shelf
      zoom: 8.4,
      pitch: 0,
      bearing: 0,
    });

    // STEP 6.2: Attach safe error guard to prevent circular JSON error serialization
    attachSafeMapErrorHandler(map, '[MarineIntelligenceMap]');

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapInstanceRef.current = map;

    // STEP 7: Click listener to test Geofencing Proximity (Step 10)
    map.on('click', (e) => {
      const clickLng = e.lngLat.lng;
      const clickLat = e.lngLat.lat;

      // Check proximity to protected zones
      let activeWarning: string | undefined = undefined;
      for (const pz of protectedZonesRef.current) {
        const dLat = (clickLat - pz.center.lat) * 111;
        const dLng = (clickLng - pz.center.lng) * 111 * Math.cos((clickLat * Math.PI) / 180);
        const distKm = Math.hypot(dLat, dLng);

        if (distKm <= pz.radiusKm) {
          activeWarning = `CRITICAL GEOFENCE VIOLATION: Clicked location lies INSIDE ${pz.name} (${pz.statusLabel}). ${pz.regulationNotice}`;
          break;
        } else if (distKm <= pz.radiusKm + 5) {
          activeWarning = `PROXIMITY CAUTION: Point is within 5km buffer of ${pz.name}. Maintain standoff distance.`;
        }
      }

      setInspectedLocation({
        lat: clickLat,
        lng: clickLng,
        warning: activeWarning,
      });

      if (activeWarning && warningCallbackRef.current) {
        warningCallbackRef.current(activeWarning);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // =========================================================================
  // STEP 8: RENDER VECTOR OVERLAYS AND MARKERS (PFZ, ALERTS, GEOFENCES)
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Helper to create an SVG icon element
    const createMarkerElement = (
      bgColor: string, 
      borderColor: string, 
      label: string, 
      iconType: 'fish' | 'alert' | 'shield' | 'spill'
    ) => {
      const el = document.createElement('div');
      el.className = 'group cursor-pointer flex flex-col items-center';
      el.innerHTML = `
        <div style="background-color: ${bgColor}; border: 1px solid ${borderColor};" class="px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 backdrop-blur-md hover:scale-110 transition-transform">
          <span style="color: ${borderColor}; font-size: 11px; font-weight: bold; font-family: monospace;">${label}</span>
        </div>
        <div style="width: 2px; height: 6px; background-color: ${borderColor}; opacity: 0.7;"></div>
      `;
      return el;
    };

    // 1. Render Potential Fishing Zones (PFZ) Markers
    if (showPfz) {
      pfzList.forEach((pfz) => {
        const isSelected = pfz.id === selectedPfzId;
        const markerEl = createMarkerElement(
          isSelected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(0, 0, 0, 0.85)',
          isSelected ? '#10b981' : '#34d399',
          `🐟 ${pfz.id} (${pfz.productivity})`,
          'fish'
        );

        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectPfz(pfz);
          map.flyTo({ center: [pfz.coordinates.lng, pfz.coordinates.lat], zoom: 9.8, duration: 1200 });
        });

        const marker = new maplibregl.Marker({ element: markerEl })
          .setLngLat([pfz.coordinates.lng, pfz.coordinates.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // 2. Render Marine Safety Alerts Markers
    if (showAlerts) {
      safetyAlerts.forEach((alert) => {
        if (!alert.coordinates) return;
        const markerEl = createMarkerElement(
          'rgba(245, 158, 11, 0.25)',
          alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
          `⚠️ ${alert.type}`,
          'alert'
        );

        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          setInspectedLocation({
            lat: alert.coordinates!.lat,
            lng: alert.coordinates!.lng,
            name: alert.headline,
            warning: `${alert.type} (${alert.severity}): ${alert.description}`,
          });
        });

        const marker = new maplibregl.Marker({ element: markerEl })
          .setLngLat([alert.coordinates.lng, alert.coordinates.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // 3. Render Protected Maritime Zones (MPA & Military)
    if (showProtected) {
      protectedZones.forEach((zone) => {
        const markerEl = createMarkerElement(
          zone.type === 'RESTRICTED_MILITARY' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(168, 85, 247, 0.25)',
          zone.type === 'RESTRICTED_MILITARY' ? '#f87171' : '#c084fc',
          `🛡️ ${zone.name}`,
          'shield'
        );

        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          setInspectedLocation({
            lat: zone.center.lat,
            lng: zone.center.lng,
            name: zone.name,
            warning: `${zone.statusLabel}: ${zone.regulationNotice}. ${zone.penaltyWarning}`,
          });
        });

        const marker = new maplibregl.Marker({ element: markerEl })
          .setLngLat([zone.center.lng, zone.center.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // 4. Render Oil Spill Incidents for PS-26143 Continuity (Step 16)
    if (showSpills) {
      const mockSpills = [
        { id: 'ALR-2026-SAR-089', lat: 18.8412, lng: 72.1921, name: 'Offshore Mumbai SAR Slick', vol: '120t' },
      ];
      mockSpills.forEach((sp) => {
        const markerEl = createMarkerElement(
          'rgba(239, 68, 68, 0.35)',
          '#ef4444',
          `☣️ SPILL [${sp.name}]`,
          'spill'
        );

        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          setInspectedLocation({
            lat: sp.lat,
            lng: sp.lng,
            name: sp.name,
            warning: `PS-26143 Active Spill Incident. Synthetic Aperture Radar detection with Lagrangian drift trajectory.`,
          });
        });

        const marker = new maplibregl.Marker({ element: markerEl })
          .setLngLat([sp.lng, sp.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

  }, [pfzList, safetyAlerts, protectedZones, selectedPfzId, showPfz, showAlerts, showProtected, showSpills, onSelectPfz]);

  // Center on selected PFZ when changed externally
  useEffect(() => {
    if (!selectedPfzId || !mapInstanceRef.current) return;
    const target = pfzList.find(p => p.id === selectedPfzId);
    if (target) {
      mapInstanceRef.current.flyTo({
        center: [target.coordinates.lng, target.coordinates.lat],
        zoom: 9.8,
        duration: 1200,
      });
    }
  }, [selectedPfzId, pfzList]);

  return (
    <div id="marine-intelligence-map-wrapper" className="relative w-full h-full bg-black select-none overflow-hidden">
      
      {/* MapLibre DOM Node */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* =======================================================================
          STEP 9: TOP-LEFT HUD TELEMETRY OVERLAY & REGION SELECTOR
          ======================================================================= */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Active Mode Pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/85 border border-white/15 backdrop-blur-md shadow-xl text-xs font-mono-code">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/90 font-medium">MARINE INTELLIGENCE GRID</span>
          <span className="text-white/40">|</span>
          <span className="text-emerald-400">{timeMode}</span>
        </div>

        {/* Quick Regional Presets */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 p-1 rounded-lg bg-black/80 border border-white/10 backdrop-blur-md text-[11px] font-mono-code">
          {REGIONAL_PRESETS.map((reg) => (
            <button
              key={reg.name}
              onClick={() => {
                mapInstanceRef.current?.flyTo({
                  center: [reg.lng, reg.lat],
                  zoom: reg.zoom,
                  duration: 1400,
                });
              }}
              className="px-2 py-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {reg.name}
            </button>
          ))}
        </div>
      </div>

      {/* =======================================================================
          STEP 10: GEOFENCE VIOLATION & PROXIMITY ALERT BANNER (STEP 10)
          ======================================================================= */}
      {inspectedLocation?.warning && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-md z-30 animate-fade-slide-up">
          <div className="p-3 rounded-lg bg-red-950/90 border border-red-500/40 text-red-200 text-xs backdrop-blur-xl shadow-2xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-mono-code font-semibold text-red-300 text-[11px] uppercase tracking-wide">
                GEOFENCE & REGULATORY NOTICE
              </div>
              <p className="mt-1 text-white/90 leading-relaxed font-geist text-xs">
                {inspectedLocation.warning}
              </p>
              <div className="mt-1.5 text-[10px] font-mono-code text-red-300/70">
                Coords: {inspectedLocation.lat.toFixed(4)}°N, {inspectedLocation.lng.toFixed(4)}°E
              </div>
            </div>
            <button
              onClick={() => setInspectedLocation(null)}
              className="text-red-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =======================================================================
          STEP 11: LAYER VISIBILITY QUICK TOGGLE DOCK (COLLAPSIBLE TO PREVENT OVERLAP)
          ======================================================================= */}
      <div className="absolute bottom-4 left-3 z-20">
        {!isLayerMenuOpen ? (
          <button
            onClick={() => setIsLayerMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 hover:bg-black/95 border border-white/20 hover:border-white/40 text-xs font-mono-code text-white shadow-2xl backdrop-blur-xl transition-all cursor-pointer"
            title="Expand Map Layers Controls"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
          </button>
        ) : (
          <div className="bg-black/95 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-xl text-xs font-mono-code max-w-xs animate-fade-slide-up">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[11px] text-white/60">
              <div className="flex items-center gap-1.5 font-medium text-white/90">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>ACTIVE MAP LAYERS</span>
              </div>
              <button
                onClick={() => setIsLayerMenuOpen(false)}
                className="text-[10px] text-white/40 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer"
              >
                Hide
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => setShowPfz(!showPfz)}
                className={`px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                  showPfz ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-white/40'
                }`}
              >
                <span>PFZ Zones</span>
                <span className="text-[10px]">{showPfz ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className={`px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                  showAlerts ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-white/40'
                }`}
              >
                <span>Hazards</span>
                <span className="text-[10px]">{showAlerts ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowProtected(!showProtected)}
                className={`px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                  showProtected ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-white/40'
                }`}
              >
                <span>MPA / Geofence</span>
                <span className="text-[10px]">{showProtected ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowSpills(!showSpills)}
                className={`px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                  showSpills ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/5 text-white/40'
                }`}
                title="PS-26143 Marine Oil Spills"
              >
                <span>Oil Spills</span>
                <span className="text-[10px]">{showSpills ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowSst(!showSst)}
                className={`px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                  showSst ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-white/40'
                }`}
              >
                <span>SST Contours</span>
                <span className="text-[10px]">{showSst ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowChlorophyll(!showChlorophyll)}
                className={`px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                  showChlorophyll ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-white/5 text-white/40'
                }`}
              >
                <span>Chlorophyll</span>
                <span className="text-[10px]">{showChlorophyll ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================================
          STEP 12: BOTTOM-RIGHT SCALE & ATTRIBUTION
          ======================================================================= */}
      <div className="absolute bottom-4 right-3 z-20 text-[10px] font-mono-code text-white/40 bg-black/70 px-2.5 py-1 rounded border border-white/10 backdrop-blur-md">
        <span>Copernicus · INCOIS · Sentinel-3 · CARTO Basemap</span>
      </div>

    </div>
  );
};

export default MarineIntelligenceMap;
