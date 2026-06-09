// Page code for /access-denied

import { getMyPortalUser } from 'backend/portalAuth.jsw';

$w.onReady(async function () {
  try {
    const result = await getMyPortalUser();
    const user = result?.portalUser;

    if ($w('#statusText')) {
      if (user) {
        $w('#statusText').text =
          `Portal access is not available for this account.\n\nEmail: ${user.loginEmail}\nRole: ${user.role || 'Not assigned'}\nStatus: ${user.approvalStatus || 'Not approved'}`;
      } else {
        $w('#statusText').text =
          'Portal access is not available for this account. Contact AMG if you believe this is incorrect.';
      }
    }
  } catch (err) {
    console.error('Access denied page failed:', err);
  }
});
