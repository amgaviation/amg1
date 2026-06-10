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
