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
}
