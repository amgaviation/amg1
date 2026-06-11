/**
 * Client Dashboard.v9tcm.js — AMG Aviation Group
 * Client/operator portal: profile management, booking requests, billing info.
 * Clients can only edit their own permitted fields.
 * Partners (maintenance_partner, broker_partner) also land here.
 */

import wixLocation from 'wix-location';
import { getMyClientDashboard, saveMyClientProfile } from 'backend/clientProfiles.jsw';
import { formatDate, roleLabel } from 'public/Site.js';

let profileData = null;
let isDirty = false;
let saving = false;

$w.onReady(async function () {
  initNavigation();
  await loadDashboard();
  initProfileForm();
  initCTAButtons();
});

function initNavigation() {
  try { $w('#navProfile').onClick(() => scrollToSection('#profileSection')); } catch {}
  try { $w('#navBilling').onClick(() => scrollToSection('#billingSection')); } catch {}
  try { $w('#navRequests').onClick(() => scrollToSection('#requestsSection')); } catch {}
  try { $w('#navPublicSite').onClick(() => wixLocation.to('/')); } catch {}
  try {
    $w('#navLogout').onClick(() => {
      import('wix-members').then(({ authentication }) => authentication.logout('/'));
    });
  } catch {}
}

function scrollToSection(id) {
  try { $w(id).scrollTo(); } catch {}
}

async function loadDashboard() {
  setLoading(true);
  try {
    const { profile, portalUser } = await getMyClientDashboard();
    profileData = profile;

    const name = portalUser?.displayName || profile?.displayName || 'Member';
    try { $w('#welcomeName').text = `Welcome, ${name}`; } catch {}
    try { $w('#memberRole').text = roleLabel(portalUser?.role); } catch {}
    try { $w('#memberStatus').text = cap(portalUser?.approvalStatus || ''); } catch {}
    try { $w('#memberTier').text = profile?.membershipTier || 'Standard'; } catch {}
    try { $w('#lastLogin').text = formatDate(portalUser?.lastLogin); } catch {}

    if (profile) {
      populateForm(profile);

      // Billing summary
      try { $w('#billingContact').text = profile.billingContact || name; } catch {}
      try { $w('#billingEmail').text   = profile.billingEmail   || portalUser?.loginEmail || ''; } catch {}
    }

    // Profile completion
    const pct = calcCompletionPct(profile);
    try { $w('#profileCompletion').text = `${pct}% complete`; } catch {}

  } catch (e) {
    if (e.message === 'NOT_AUTHENTICATED') {
      wixLocation.to('/login');
      return;
    }
    if (e.message === 'FORBIDDEN') {
      wixLocation.to('/access-denied');
      return;
    }
    console.error('loadDashboard error:', e);
  } finally {
    setLoading(false);
  }
}

function populateForm(profile) {
  const fieldMap = {
    '#inputDisplayName':    profile.displayName       || '',
    '#inputCompany':        profile.company           || '',
    '#inputTitle':          profile.title             || '',
    '#inputPhone':          profile.phone             || '',
    '#inputCity':           profile.city              || '',
    '#inputState':          profile.state             || '',
    '#inputFlightPurpose':  profile.flightPurpose     || '',
    '#inputAnnualHours':    String(profile.annualFlightHours || ''),
    '#inputPreferredAC':    profile.preferredAircraft || '',
    '#inputBillingContact': profile.billingContact    || '',
    '#inputBillingEmail':   profile.billingEmail      || '',
    '#inputNotes':          profile.notes             || '',
  };

  Object.entries(fieldMap).forEach(([id, val]) => {
    try { $w(id).value = val; } catch {}
  });
}

function initProfileForm() {
  const ids = [
    '#inputDisplayName', '#inputCompany', '#inputTitle', '#inputPhone',
    '#inputCity', '#inputState', '#inputFlightPurpose', '#inputAnnualHours',
    '#inputPreferredAC', '#inputBillingContact', '#inputBillingEmail', '#inputNotes',
  ];
  ids.forEach(id => {
    try {
      $w(id).onInput(() => { isDirty = true; showUnsavedIndicator(); });
      $w(id).onChange(() => { isDirty = true; showUnsavedIndicator(); });
    } catch {}
  });
}

