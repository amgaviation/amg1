/**
 * Access Denied.t0d5a.js — AMG Aviation Group
 * Shown for denied, suspended, or unauthorised access attempts.
 */

import wixLocation from 'wix-location';
import { getMyPortalUser } from 'backend/portalAuth.jsw';

$w.onReady(async function () {
  await loadStatus();
  initButtons();
});

async function loadStatus() {
  try {
    const user = await getMyPortalUser();
    if (!user) {
      try { $w('#deniedReason').text = 'You are not signed in.'; } catch {}
      return;
    }

    // If somehow approved now, redirect
    if (user.approvalStatus === 'approved') {
      wixLocation.to('/portal-router');
      return;
    }

    const reasons = {
      denied:    'Your portal access request was not approved.',
      suspended: 'Your portal access has been suspended.',
    };
    try { $w('#deniedReason').text = reasons[user.approvalStatus] || 'Access is not available for this account.'; } catch {}
    try { $w('#deniedName').text = user.displayName || user.loginEmail || ''; } catch {}
    try { $w('#deniedStatus').text = user.approvalStatus || ''; } catch {}
  } catch (e) {
    console.error('Access denied page error:', e);
  }
}

function initButtons() {
  try { $w('#btnDeniedContact').onClick(() => wixLocation.to('/contact?subject=Portal+Access+Appeal')); } catch {}
  try { $w('#btnDeniedHome').onClick(() => wixLocation.to('/')); } catch {}
}
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
