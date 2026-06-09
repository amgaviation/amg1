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
