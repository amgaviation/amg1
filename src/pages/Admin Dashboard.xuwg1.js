/**
 * Admin Dashboard.xuwg1.js — AMG Aviation Group
 * Admin portal dashboard: KPI counts, recent users table, quick actions.
 *
 * Element IDs (from handoff spec — immutable):
 *   #countsText      — KPI summary text
 *   #usersTable      — HTML embed for users table
 *   #statusFilter    — dropdown filter for approval status
 *   #searchInput     — search input
 *   #pendingCount    — KPI number: pending users
 *   #approvedCount   — KPI number: approved users
 *   #deniedCount     — KPI number: denied users
 *   #totalCount      — KPI number: total users
 *   #crewCount       — KPI number: crew profiles
 *   #clientCount     — KPI number: client profiles
 */

import wixLocation from 'wix-location';
import {
  adminGetPortalCounts,
  adminListPortalUsers,
  adminUpdatePortalUser,
} from 'backend/portalAuth.jsw';
import {
  adminGetCrewProfileCounts,
} from 'backend/crewProfiles.jsw';
import {
  adminGetClientProfileCounts,
} from 'backend/clientProfiles.jsw';
import { buildTableHTML, formatDate, roleLabel } from 'public/Site.js';

let allUsers = [];
let filteredUsers = [];

$w.onReady(async function () {
  guardAdmin();
  initNavigation();
  await Promise.all([loadCounts(), loadUsers()]);
  initFilters();
});

// ── Guard: redirect non-admins ───────────────────────────────
function guardAdmin() {
  // The backend enforces this too; this is a UX shortcut
  // If backend call fails with FORBIDDEN, loadUsers will handle it
}

// ── Sidebar navigation ────────────────────────────────────────
function initNavigation() {
  const navMap = {
    '#navUsers':       '/admin-dashboard',
    '#navCrew':        '/admin-crew-profiles',
    '#navClients':     '/admin-clients',
    '#navAuditLog':    '/admin-audit-log',
  };

  Object.entries(navMap).forEach(([id, href]) => {
    try {
      $w(id).onClick(() => wixLocation.to(href));
      if (wixLocation.url.includes('admin-dashboard')) {
        if (id === '#navUsers') $w(id).style.borderLeftColor = '#1E6BFF';
      }
    } catch {}
  });

  // Public site link
  try { $w('#navPublicSite').onClick(() => wixLocation.to('/')); } catch {}
  try { $w('#navLogout').onClick(() => {
    import('wix-members').then(({ authentication }) => authentication.logout('/'));
  }); } catch {}
}

// ── Load KPI counts ──────────────────────────────────────────
async function loadCounts() {
  try {
    const [portalCounts, crewCounts, clientCounts] = await Promise.all([
      adminGetPortalCounts(),
      adminGetCrewProfileCounts(),
      adminGetClientProfileCounts(),
    ]);

    try { $w('#pendingCount').text  = String(portalCounts.pending  || 0); } catch {}
    try { $w('#approvedCount').text = String(portalCounts.approved || 0); } catch {}
    try { $w('#deniedCount').text   = String(portalCounts.denied   || 0); } catch {}
    try { $w('#totalCount').text    = String(portalCounts.total    || 0); } catch {}
    try { $w('#crewCount').text     = String(crewCounts.total      || 0); } catch {}
    try { $w('#clientCount').text   = String(clientCounts.total    || 0); } catch {}

    // Summary text
    const summary = `${portalCounts.pending || 0} pending review — ${portalCounts.total || 0} total members`;
    try { $w('#countsText').text = summary; } catch {}

  } catch (e) {
    if (e.message === 'FORBIDDEN') {
      wixLocation.to('/access-denied');
    }
    console.error('loadCounts error:', e);
  }
}

// ── Load users table ─────────────────────────────────────────
async function loadUsers(filter = 'all') {
  setTableLoading(true);
  try {
    const { items } = await adminListPortalUsers(filter);
    allUsers = items;
    filteredUsers = items;
    renderTable(items);
  } catch (e) {
    if (e.message === 'FORBIDDEN') {
      wixLocation.to('/access-denied');
      return;
    }
    console.error('loadUsers error:', e);
  } finally {
    setTableLoading(false);
  }
}

function renderTable(users) {
  const headers = ['Name', 'Email', 'Role', 'Status', 'Joined'];
  const rows = users.map(u => [
    u.displayName || '—',
    u.loginEmail  || '—',
    roleLabel(u.role),
    `<span class="amg-status amg-status--${u.approvalStatus}">${cap(u.approvalStatus || '')}</span>`,
    formatDate(u.createdDate),
  ]);

  const html = buildTableHTML(headers, rows, {
    actions: [
      { label: 'Edit',    class: 'amg-btn--ghost',   dataKey: 'edit'    },
      { label: 'Approve', class: 'amg-btn--success',  dataKey: 'approve' },
      { label: 'Deny',    class: 'amg-btn--danger',   dataKey: 'deny'    },
    ]
  });

  try {
    $w('#usersTable').src = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  } catch {}

  // Listen for table action messages
  try {
    $w('#usersTable').onMessage(async e => {
      if (e.data?.type !== 'tableAction') return;
      const user = filteredUsers[e.data.row];
      if (!user) return;

      switch (e.data.action) {
        case 'approve':
          await handleStatusChange(user._id, 'approved');
          break;
        case 'deny':
          await handleStatusChange(user._id, 'denied');
          break;
        case 'edit':
          openEditModal(user);
          break;
      }
    });
  } catch {}
}

