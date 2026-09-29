/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import simulationRoutes from './backend/api/simulation.routes';
import environmentRoutes from './backend/api/environment.routes';
import alertsRoutes from './backend/api/alerts.routes';
// STEP 1: Import Marine Ecosystem Collaborative Agents Intelligence Routes (SIH PS 26176)
import intelligenceRoutes from './backend/api/intelligence.routes';
import { EnvironmentController } from './backend/controllers/environment.controller';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = '0.0.0.0';

  // Request body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic CORS headers for local/cross-origin calls
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health and API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'OORCA Ocean Simulation Backend Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Simulation, Environmental Data & Ocean Intelligence Alerts APIs
  app.use('/api/simulation', simulationRoutes);
  app.use('/api/environment', environmentRoutes);
  app.use('/api/alerts', alertsRoutes);
  // STEP 2: Mount Marine Intelligence & Collaborative Agents reasoning endpoint (PS 26176)
  app.use('/api/intelligence', intelligenceRoutes);

  // Dedicated Maritime Vessel Search & Identity Resolution endpoint (Section 17 requirement)
  app.get('/api/vessels/search', EnvironmentController.getVesselIdentity);

  // =========================================================================
  // STEP 3: SERVE MAPLIBRE GL WORKER & SHARED SCRIPTS WITH STRICT JAVASCRIPT MIME TYPE
  // Prevents "Worker failed to load" and circular serialization errors in bundler/iframe
  // =========================================================================
  app.get(['/maplibre-gl-worker.mjs', '/maplibre-gl-worker.js'], (req, res) => {
    const workerPathInPublic = path.join(process.cwd(), 'public/maplibre-gl-worker.mjs');
    const workerPathInDist = path.join(process.cwd(), 'dist/maplibre-gl-worker.mjs');
    const workerPathInNodeModules = path.join(process.cwd(), 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');

    let target = workerPathInPublic;
    if (fs.existsSync(workerPathInPublic)) {
      target = workerPathInPublic;
    } else if (fs.existsSync(workerPathInDist)) {
      target = workerPathInDist;
    } else if (fs.existsSync(workerPathInNodeModules)) {
      target = workerPathInNodeModules;
    }

    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(target);
  });

  app.get(['/maplibre-gl-shared.mjs', '/maplibre-gl-shared.js'], (req, res) => {
    const sharedPathInPublic = path.join(process.cwd(), 'public/maplibre-gl-shared.mjs');
    const sharedPathInDist = path.join(process.cwd(), 'dist/maplibre-gl-shared.mjs');
    const sharedPathInNodeModules = path.join(process.cwd(), 'node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs');

    let target = sharedPathInPublic;
    if (fs.existsSync(sharedPathInPublic)) {
      target = sharedPathInPublic;
    } else if (fs.existsSync(sharedPathInDist)) {
      target = sharedPathInDist;
    } else if (fs.existsSync(sharedPathInNodeModules)) {
      target = sharedPathInNodeModules;
    }

    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(target);
  });

  // Vite middleware for development vs Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware integrated in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[Server] Serving production static assets from ${distPath}`);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[OORCA] Simulation Engine server active at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal error starting OORCA backend server:', err);
  process.exit(1);
});
