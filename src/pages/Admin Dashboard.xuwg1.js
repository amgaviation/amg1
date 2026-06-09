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
