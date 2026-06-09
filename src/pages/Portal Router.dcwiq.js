// Page code for /portal-router

import wixLocation from 'wix-location';
import { getPortalRoute } from 'backend/portalAuth.jsw';

$w.onReady(async function () {
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
