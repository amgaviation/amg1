/**
 * Admin Clients.yc1i7.js — AMG Aviation Group
 * Admin portal: review, approve, and manage client/operator profiles.
 *
 * Element IDs (from handoff spec — immutable):
 *   #clientsTable    — HTML embed for clients table
 *   #statusFilter    — dropdown filter
 *   #searchInput     — search input
 *   #pendingCount    — KPI: pending
 *   #approvedCount   — KPI: approved
 *   #totalCount      — KPI: total
 */

import wixLocation from 'wix-location';
import {
  adminListClientProfiles,
  adminGetClientProfileCounts,
  adminUpdateClientProfile,
} from 'backend/clientProfiles.jsw';
import { buildTableHTML, formatDate, roleLabel } from 'public/Site.js';

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
      if (id === '#navClients') $w(id).style.borderLeftColor = '#1E6BFF';
    } catch {}
  });
  try { $w('#navPublicSite').onClick(() => wixLocation.to('/')); } catch {}
}

async function loadCounts() {
  try {
    const counts = await adminGetClientProfileCounts();
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
    const { items } = await adminListClientProfiles(filter);
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
  const headers = ['Name', 'Company', 'Email', 'Tier', 'Joined', 'Status'];
  const rows = profiles.map(p => [
    p.displayName        || '—',
    p.company            || '—',
    p.loginEmail         || '—',
    p.membershipTier     || '—',
    formatDate(p.createdDate),
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
    $w('#clientsTable').src = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  } catch {}

  try {
    $w('#clientsTable').onMessage(async e => {
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
    await adminUpdateClientProfile(profileId, { approvalStatus: newStatus });
    await Promise.all([loadCounts(), loadProfiles(currentFilter())]);
  } catch (e) {
    console.error('Status change error:', e);
  }
}

function openDetailModal(profile) {
  const fields = [
    ['#modalClientName',    profile.displayName       || ''],
    ['#modalClientEmail',   profile.loginEmail         || ''],
    ['#modalClientCompany', profile.company            || ''],
    ['#modalClientTitle',   profile.title              || ''],
    ['#modalClientPhone',   profile.phone              || ''],
    ['#modalClientCity',    profile.city               || ''],
    ['#modalClientTier',    profile.membershipTier     || ''],
    ['#modalClientPurpose', profile.flightPurpose      || ''],
    ['#modalClientHours',   profile.annualFlightHours  ? `${profile.annualFlightHours} hrs/yr` : '—'],
    ['#modalClientBilling', profile.billingEmail        || ''],
  ];

  fields.forEach(([id, val]) => { try { $w(id).text = val; } catch {} });

  try { $w('#modalClientNotes').value   = profile.adminNotes   || ''; } catch {}
  try { $w('#modalClientStatus').value  = profile.approvalStatus || ''; } catch {}
  try { $w('#clientDetailModal').show('fade', { duration: 250 }); } catch {}

  try {
    $w('#btnSaveClient').onClick(async () => {
      const update = {
        adminNotes:     safeVal('#modalClientNotes'),
        approvalStatus: safeVal('#modalClientStatus'),
      };
      await adminUpdateClientProfile(profile._id, update);
      closeModal();
      await Promise.all([loadCounts(), loadProfiles(currentFilter())]);
    });
  } catch {}

  try { $w('#btnCloseClient').onClick(closeModal); } catch {}
}

function closeModal() {
  try { $w('#clientDetailModal').hide('fade', { duration: 200 }); } catch {}
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
        (p.loginEmail  || '').toLowerCase().includes(q) ||
        (p.company     || '').toLowerCase().includes(q)
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