async function handleStatusChange(userId, newStatus) {
  try {
    await adminUpdatePortalUser(userId, { approvalStatus: newStatus });
    await Promise.all([loadCounts(), loadUsers(currentFilter())]);
  } catch (e) {
    console.error('Status change error:', e);
  }
}

function currentFilter() {
  try { return $w('#statusFilter').value || 'all'; } catch { return 'all'; }
}

function openEditModal(user) {
  // Populate modal fields
  try { $w('#modalUserId').text        = user._id; } catch {}
  try { $w('#modalUserName').value     = user.displayName || ''; } catch {}
  try { $w('#modalUserRole').value     = user.role || ''; } catch {}
  try { $w('#modalUserStatus').value   = user.approvalStatus || ''; } catch {}
  try { $w('#modalUserNotes').value    = user.notes || ''; } catch {}
  try { $w('#editUserModal').show('fade', { duration: 250 }); } catch {}

  // Save handler
  try {
    $w('#btnSaveUser').onClick(async () => {
      const update = {
        displayName:    safeVal('#modalUserName'),
        role:           safeVal('#modalUserRole'),
        approvalStatus: safeVal('#modalUserStatus'),
        notes:          safeVal('#modalUserNotes'),
      };
      try {
        await adminUpdatePortalUser(user._id, update);
        closeModal();
        await Promise.all([loadCounts(), loadUsers(currentFilter())]);
      } catch (e) {
        console.error('Save user error:', e);
      }
    });
  } catch {}

  try { $w('#btnCancelUser').onClick(closeModal); } catch {}
}

function closeModal() {
  try { $w('#editUserModal').hide('fade', { duration: 200 }); } catch {}
}

// ── Filters ──────────────────────────────────────────────────
function initFilters() {
  // Status dropdown
  try {
    $w('#statusFilter').onChange(async () => {
      await loadUsers($w('#statusFilter').value);
    });
  } catch {}

  // Search box
  try {
    $w('#searchInput').onInput(e => {
      const q = (e.target.value || '').toLowerCase();
      filteredUsers = allUsers.filter(u =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.loginEmail  || '').toLowerCase().includes(q)
      );
      renderTable(filteredUsers);
    });
  } catch {}

  // Refresh button
  try {
    $w('#btnRefresh').onClick(async () => {
      await Promise.all([loadCounts(), loadUsers(currentFilter())]);
    });
  } catch {}
}

