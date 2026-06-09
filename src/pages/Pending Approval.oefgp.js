// Page code for /pending-approval

import { getMyPortalUser } from 'backend/portalAuth.jsw';

$w.onReady(async function () {
  try {
    const result = await getMyPortalUser();
    const user = result?.portalUser;

    if ($w('#statusText')) {
      if (user) {
        $w('#statusText').text =
          `Your AMG portal profile is pending review.\n\nEmail: ${user.loginEmail}\nRole: ${user.role || 'Not assigned'}\nStatus: ${user.approvalStatus || 'pending'}`;
      } else {
        $w('#statusText').text =
          'Your AMG portal profile is pending review. If you just created an account, AMG will review it before access is granted.';
      }
    }
  } catch (err) {
    console.error('Pending approval page failed:', err);
  }
});
