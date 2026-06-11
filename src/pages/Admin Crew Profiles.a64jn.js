/**
 * Admin Crew Profiles.a64jn.js — AMG Aviation Group
 * Admin portal: review, approve, and manage crew/pilot profiles.
 *
 * Element IDs (from handoff spec — immutable):
 *   #crewTable       — HTML embed for crew profiles table
 *   #statusFilter    — dropdown filter
 *   #searchInput     — search input
 *   #pendingCount    — KPI: pending profiles
 *   #approvedCount   — KPI: approved profiles
 *   #totalCount      — KPI: total profiles
 */

import wixLocation from 'wix-location';
import {
  adminListCrewProfiles,
  adminGetCrewProfileCounts,
  adminUpdateCrewProfile,
} from 'backend/crewProfiles.jsw';
import { buildTableHTML, formatDate, formatHours } from 'public/Site.js';

let allProfiles = [];
let filteredProfiles = [];

$w.onReady(async function () {
  initNavigation();
  await Promise.all([loadCounts(), loadProfiles()]);
  initFilters();
});

function initNavigation() {
  const navMap = {
    '#navUsers':    '/admin-dashboard',
    '#navCrew':     '/admin-crew-profiles',
    '#navClients':  '/admin-clients',
  };
  Object.entries(navMap).forEach(([id, href]) => {
    try {
      $w(id).onClick(() => wixLocation.to(href));
      if (id === '#navCrew') $w(id).style.borderLeftColor = '#1E6BFF';
    } catch {}
  });
  try { $w('#navPublicSite').onClick(() => wixLocation.to('/')); } catch {}
}

async function loadCounts() {
  try {
    const counts = await adminGetCrewProfileCounts();
    try { $w('#pendingCount').text  = String(counts.pending  || 0); } catch {}
    try { $w('#approvedCount').text = String(counts.approved || 0); } catch {}
    try { $w('#totalCount').text    = String(counts.total    || 0); } catch {}
  } catch (e) {
    if (e.message === 'FORBIDDEN') { wixLocation.to('/access-denied'); }
  }
}

async function loadProfiles(filter = 'all') {
  setLoading(true);
  try {
    const { items } = await adminListCrewProfiles(filter);
    allProfiles = items;
    filteredProfiles = items;
    renderTable(items);
  } catch (e) {
    if (e.message === 'FORBIDDEN') { wixLocation.to('/access-denied'); }
    console.error('loadProfiles error:', e);
  } finally {
    setLoading(false);
  }
}

function renderTable(profiles) {
  const headers = ['Name', 'Email', 'Title', 'Total Hours', 'Medical Class', 'Status'];
  const rows = profiles.map(p => [
    p.displayName || '—',
    p.loginEmail  || '—',
    p.title       || '—',
    formatHours(p.totalHours),
    p.medicalClass || '—',
    `<span class="amg-status amg-status--${p.approvalStatus}">${cap(p.approvalStatus || '')}</span>`,
  ]);

  const html = buildTableHTML(headers, rows, {
    actions: [
      { label: 'Review',  class: 'amg-btn--ghost',   dataKey: 'review'  },
      { label: 'Approve', class: 'amg-btn--success',  dataKey: 'approve' },
      { label: 'Deny',    class: 'amg-btn--danger',   dataKey: 'deny'    },
    ]
  });

  try {
    $w('#crewTable').src = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  } catch {}

  try {
    $w('#crewTable').onMessage(async e => {
      if (e.data?.type !== 'tableAction') return;
      const profile = filteredProfiles[e.data.row];
      if (!profile) return;

      switch (e.data.action) {
        case 'approve':
          await handleStatusChange(profile._id, 'approved');
          break;
        case 'deny':
          await handleStatusChange(profile._id, 'denied');
          break;
        case 'review':
          openDetailModal(profile);
          break;
      }
    });
  } catch {}
}

async function handleStatusChange(profileId, newStatus) {
  try {
    await adminUpdateCrewProfile(profileId, { approvalStatus: newStatus });
    await Promise.all([loadCounts(), loadProfiles(currentFilter())]);
  } catch (e) {
    console.error('Status change error:', e);
  }
}