// ── Helpers ──────────────────────────────────────────────────
function setTableLoading(on) {
  try { $w('#tableLoader')[on ? 'show' : 'hide'](); } catch {}
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function safeVal(id) {
  try { return ($w(id).value || '').trim(); } catch { return ''; }
// Page code for /admin-dashboard
// Required IDs for full functionality:
// countsText, usersTable, statusFilter, refreshButton,
// selectedUserText, editName, editPhone, editCompany, editAirport,
// editRole, editStatus, editActive, editNotes,
// saveUserButton, approveUserButton, denyUserButton, adminMessage

import {
  adminListPortalUsers,
  adminGetPortalCounts,
  adminUpdatePortalUser
} from 'backend/portalAuth.jsw';

let selectedUser = null;
let loadedUsers = [];

$w.onReady(async function () {
  setupHandlers();
  await loadUsers();
});

function el(id) {
  try {
    return $w(`#${id}`);
  } catch (err) {
    return null;
  }
}

function setupHandlers() {
  const refreshButton = el('refreshButton');
  const statusFilter = el('statusFilter');
  const usersTable = el('usersTable');
  const saveUserButton = el('saveUserButton');
  const approveUserButton = el('approveUserButton');
  const denyUserButton = el('denyUserButton');

  if (refreshButton && typeof refreshButton.onClick === 'function') refreshButton.onClick(loadUsers);
  if (statusFilter && typeof statusFilter.onChange === 'function') statusFilter.onChange(loadUsers);

  if (usersTable && typeof usersTable.onRowSelect === 'function') {
    usersTable.onRowSelect((event) => {
      selectedUser = event.rowData;
      fillEditor(selectedUser);
      setMessage('Selected user loaded.');
    });
  } else {
    setMessage('usersTable is not a Wix Table element. Add a real Table element and set its ID to usersTable.');
  }

  if (saveUserButton && typeof saveUserButton.onClick === 'function') saveUserButton.onClick(saveUser);
  if (approveUserButton && typeof approveUserButton.onClick === 'function') approveUserButton.onClick(() => updateStatus('approved', true));
  if (denyUserButton && typeof denyUserButton.onClick === 'function') denyUserButton.onClick(() => updateStatus('denied', false));
}

async function loadUsers() {
  try {
    setMessage('Loading users...');

    const statusFilterElement = el('statusFilter');
    const selectedStatus = statusFilterElement?.value || 'all';
    const statusFilter = selectedStatus === 'all' ? '' : selectedStatus;

    const [counts, users] = await Promise.all([
      adminGetPortalCounts(),
      adminListPortalUsers(statusFilter)
    ]);

    loadedUsers = users;

    const countsText = el('countsText');
    if (countsText) countsText.text = formatCounts(counts);

    const usersTable = el('usersTable');
    if (usersTable && 'columns' in usersTable && 'rows' in usersTable) {
      usersTable.columns = [
        { id: 'fullName', dataPath: 'fullName', label: 'Name', type: 'string' },
        { id: 'loginEmail', dataPath: 'loginEmail', label: 'Email', type: 'string' },
        { id: 'role', dataPath: 'role', label: 'Role', type: 'string' },
        { id: 'approvalStatus', dataPath: 'approvalStatus', label: 'Status', type: 'string' },
        { id: 'activeText', dataPath: 'activeText', label: 'Active', type: 'string' },
        { id: 'lastLoginText', dataPath: 'lastLoginText', label: 'Last Login', type: 'string' }
      ];

      usersTable.rows = users.map((user, index) => ({
        ...user,
        rowNumber: index + 1,
        activeText: user.isActive === false ? 'No' : 'Yes',
        lastLoginText: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : ''
      }));
    } else {
      setMessage('Loaded users, but usersTable is not a Wix Table element. Replace it with a real Table element.');
    }

    setMessage(`Loaded ${users.length} user records.`);

    if (users.length === 1) {
      selectedUser = users[0];
      fillEditor(selectedUser);
      setMessage('Loaded 1 user and selected it automatically.');
    }
  } catch (err) {
    console.error('Admin dashboard load failed:', err);
    setMessage(`Admin dashboard error: ${err.message || err}`);
    const countsText = el('countsText');
    if (countsText) countsText.text = 'Admin dashboard error. Check CMS collections, admin row, and element IDs.';
  }
}

function formatCounts(counts) {
  return [
    `Total: ${counts.total}`,
    `Pending: ${counts.pending}`,
    `Approved: ${counts.approved}`,
    `Denied: ${counts.denied}`,
    `Suspended: ${counts.suspended}`,
    `Admins: ${counts.admins}`,
    `Crew: ${counts.crew}`,
    `Clients: ${counts.clients}`,
    `Partners: ${counts.partners}`
  ].join(' | ');
}

function fillEditor(user) {
  if (!user) return;

  const selectedUserText = el('selectedUserText');
  if (selectedUserText) selectedUserText.text = `${user.fullName || 'Portal User'} — ${user.loginEmail}`;

  setValue('editName', user.fullName || '');
  setValue('editPhone', user.phone || '');
  setValue('editCompany', user.companyName || '');
  setValue('editAirport', user.homeAirport || '');
  setValue('editRole', user.role || 'crew_pilot');
  setValue('editStatus', user.approvalStatus || 'pending');
  setChecked('editActive', user.isActive !== false);
  setValue('editNotes', user.portalNotes || '');
}

function readEditor() {
  return {
    fullName: getValue('editName'),
    phone: getValue('editPhone'),
    companyName: getValue('editCompany'),
    homeAirport: getValue('editAirport'),
    role: getValue('editRole'),
    approvalStatus: getValue('editStatus'),
    isActive: getChecked('editActive'),
    portalNotes: getValue('editNotes')
  };
}

async function saveUser() {
  if (!selectedUser || !selectedUser._id) {
    if (loadedUsers.length === 1) {
      selectedUser = loadedUsers[0];
    } else {
      setMessage('Select a user from the table first.');
      return;
    }
  }

  try {
    setMessage('Saving user...');
    const saved = await adminUpdatePortalUser(selectedUser._id, readEditor());
    selectedUser = saved;
    await loadUsers();
    fillEditor(saved);
    setMessage('User saved.');
  } catch (err) {
    console.error('Save user failed:', err);
    setMessage(`Save failed: ${err.message || err}`);
  }
}

async function updateStatus(status, active) {
  if (!selectedUser || !selectedUser._id) {
    if (loadedUsers.length === 1) {
      selectedUser = loadedUsers[0];
    } else {
      setMessage('Select a user from the table first.');
      return;
    }
  }

  try {
    setMessage('Updating user...');
    const role = getValue('editRole') || 'crew_pilot';
    const saved = await adminUpdatePortalUser(selectedUser._id, {
      role,
      approvalStatus: status,
      isActive: active
    });

    selectedUser = saved;
    await loadUsers();
    fillEditor(saved);
    setMessage(`User marked ${status}.`);
  } catch (err) {
    console.error('Status update failed:', err);
    setMessage(`Update failed: ${err.message || err}`);
  }
}

function setMessage(message) {
  const adminMessage = el('adminMessage');
  if (adminMessage) adminMessage.text = message;
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
