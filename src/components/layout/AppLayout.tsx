/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FloatingNavigationBubble from '../FloatingNavigationBubble';
import { GlobalHeader } from './GlobalHeader';

/**
 * Shared Application Layout
 * Ensures global branding, official OORCA logo, and floating wheel navigation
 * are consistently present across existing and future pages.
 */
export const AppLayout: React.FC = () => {
  const location = useLocation();

  // STEP 1: Pages that render their own specialized headers (including PS-26176 /intelligence)
  // (Pricing and Dev paths commented out for later easy update)
  const hasCustomHeader = ['/', '/intelligence', '/simulation', '/alerts'/*, '/pricing', '/data', '/dev' */].includes(location.pathname);

  return (
    <div className="min-h-screen bg-black text-white font-geist flex flex-col selection:bg-white selection:text-black">
      {/* Draggable futuristic command-center floating navigation bubble (wheel navigation) */}
      <FloatingNavigationBubble />

      {/* Default Global Header for any other page */}
      {!hasCustomHeader && (
        <GlobalHeader 
          pageTitle="OORCA Intelligence System" 
          badgeText="STATION VER 4.2"
        />
      )}

      {/* Page Content */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