function showUnsavedIndicator() {
  try { $w('#unsavedBadge').show(); } catch {}
}

function initCTAButtons() {
  try { $w('#btnSaveProfile').onClick(handleSave); } catch {}

  try {
    $w('#btnCancelEdit').onClick(() => {
      if (profileData) populateForm(profileData);
      isDirty = false;
      try { $w('#unsavedBadge').hide(); } catch {}
    });
  } catch {}

  // New booking/mission request
  try { $w('#btnNewRequest').onClick(() => wixLocation.to('/booking-request')); } catch {}
  try { $w('#btnContactSupport').onClick(() => wixLocation.to('/contact')); } catch {}

  // Billing actions — these open Wix Paid Plans or Stripe portal links
  try { $w('#btnManageBilling').onClick(() => wixLocation.to('/checkout')); } catch {}
  try { $w('#btnUpgradePlan').onClick(() => wixLocation.to('/plans-pricing')); } catch {}
}

async function handleSave() {
  if (saving) return;
  saving = true;
  setSaveLoading(true);
  clearMessages();

  try {
    const update = {
      displayName:        safeVal('#inputDisplayName'),
      company:            safeVal('#inputCompany'),
      title:              safeVal('#inputTitle'),
      phone:              safeVal('#inputPhone'),
      city:               safeVal('#inputCity'),
      state:              safeVal('#inputState'),
      flightPurpose:      safeVal('#inputFlightPurpose'),
      annualFlightHours:  safeNum('#inputAnnualHours'),
      preferredAircraft:  safeVal('#inputPreferredAC'),
      billingContact:     safeVal('#inputBillingContact'),
      billingEmail:       safeVal('#inputBillingEmail'),
      notes:              safeVal('#inputNotes'),
    };

    profileData = await saveMyClientProfile(update);
    isDirty = false;
    showSuccess('Profile saved successfully.');
    try { $w('#unsavedBadge').hide(); } catch {}

    // Refresh display
    if (profileData) {
      try { $w('#billingContact').text = profileData.billingContact || ''; } catch {}
      try { $w('#billingEmail').text   = profileData.billingEmail   || ''; } catch {}
    }
  } catch (e) {
    console.error('Save profile error:', e);
    showError('Save failed. Please try again or contact support.');
  } finally {
    saving = false;
    setSaveLoading(false);
  }
}

function setSaveLoading(on) {
  try { $w('#btnSaveProfile').label = on ? 'Saving…' : 'Save Profile'; } catch {}
  try { on ? $w('#btnSaveProfile').disable() : $w('#btnSaveProfile').enable(); } catch {}
}

function showSuccess(msg) {
  try { $w('#saveSuccess').text = msg; $w('#saveSuccess').show('fade', { duration: 300 }); } catch {}
  setTimeout(() => { try { $w('#saveSuccess').hide('fade', { duration: 300 }); } catch {} }, 4000);
}

function showError(msg) {
  try { $w('#saveError').text = msg; $w('#saveError').show('fade', { duration: 300 }); } catch {}
}

function clearMessages() {
  try { $w('#saveSuccess').hide(); } catch {}
  try { $w('#saveError').hide(); } catch {}
}

function setLoading(on) {
  try { $w('#dashboardLoader')[on ? 'show' : 'hide'](); } catch {}
}

function calcCompletionPct(p) {
  if (!p) return 0;
  const fields = ['displayName', 'company', 'phone', 'city', 'flightPurpose', 'billingEmail'];
  const filled = fields.filter(f => p[f] && String(p[f]).trim());
  return Math.round((filled.length / fields.length) * 100);
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function safeVal(id) { try { return ($w(id).value || '').trim(); } catch { return ''; } }

function safeNum(id) {
  try { const n = parseFloat($w(id).value || '0'); return isNaN(n) ? 0 : n; } catch { return 0; }
}
