import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// STEP 1: Initialize MapLibre Web Worker globally before any map component mounts
import { initializeMapLibreWorker } from './utils/maplibreSetup';
import App from './App.tsx';
import './index.css';

// STEP 2: Configure MapLibre Worker
initializeMapLibreWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
