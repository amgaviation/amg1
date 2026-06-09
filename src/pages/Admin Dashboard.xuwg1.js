// Page code for /admin-dashboard
// Requires element IDs: countsText, usersTable, statusFilter, refreshButton, selectedUserText, editName, editPhone, editCompany, editAirport, editRole, editStatus, editActive, editNotes, saveUserButton, approveUserButton, denyUserButton, adminMessage

import wixLocation from 'wix-location';
import { adminListPortalUsers, adminGetPortalCounts, adminUpdatePortalUser } from 'backend/portalAuth.jsw';

let selectedUser = null;

$w.onReady(async function () {
  try {
    setupHandlers();
    await loadUsers();
  } catch (err) {
    console.error('Admin dashboard failed:', err);
    wixLocation.to('/access-denied');
  }
});

function setupHandlers() {
  $w('#refreshButton').onClick(loadUsers);
  $w('#statusFilter').onChange(loadUsers);
  $w('#usersTable').onRowSelect((event) => {
    selectedUser = event.rowData;
    fillEditor(selectedUser);
    setMessage('Selected user loaded.');
  });
  $w('#saveUserButton').onClick(saveUser);
  $w('#approveUserButton').onClick(() => updateStatus('approved', true));
  $w('#denyUserButton').onClick(() => updateStatus('denied', false));
}

async function loadUsers() {
  setMessage('Loading users...');
  const selectedStatus = $w('#statusFilter').value || 'all';
  const statusFilter = selectedStatus === 'all' ? '' : selectedStatus;
  const [counts, users] = await Promise.all([adminGetPortalCounts(), adminListPortalUsers(statusFilter)]);
  $w('#countsText').text = formatCounts(counts);
  $w('#usersTable').columns = [
    { id: 'fullName', dataPath: 'fullName', label: 'Name', type: 'string' },
    { id: 'loginEmail', dataPath: 'loginEmail', label: 'Email', type: 'string' },
    { id: 'role', dataPath: 'role', label: 'Role', type: 'string' },
    { id: 'approvalStatus', dataPath: 'approvalStatus', label: 'Status', type: 'string' },
    { id: 'activeText', dataPath: 'activeText', label: 'Active', type: 'string' },
    { id: 'lastLoginText', dataPath: 'lastLoginText', label: 'Last Login', type: 'string' }
  ];
  $w('#usersTable').rows = users.map((user) => ({
    ...user,
    activeText: user.isActive === false ? 'No' : 'Yes',
    lastLoginText: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : ''
  }));
  setMessage(`Loaded ${users.length} user records.`);
}

function formatCounts(counts) {
  return [`Total: ${counts.total}`, `Pending: ${counts.pending}`, `Approved: ${counts.approved}`, `Denied: ${counts.denied}`, `Suspended: ${counts.suspended}`, `Admins: ${counts.admins}`, `Crew: ${counts.crew}`, `Clients: ${counts.clients}`, `Partners: ${counts.partners}`].join(' | ');
}

function fillEditor(user) {
  $w('#selectedUserText').text = `${user.fullName || 'Portal User'} — ${user.loginEmail}`;
  $w('#editName').value = user.fullName || '';
  $w('#editPhone').value = user.phone || '';
  $w('#editCompany').value = user.companyName || '';
  $w('#editAirport').value = user.homeAirport || '';
  $w('#editRole').value = user.role || 'crew_pilot';
  $w('#editStatus').value = user.approvalStatus || 'pending';
  $w('#editActive').checked = user.isActive !== false;
  $w('#editNotes').value = user.portalNotes || '';
}

function readEditor() {
  return {
    fullName: $w('#editName').value,
    phone: $w('#editPhone').value,
    companyName: $w('#editCompany').value,
    homeAirport: $w('#editAirport').value,
    role: $w('#editRole').value,
    approvalStatus: $w('#editStatus').value,
    isActive: $w('#editActive').checked,
    portalNotes: $w('#editNotes').value
  };
}

async function saveUser() {
  if (!selectedUser || !selectedUser._id) {
    setMessage('Select a user from the table first.');
    return;
  }
  setMessage('Saving user...');
  const saved = await adminUpdatePortalUser(selectedUser._id, readEditor());
  selectedUser = saved;
  await loadUsers();
  fillEditor(saved);
  setMessage('User saved.');
}

async function updateStatus(status, active) {
  if (!selectedUser || !selectedUser._id) {
    setMessage('Select a user from the table first.');
    return;
  }
  setMessage('Updating user...');
  const role = $w('#editRole').value || 'crew_pilot';
  const saved = await adminUpdatePortalUser(selectedUser._id, { role, approvalStatus: status, isActive: active });
  selectedUser = saved;
  await loadUsers();
  fillEditor(saved);
  setMessage(`User marked ${status}.`);
}

function setMessage(message) {
  $w('#adminMessage').text = message;
}
