/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { IntelligenceController } from '../controllers/intelligence.controller';

const router = Router();

// =========================================================================
// STEP 1: CONVERSATIONAL MULTI-AGENT INTELLIGENCE REASONING (PS-26176)
// =========================================================================
router.post('/query', IntelligenceController.queryIntelligence);

// =========================================================================
// STEP 2: METOCEAN & MARINE CONDITIONS
// =========================================================================
router.get('/conditions', IntelligenceController.getMarineConditions);

export default router;
