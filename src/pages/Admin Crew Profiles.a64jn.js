// Page code for /admin-crew-profiles
// Required IDs for full functionality:
// adminCrewCountsText, adminCrewMessage, crewProfilesTable,
// crewStatusFilter, crewRefreshButton,
// selectedCrewText, editCrewName, editCrewPhone, editCrewBaseAirport,
// editCrewNearestAirport, editCrewPreferredAircraft, editCrewStatus,
// editCredentialStatus, editProfileCompletionStatus, editCrewActive,
// editCrewNotes, saveCrewButton, approveCrewButton, suspendCrewButton

import {
  adminListCrewProfiles,
  adminGetCrewProfileCounts,
  adminUpdateCrewProfile
} from 'backend/crewProfiles.jsw';

let selectedCrew = null;
let loadedProfiles = [];

$w.onReady(async function () {
  setupHandlers();
  await loadCrewProfiles();
});

function el(id) {
  try {
    return $w(`#${id}`);
  } catch (err) {
    return null;
  }
}

function setupHandlers() {
  const refreshButton = el('crewRefreshButton');
  const statusFilter = el('crewStatusFilter');
  const table = el('crewProfilesTable');
  const saveButton = el('saveCrewButton');
  const approveButton = el('approveCrewButton');
  const suspendButton = el('suspendCrewButton');

  if (refreshButton && typeof refreshButton.onClick === 'function') refreshButton.onClick(loadCrewProfiles);
  if (statusFilter && typeof statusFilter.onChange === 'function') statusFilter.onChange(loadCrewProfiles);

  if (table && typeof table.onRowSelect === 'function') {
    table.onRowSelect((event) => {
      selectedCrew = event.rowData;
      fillEditor(selectedCrew);
      setMessage('Selected crew profile loaded.');
    });
  } else {
    setMessage('crewProfilesTable is not a Wix Table element. Add a real Table element and set its ID to crewProfilesTable.');
  }

  if (saveButton && typeof saveButton.onClick === 'function') saveButton.onClick(saveCrewProfile);
  if (approveButton && typeof approveButton.onClick === 'function') approveButton.onClick(() => quickStatusUpdate('approved', 'approved', true));
  if (suspendButton && typeof suspendButton.onClick === 'function') suspendButton.onClick(() => quickStatusUpdate('suspended', 'expired', false));
}

async function loadCrewProfiles() {
  try {
    setMessage('Loading crew profiles...');

    const filterElement = el('crewStatusFilter');
    const selectedStatus = filterElement?.value || 'all';
    const statusFilter = selectedStatus === 'all' ? '' : selectedStatus;

    const [counts, profiles] = await Promise.all([
      adminGetCrewProfileCounts(),
      adminListCrewProfiles(statusFilter)
    ]);

    loadedProfiles = profiles;

    const countsText = el('adminCrewCountsText');
    if (countsText) countsText.text = formatCounts(counts);

    const table = el('crewProfilesTable');
    if (table && 'columns' in table && 'rows' in table) {
      table.columns = [
        { id: 'fullName', dataPath: 'fullName', label: 'Name', type: 'string' },
        { id: 'loginEmail', dataPath: 'loginEmail', label: 'Email', type: 'string' },
        { id: 'baseAirport', dataPath: 'baseAirport', label: 'Base', type: 'string' },
        { id: 'crewStatus', dataPath: 'crewStatus', label: 'Crew Status', type: 'string' },
        { id: 'credentialStatus', dataPath: 'credentialStatus', label: 'Credentials', type: 'string' },
        { id: 'profileCompletionStatus', dataPath: 'profileCompletionStatus', label: 'Profile', type: 'string' },
        { id: 'activeText', dataPath: 'activeText', label: 'Active', type: 'string' },
        { id: 'updatedText', dataPath: 'updatedText', label: 'Updated', type: 'string' }
      ];

      table.rows = profiles.map((profile) => ({
        ...profile,
        activeText: profile.isActive === false ? 'No' : 'Yes',
        updatedText: profile.lastProfileUpdate ? new Date(profile.lastProfileUpdate).toLocaleString() : ''
      }));
    } else {
      setMessage('Loaded crew profiles, but crewProfilesTable is not a Wix Table element. Replace it with a real Table element.');
    }

    setMessage(`Loaded ${profiles.length} crew profiles.`);

    if (profiles.length === 1) {
      selectedCrew = profiles[0];
      fillEditor(selectedCrew);
      setMessage('Loaded 1 crew profile and selected it automatically.');
    }
  } catch (err) {
    console.error('Admin crew profiles load failed:', err);
    setMessage(`Admin crew profiles error: ${err.message || err}`);
    const countsText = el('adminCrewCountsText');
    if (countsText) countsText.text = 'Admin crew profiles error. Check CrewProfiles collection, admin permissions, and element IDs.';
  }
}

