/**
 * Portal Router.dcwiq.js — AMG Aviation Group
 * Reads the current member's role and approval status, then redirects.
 * This page shows only a loading spinner to the user.
 *
 * Routes:
 *   Not logged in              → /login
 *   pending                    → /pending-approval
 *   denied | suspended         → /access-denied
 *   amg_admin + approved       → /admin-dashboard
 *   crew_pilot + approved      → /crew-dashboard
 *   client/partner + approved  → /client-dashboard
 */
// Page code for /portal-router

import wixLocation from 'wix-location';
import { getPortalRoute } from 'backend/portalAuth.jsw';

$w.onReady(async function () {
  showSpinner(true);

  try {
    const { route } = await getPortalRoute();
    wixLocation.to(route);
  } catch (e) {
    console.error('Portal router error:', e);
    // Fallback: send to login
    wixLocation.to('/login');
  }
});

function showSpinner(on) {
  try { $w('#routerSpinner')[on ? 'show' : 'hide'](); } catch {}
  try { $w('#routerText').text = 'Verifying access…'; } catch {}
}
  try {
    const result = await getPortalRoute();

    if (!result || !result.route) {
      wixLocation.to('/access-denied');
      return;
    }

    wixLocation.to(result.route);
  } catch (err) {
    console.error('Portal router failed:', err);
    wixLocation.to('/access-denied');
  }
});
