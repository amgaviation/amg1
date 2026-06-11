/**
 * Pending Approval.oefgp.js — AMG Aviation Group
 * Shown when a member's account is awaiting admin approval.
 */

import wixLocation from 'wix-location';
import { getMyPortalUser } from 'backend/portalAuth.jsw';

$w.onReady(async function () {
  await loadUserInfo();
  initButtons();
});

async function loadUserInfo() {
  try {
    const user = await getMyPortalUser();
    if (!user) {
      // Not logged in at all
      wixLocation.to('/login');
      return;
    }

    // If somehow they're approved now, redirect to portal
    if (user.approvalStatus === 'approved') {
      wixLocation.to('/portal-router');
      return;
    }

    // If denied or suspended, redirect to access denied
    if (user.approvalStatus === 'denied' || user.approvalStatus === 'suspended') {
      wixLocation.to('/access-denied');
      return;
    }

    // Show their name and role
    try { $w('#pendingName').text = user.displayName || user.loginEmail || 'Member'; } catch {}
    try { $w('#pendingRole').text = formatRole(user.role); } catch {}
    try { $w('#pendingEmail').text = user.loginEmail || ''; } catch {}
  } catch (e) {
    console.error('Pending approval page error:', e);
  }
}

function formatRole(role) {
  const map = {
    crew_pilot:          'Crew / Pilot',
    client_owner:        'Client / Operator',
    maintenance_partner: 'Maintenance Partner',
    broker_partner:      'Broker Partner',
    amg_admin:           'Administrator',
  };
  return map[role] || 'Member';
}

function initButtons() {
  try { $w('#btnRefreshStatus').onClick(() => wixLocation.to('/portal-router')); } catch {}
  try { $w('#btnPendingContact').onClick(() => wixLocation.to('/contact?subject=Portal+Access')); } catch {}
  try { $w('#btnPendingHome').onClick(() => wixLocation.to('/')); } catch {}
}
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