function formatCounts(counts) {
  return [
    `Total: ${counts.total}`,
    `Approved: ${counts.approved}`,
    `Pending Review: ${counts.pendingReview}`,
    `Admin Review: ${counts.adminReview}`,
    `Inactive: ${counts.inactive}`,
    `Credentials Approved: ${counts.credentialsApproved}`,
    `Credentials Pending: ${counts.credentialsPending}`,
    `Complete: ${counts.complete}`,
    `Incomplete: ${counts.incomplete}`
  ].join(' | ');
}

function fillEditor(profile) {
  if (!profile) return;

  const selectedText = el('selectedCrewText');
  if (selectedText) selectedText.text = `${profile.fullName || 'Crew Profile'} — ${profile.loginEmail || ''}`;

  setValue('editCrewName', profile.fullName || '');
  setValue('editCrewPhone', profile.phone || '');
  setValue('editCrewBaseAirport', profile.baseAirport || '');
  setValue('editCrewNearestAirport', profile.nearestMajorAirport || '');
  setValue('editCrewPreferredAircraft', profile.preferredAircraft || '');
  setValue('editCrewStatus', profile.crewStatus || 'pending_review');
  setValue('editCredentialStatus', profile.credentialStatus || 'not_submitted');
  setValue('editProfileCompletionStatus', profile.profileCompletionStatus || 'incomplete');
  setChecked('editCrewActive', profile.isActive !== false);
  setValue('editCrewNotes', profile.crewNotes || '');
}

function readEditor() {
  return {
    fullName: getValue('editCrewName'),
    phone: getValue('editCrewPhone'),
    baseAirport: getValue('editCrewBaseAirport'),
    nearestMajorAirport: getValue('editCrewNearestAirport'),
    preferredAircraft: getValue('editCrewPreferredAircraft'),
    crewStatus: getValue('editCrewStatus'),
    credentialStatus: getValue('editCredentialStatus'),
    profileCompletionStatus: getValue('editProfileCompletionStatus'),
    isActive: getChecked('editCrewActive'),
    crewNotes: getValue('editCrewNotes')
  };
}

async function saveCrewProfile() {
  if (!selectedCrew || !selectedCrew._id) {
    if (loadedProfiles.length === 1) {
      selectedCrew = loadedProfiles[0];
    } else {
      setMessage('Select a crew profile from the table first.');
      return;
    }
  }

  try {
    setMessage('Saving crew profile...');
    const saved = await adminUpdateCrewProfile(selectedCrew._id, readEditor());
    selectedCrew = saved;
    await loadCrewProfiles();
    fillEditor(saved);
    setMessage('Crew profile saved.');
  } catch (err) {
    console.error('Save crew profile failed:', err);
    setMessage(`Save failed: ${err.message || err}`);
  }
}

async function quickStatusUpdate(crewStatus, credentialStatus, active) {
  if (!selectedCrew || !selectedCrew._id) {
    if (loadedProfiles.length === 1) {
      selectedCrew = loadedProfiles[0];
    } else {
      setMessage('Select a crew profile from the table first.');
      return;
    }
  }

  try {
    setMessage('Updating crew profile status...');
    const saved = await adminUpdateCrewProfile(selectedCrew._id, {
      ...readEditor(),
      crewStatus,
      credentialStatus,
      profileCompletionStatus: crewStatus === 'approved' ? 'complete' : getValue('editProfileCompletionStatus'),
      isActive: active
    });

    selectedCrew = saved;
    await loadCrewProfiles();
    fillEditor(saved);
    setMessage(`Crew profile marked ${crewStatus}.`);
  } catch (err) {
    console.error('Crew status update failed:', err);
    setMessage(`Update failed: ${err.message || err}`);
  }
}

function setMessage(message) {
  const item = el('adminCrewMessage');
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
