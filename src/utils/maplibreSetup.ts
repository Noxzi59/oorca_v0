/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =========================================================================
// STEP 1: IMPORT MAPLIBRE CORE
// =========================================================================
import * as maplibregl from 'maplibre-gl';

let isWorkerConfigured = false;

// =========================================================================
// STEP 2: CONFIGURE MAPLIBRE GL WORKER URL GLOBALLY
// Prevents "Worker failed to load. Check that the worker URL is correct."
// =========================================================================
export function initializeMapLibreWorker(): void {
  if (isWorkerConfigured) return;
  isWorkerConfigured = true;

  try {
    if (typeof window !== 'undefined') {
      // Use origin-relative or absolute worker path served by backend / public
      const workerUrl = `${window.location.origin}/maplibre-gl-worker.mjs`;
      maplibregl.setWorkerUrl(workerUrl);
    }
  } catch (err) {
    console.warn('[MapLibre Config] Unable to set worker URL:', (err as Error)?.message || 'Unknown error');
  }
}

// Auto-run on module load
initializeMapLibreWorker();

// =========================================================================
// STEP 3: SAFE ERROR EVENT HANDLER
// Prevents "Converting circular structure to JSON" caused by MapLibre
// ErrorEvent holding circular references (event.target._camera._eventedParent -> map)
// =========================================================================
export function attachSafeMapErrorHandler(map: maplibregl.Map, prefix: string = '[MapLibre GL]'): void {
  map.on('error', (e) => {
    // 1. Filter out expected 404 tile requests on distant ocean boundaries
    const msg = e.error?.message || (typeof e.error === 'string' ? e.error : '');
    if (msg.includes('404')) return;
    if (msg.includes('Worker failed to load')) {
      console.warn(`${prefix} Handled worker initialization notice:`, msg);
      return;
    }

    // 2. Safe string-only logging: NEVER log the raw Event or Map object
    const cleanMessage = msg || 'Map event notice';
    console.warn(`${prefix} Notice:`, cleanMessage);
  });
}