function openDetailModal(profile) {
  const fields = [
    ['#modalCrewName',     profile.displayName   || ''],
    ['#modalCrewEmail',    profile.loginEmail     || ''],
    ['#modalCrewTitle',    profile.title          || ''],
    ['#modalCrewHours',    formatHours(profile.totalHours)],
    ['#modalCrewPIC',      formatHours(profile.pic)],
    ['#modalCrewSIC',      formatHours(profile.sic)],
    ['#modalCrewSim',      formatHours(profile.simulatorHours)],
    ['#modalCrewMedical',  profile.medicalClass   || ''],
    ['#modalCrewExpiry',   formatDate(profile.medicalExpiry)],
    ['#modalCrewCerts',    (profile.certifications || []).join(', ') || ''],
    ['#modalCrewBio',      profile.bio            || ''],
  ];

  fields.forEach(([id, val]) => { try { $w(id).text = val; } catch {} });

  try { $w('#modalCrewNotes').value   = profile.adminNotes || ''; } catch {}
  try { $w('#modalCrewStatus').value  = profile.approvalStatus || ''; } catch {}
  try { $w('#crewDetailModal').show('fade', { duration: 250 }); } catch {}

  try {
    $w('#btnSaveCrew').onClick(async () => {
      const update = {
        adminNotes:     safeVal('#modalCrewNotes'),
        approvalStatus: safeVal('#modalCrewStatus'),
      };
      await adminUpdateCrewProfile(profile._id, update);
      closeModal();
      await Promise.all([loadCounts(), loadProfiles(currentFilter())]);
    });
  } catch {}

  try { $w('#btnCloseCrew').onClick(closeModal); } catch {}
}

function closeModal() {
  try { $w('#crewDetailModal').hide('fade', { duration: 200 }); } catch {}
}

function initFilters() {
  try {
    $w('#statusFilter').onChange(async () => {
      await loadProfiles($w('#statusFilter').value);
    });
  } catch {}

  try {
    $w('#searchInput').onInput(e => {
      const q = (e.target.value || '').toLowerCase();
      filteredProfiles = allProfiles.filter(p =>
        (p.displayName || '').toLowerCase().includes(q) ||
        (p.loginEmail  || '').toLowerCase().includes(q)
      );
      renderTable(filteredProfiles);
    });
  } catch {}

  try {
    $w('#btnRefresh').onClick(async () => {
      await Promise.all([loadCounts(), loadProfiles(currentFilter())]);
    });
  } catch {}
}

function setLoading(on) {
  try { $w('#tableLoader')[on ? 'show' : 'hide'](); } catch {}
}

function currentFilter() {
  try { return $w('#statusFilter').value || 'all'; } catch { return 'all'; }
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function safeVal(id) {
  try { return ($w(id).value || '').trim(); } catch { return ''; }
// Page code for /admin-crew-profiles
// Required IDs for full functionality:
// adminCrewCountsText, adminCrewMessage, crewProfilesTable,
// crewStatusFilter, crewRefreshButton,
// selectedCrewText, editCrewName, editCrewPhone, editCrewBaseAirport,
// editCrewNearestAirport, editCrewPreferredAircraft, editCrewStatus,
// editCredentialStatus, editProfileCompletionStatus, editCrewActive,
// editCrewNotes, saveCrewButton, approveCrewButton, suspendCrewButton
// Optional count-card value IDs:
// crewCountTotal, crewCountApproved, crewCountPendingReview,
// crewCountCredentialsPending, crewCountIncomplete, crewCountInactive

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
    setCountCards(counts);

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

function setCountCards(counts) {
  setText('crewCountTotal', String(counts.total ?? 0));
  setText('crewCountApproved', String(counts.approved ?? 0));
  setText('crewCountPendingReview', String(counts.pendingReview ?? 0));
  setText('crewCountCredentialsPending', String(counts.credentialsPending ?? 0));
  setText('crewCountIncomplete', String(counts.incomplete ?? 0));
  setText('crewCountInactive', String(counts.inactive ?? 0));
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

function setText(id, value) {
  const item = el(id);
  if (item) item.text = value;
}

function getChecked(id) {
  const item = el(id);
  return item ? item.checked : false;
}

function setChecked(id, value) {
  const item = el(id);
  if (item) item.checked = value;
}
