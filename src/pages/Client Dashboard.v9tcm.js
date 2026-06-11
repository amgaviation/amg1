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
// Page code for /client-dashboard
// Required IDs:
// clientStatusText, clientMessage, saveClientProfileButton, refreshClientProfileButton,
// clientFullName, clientPhone, clientCompanyName, clientType,
// clientHomeAirport, clientPreferredAirport, clientAircraftOwned, clientTailNumbers,
// clientBillingPreference, clientBillingContactName, clientBillingEmail, clientBillingPhone,
// clientAuthorizedRequesters, clientServicePreferences, clientOwnerNotes,
// clientDefaultAircraftCategory

import { getMyClientDashboard, saveMyClientProfile } from 'backend/clientProfiles.jsw';

let currentProfile = null;
let currentPortalUser = null;

$w.onReady(async function () {
  setupHandlers();
  await loadClientDashboard();
});

function el(id) {
  try {
    return $w(`#${id}`);
  } catch (err) {
    return null;
  }
}

function setupHandlers() {
  const saveButton = el('saveClientProfileButton');
  const refreshButton = el('refreshClientProfileButton');

  if (saveButton && typeof saveButton.onClick === 'function') saveButton.onClick(saveClientProfile);
  if (refreshButton && typeof refreshButton.onClick === 'function') refreshButton.onClick(loadClientDashboard);
}

async function loadClientDashboard() {
  try {
    setMessage('Loading client profile...');

    const result = await getMyClientDashboard();
    currentPortalUser = result.portalUser;
    currentProfile = result.clientProfile;

    fillProfile(currentProfile);
    setStatus(currentPortalUser, currentProfile);
    setMessage('Client profile loaded.');
  } catch (err) {
    console.error('Client dashboard load failed:', err);
    setMessage(`Client dashboard error: ${err.message || err}`);
    const statusText = el('clientStatusText');
    if (statusText) statusText.text = 'Client profile could not load. Check ClientProfiles collection, PortalUsers role/status, and page element IDs.';
  }
}

function setStatus(portalUser, profile) {
  const item = el('clientStatusText');
  if (!item) return;

  if (!profile) {
    item.text = 'No client profile loaded.';
    return;
  }

  item.text = [
    `Name: ${profile.fullName || 'Not set'}`,
    `Email: ${profile.loginEmail || portalUser?.loginEmail || 'Not set'}`,
    `Portal Role: ${portalUser?.role || 'Not set'}`,
    `Client Status: ${profile.clientStatus || 'Not set'}`,
    `Approval: ${profile.approvalStatus || 'Not set'}`,
    `Subscription: ${profile.subscriptionStatus || 'none'}`,
    `Home Airport: ${profile.homeAirport || 'Not set'}`,
    `Last Updated: ${profile.lastProfileUpdate ? new Date(profile.lastProfileUpdate).toLocaleString() : 'Not set'}`
  ].join(' | ');
}

function fillProfile(profile) {
  if (!profile) return;

  setValue('clientFullName', profile.fullName || '');
  setValue('clientPhone', profile.phone || '');
  setValue('clientCompanyName', profile.companyName || '');
  setValue('clientType', profile.clientType || 'owner');
  setValue('clientHomeAirport', profile.homeAirport || '');
  setValue('clientPreferredAirport', profile.preferredAirport || '');
  setValue('clientAircraftOwned', profile.aircraftOwned || '');
  setValue('clientTailNumbers', profile.tailNumbers || '');
  setValue('clientBillingPreference', profile.billingPreference || 'invoice');
  setValue('clientBillingContactName', profile.billingContactName || '');
  setValue('clientBillingEmail', profile.billingEmail || '');
  setValue('clientBillingPhone', profile.billingPhone || '');
  setValue('clientAuthorizedRequesters', profile.authorizedRequesters || '');
  setValue('clientServicePreferences', profile.servicePreferences || '');
  setValue('clientOwnerNotes', profile.ownerNotes || '');
  setValue('clientDefaultAircraftCategory', profile.defaultAircraftCategory || '');
}

function readProfile() {
  return {
    fullName: getValue('clientFullName'),
    phone: getValue('clientPhone'),
    companyName: getValue('clientCompanyName'),
    clientType: getValue('clientType'),
    homeAirport: getValue('clientHomeAirport'),
    preferredAirport: getValue('clientPreferredAirport'),
    aircraftOwned: getValue('clientAircraftOwned'),
    tailNumbers: getValue('clientTailNumbers'),
    billingPreference: getValue('clientBillingPreference'),
    billingContactName: getValue('clientBillingContactName'),
    billingEmail: getValue('clientBillingEmail'),
    billingPhone: getValue('clientBillingPhone'),
    authorizedRequesters: getValue('clientAuthorizedRequesters'),
    servicePreferences: getValue('clientServicePreferences'),
    ownerNotes: getValue('clientOwnerNotes'),
    defaultAircraftCategory: getValue('clientDefaultAircraftCategory')
  };
}

async function saveClientProfile() {
  try {
    setMessage('Saving client profile...');
    currentProfile = await saveMyClientProfile(readProfile());
    fillProfile(currentProfile);
    setStatus(currentPortalUser, currentProfile);
    setMessage('Client profile saved.');
  } catch (err) {
    console.error('Client profile save failed:', err);
    setMessage(`Save failed: ${err.message || err}`);
  }
}

function setMessage(message) {
  const item = el('clientMessage');
  if (item) item.text = message;
  console.log(message);
}

function getValue(id) {
  const item = el(id);
  return item ? item.value : '';
}

function setValue(id, value) {
  const item = el(id);
  if (item) item.value = value;
}
