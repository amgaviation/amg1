/**
 * Crew Dashboard.w36ad.js — AMG Aviation Group
 * Crew/pilot portal: profile management, status display, document links.
 * Crew members can only edit their own permitted fields.
 */

import wixLocation from 'wix-location';
import { getMyCrewDashboard, saveMyCrewProfile } from 'backend/crewProfiles.jsw';
import { formatDate, formatHours } from 'public/Site.js';

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
  try { $w('#navDocuments').onClick(() => scrollToSection('#documentsSection')); } catch {}
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
    const { profile, portalUser } = await getMyCrewDashboard();
    profileData = profile;

    // Welcome header
    const name = portalUser?.displayName || profile?.displayName || 'Pilot';
    try { $w('#welcomeName').text = `Welcome back, ${name}`; } catch {}
    try { $w('#memberRole').text = 'Crew / Pilot'; } catch {}
    try { $w('#memberStatus').text = cap(portalUser?.approvalStatus || ''); } catch {}
    try { $w('#lastLogin').text = formatDate(portalUser?.lastLogin); } catch {}

    // KPI tiles
    try { $w('#totalHoursKPI').text = formatHours(profile?.totalHours); } catch {}
    try { $w('#picKPI').text   = formatHours(profile?.pic); } catch {}
    try { $w('#sicKPI').text   = formatHours(profile?.sic); } catch {}
    try { $w('#medClassKPI').text = profile?.medicalClass || '—'; } catch {}
    try { $w('#medExpiryKPI').text = formatDate(profile?.medicalExpiry); } catch {}

    // Populate form if profile exists
    if (profile) {
      populateForm(profile);
    }

    // Profile completion indicator
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
    '#inputTitle':        profile.title              || '',
    '#inputPhone':        profile.phone              || '',
    '#inputCity':         profile.city               || '',
    '#inputState':        profile.state              || '',
    '#inputTotalHours':   String(profile.totalHours  || ''),
    '#inputPIC':          String(profile.pic          || ''),
    '#inputSIC':          String(profile.sic          || ''),
    '#inputSimHours':     String(profile.simulatorHours || ''),
    '#inputMedClass':     profile.medicalClass        || '',
    '#inputMedExpiry':    profile.medicalExpiry ? new Date(profile.medicalExpiry) : null,
    '#inputBio':          profile.bio                 || '',
    '#inputLinkedIn':     profile.linkedIn            || '',
    '#inputAvailability': profile.availabilityStatus  || '',
  };

  Object.entries(fieldMap).forEach(([id, val]) => {
    try {
      if (val === null) return;
      if (id === '#inputMedExpiry' && val instanceof Date) {
        $w(id).value = val;
      } else {
        $w(id).value = val;
      }
    } catch {}
  });

  // Certifications multi-select or text
  try {
    const certs = (profile.certifications || []).join(', ');
    $w('#inputCertifications').value = certs;
  } catch {}
}

