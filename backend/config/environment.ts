/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// STEP 1: Core Server & Environment Configuration
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  
  // STEP 2: Weather & Atmospheric APIs (OpenWeatherMap API Key)
  weatherApiKey: (process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || '').trim(),
  
  // STEP 3: Global Fishing Watch (GFW) API Token for Vessel Tracking & Apparent Fishing Effort
  gfwApiToken: (process.env.GFW_API_TOKEN || '').trim(),

  // STEP 4: Oceanographic & Marine Observation APIs
  oceanDataApiKey: (process.env.OCEAN_DATA_API_KEY || '').trim(),
  noaaApiKey: (process.env.NOAA_API_KEY || '').trim(),
  copernicusApiKey: (process.env.COPERNICUS_API_KEY || '').trim(),
  
  // STEP 5: In-Memory Caching TTL Configuration
  cache: {
    weatherTtlMs: 1000 * 60 * 15,         // 15 minutes for real-time weather
    forecastTtlMs: 1000 * 60 * 30,        // 30 minutes for forecast timeline
    oceanTtlMs: 1000 * 60 * 60,           // 1 hour
    geographicTtlMs: 1000 * 60 * 60 * 24, // 24 hours
    simulationTtlMs: 1000 * 60 * 60 * 6,  // 6 hours
  },

  // STEP 6: Hydrodynamic & Physical Dispersion Constants
  physics: {
    windDriftFactor: 0.032, // 3.2% of 10m wind speed
    coriolisFactor: 0.08,   // deflection fraction in Northern Hemisphere
    seaWaterDensityKgM3: 1025,
    airDensityKgM3: 1.225,
    gravity: 9.81,
  },
};