function initProfileForm() {
  const editableIds = [
    '#inputTitle', '#inputPhone', '#inputCity', '#inputState',
    '#inputTotalHours', '#inputPIC', '#inputSIC', '#inputSimHours',
    '#inputMedClass', '#inputMedExpiry', '#inputBio', '#inputLinkedIn',
    '#inputAvailability', '#inputCertifications',
  ];

  editableIds.forEach(id => {
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
  try {
    $w('#btnSaveProfile').onClick(handleSave);
  } catch {}

  try {
    $w('#btnCancelEdit').onClick(() => {
      if (profileData) populateForm(profileData);
      isDirty = false;
      try { $w('#unsavedBadge').hide(); } catch {}
    });
  } catch {}

  try { $w('#btnBookingRequest').onClick(() => wixLocation.to('/booking-request')); } catch {}
  try { $w('#btnContactSupport').onClick(() => wixLocation.to('/contact')); } catch {}
}

async function handleSave() {
  if (saving) return;
  saving = true;
  setSaveLoading(true);
  clearMessages();

  try {
    const update = {
      displayName:       safeVal('#inputDisplayName') || profileData?.displayName,
      title:             safeVal('#inputTitle'),
      phone:             safeVal('#inputPhone'),
      city:              safeVal('#inputCity'),
      state:             safeVal('#inputState'),
      totalHours:        safeNum('#inputTotalHours'),
      pic:               safeNum('#inputPIC'),
      sic:               safeNum('#inputSIC'),
      simulatorHours:    safeNum('#inputSimHours'),
      medicalClass:      safeVal('#inputMedClass'),
      medicalExpiry:     safeDate('#inputMedExpiry'),
      bio:               safeVal('#inputBio'),
      linkedIn:          safeVal('#inputLinkedIn'),
      availabilityStatus:safeVal('#inputAvailability'),
      certifications:    safeVal('#inputCertifications').split(',').map(s => s.trim()).filter(Boolean),
    };

    profileData = await saveMyCrewProfile(update);
    isDirty = false;
    showSuccess('Profile saved successfully.');
    try { $w('#unsavedBadge').hide(); } catch {}
  } catch (e) {
    console.error('Save profile error:', e);
    showError('Save failed. Please try again.');
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
  const fields = ['displayName', 'title', 'phone', 'totalHours', 'medicalClass', 'bio', 'certifications'];
  const filled = fields.filter(f => p[f] && (Array.isArray(p[f]) ? p[f].length > 0 : String(p[f]).trim()));
  return Math.round((filled.length / fields.length) * 100);
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function safeVal(id) { try { return ($w(id).value || '').trim(); } catch { return ''; } }

function safeNum(id) {
  try { const n = parseFloat($w(id).value || '0'); return isNaN(n) ? 0 : n; } catch { return 0; }
}

function safeDate(id) {
  try { return $w(id).value || null; } catch { return null; }
// Page code for /crew-dashboard
// Required IDs:
// profileStatusText, crewMessage, saveCrewProfileButton, refreshCrewProfileButton,
// crewFullName, crewPhone, crewBaseAirport, crewNearestAirport, crewHomeCity, crewHomeState,
// crewCertificates, crewTypeRatings, crewAircraftExperience,
// crewTotalTime, crewPicTime, crewMultiTime, crewTurbineTime, crewJetTime, crewHelicopterTime,
// crewMedicalClass, crewPassportStatus, crewAvailabilityNotice,
// crewFerry, crewContract, crewMaintenanceFlights, crewInternational,
// crewPreferredAircraft, crewDayRate, crewOvernightRate, crewTravelPolicy, crewNotes

import { getMyCrewDashboard, saveMyCrewProfile } from 'backend/crewProfiles.jsw';

let currentProfile = null;
let currentPortalUser = null;

$w.onReady(async function () {
  setupHandlers();
  await loadCrewDashboard();
});

function el(id) {
  try {
    return $w(`#${id}`);
  } catch (err) {
    return null;
  }
}

function setupHandlers() {
  const saveButton = el('saveCrewProfileButton');
  const refreshButton = el('refreshCrewProfileButton');

  if (saveButton && typeof saveButton.onClick === 'function') saveButton.onClick(saveCrewProfile);
  if (refreshButton && typeof refreshButton.onClick === 'function') refreshButton.onClick(loadCrewDashboard);
}

async function loadCrewDashboard() {
  try {
    setMessage('Loading crew profile...');

    const result = await getMyCrewDashboard();
    currentPortalUser = result.portalUser;
    currentProfile = result.crewProfile;

    fillProfile(currentProfile);
    setStatus(currentPortalUser, currentProfile);
    setMessage('Crew profile loaded.');
  } catch (err) {
    console.error('Crew dashboard load failed:', err);
    setMessage(`Crew dashboard error: ${err.message || err}`);
    const statusText = el('profileStatusText');
    if (statusText) statusText.text = 'Crew profile could not load. Check CrewProfiles collection, PortalUsers role/status, and page element IDs.';
  }
}

function setStatus(portalUser, profile) {
  const item = el('profileStatusText');
  if (!item) return;

  if (!profile) {
    item.text = 'No crew profile loaded.';
    return;
  }

  item.text = [
    `Name: ${profile.fullName || 'Not set'}`,
    `Email: ${profile.loginEmail || portalUser?.loginEmail || 'Not set'}`,
    `Portal Role: ${portalUser?.role || 'Not set'}`,
    `Crew Status: ${profile.crewStatus || 'Not set'}`,
    `Profile: ${profile.profileCompletionStatus || 'Not set'}`,
    `Credentials: ${profile.credentialStatus || 'Not set'}`,
    `Base: ${profile.baseAirport || 'Not set'}`,
    `Last Updated: ${profile.lastProfileUpdate ? new Date(profile.lastProfileUpdate).toLocaleString() : 'Not set'}`
  ].join(' | ');
}

function fillProfile(profile) {
  if (!profile) return;

  setValue('crewFullName', profile.fullName || '');
  setValue('crewPhone', profile.phone || '');
  setValue('crewBaseAirport', profile.baseAirport || '');
  setValue('crewNearestAirport', profile.nearestMajorAirport || '');
  setValue('crewHomeCity', profile.homeCity || '');
  setValue('crewHomeState', profile.homeState || '');
  setValue('crewCertificates', profile.certificatesRatings || '');
  setValue('crewTypeRatings', profile.typeRatings || '');
  setValue('crewAircraftExperience', profile.aircraftExperience || '');
  setValue('crewTotalTime', String(profile.totalTime || 0));
  setValue('crewPicTime', String(profile.picTime || 0));
  setValue('crewMultiTime', String(profile.multiTime || 0));
  setValue('crewTurbineTime', String(profile.turbineTime || 0));
  setValue('crewJetTime', String(profile.jetTime || 0));
  setValue('crewHelicopterTime', String(profile.helicopterTime || 0));
  setValue('crewMedicalClass', profile.medicalClass || '');
  setValue('crewPassportStatus', profile.passportStatus || '');
  setValue('crewAvailabilityNotice', profile.availabilityNotice || '');
  setChecked('crewFerry', profile.availableForFerry === true);
  setChecked('crewContract', profile.availableForContract === true);
  setChecked('crewMaintenanceFlights', profile.availableForMaintenanceFlights === true);
  setChecked('crewInternational', profile.availableForInternational === true);
  setValue('crewPreferredAircraft', profile.preferredAircraft || '');
  setValue('crewDayRate', String(profile.dayRate || 0));
  setValue('crewOvernightRate', String(profile.overnightRate || 0));
  setValue('crewTravelPolicy', profile.travelPolicy || '');
  setValue('crewNotes', profile.crewNotes || '');
}

function readProfile() {
  return {
    fullName: getValue('crewFullName'),
    phone: getValue('crewPhone'),
    baseAirport: getValue('crewBaseAirport'),
    nearestMajorAirport: getValue('crewNearestAirport'),
    homeCity: getValue('crewHomeCity'),
    homeState: getValue('crewHomeState'),
    certificatesRatings: getValue('crewCertificates'),
    typeRatings: getValue('crewTypeRatings'),
    aircraftExperience: getValue('crewAircraftExperience'),
    totalTime: getValue('crewTotalTime'),
    picTime: getValue('crewPicTime'),
    multiTime: getValue('crewMultiTime'),
    turbineTime: getValue('crewTurbineTime'),
    jetTime: getValue('crewJetTime'),
    helicopterTime: getValue('crewHelicopterTime'),
    medicalClass: getValue('crewMedicalClass'),
    passportStatus: getValue('crewPassportStatus'),
    availabilityNotice: getValue('crewAvailabilityNotice'),
    availableForFerry: getChecked('crewFerry'),
    availableForContract: getChecked('crewContract'),
    availableForMaintenanceFlights: getChecked('crewMaintenanceFlights'),
    availableForInternational: getChecked('crewInternational'),
    preferredAircraft: getValue('crewPreferredAircraft'),
    dayRate: getValue('crewDayRate'),
    overnightRate: getValue('crewOvernightRate'),
    travelPolicy: getValue('crewTravelPolicy'),
    crewNotes: getValue('crewNotes'),
    profileCompletionStatus: 'complete'
  };
}

async function saveCrewProfile() {
  try {
    setMessage('Saving crew profile...');
    currentProfile = await saveMyCrewProfile(readProfile());
    fillProfile(currentProfile);
    setStatus(currentPortalUser, currentProfile);
    setMessage('Crew profile saved.');
  } catch (err) {
    console.error('Crew profile save failed:', err);
    setMessage(`Save failed: ${err.message || err}`);
  }
}

function setMessage(message) {
  const item = el('crewMessage');
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

function getChecked(id) {
  const item = el(id);
  return item ? item.checked : false;
}

function setChecked(id, value) {
  const item = el(id);
  if (item) item.checked = value;
}
