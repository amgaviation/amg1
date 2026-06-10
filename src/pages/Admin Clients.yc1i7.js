// Page code for /admin-clients
// Required IDs for full functionality:
// adminClientCountsText, adminClientMessage, clientProfilesTable,
// clientStatusFilter, clientRefreshButton,
// selectedClientText, editClientName, editClientPhone, editClientCompany,
// editClientStatus, editClientApprovalStatus, editClientType, editClientActive,
// editClientHomeAirport, editClientPreferredAirport, editClientAircraftOwned,
// editClientTailNumbers, editClientBillingPreference, editClientBillingContactName,
// editClientBillingEmail, editClientBillingPhone, editClientAuthorizedRequesters,
// editClientServicePreferences, editClientOwnerNotes, editClientSubscriptionStatus,
// editClientPreferredPlan, editClientDefaultAircraftCategory,
// saveClientButton, approveClientButton, suspendClientButton
// Optional count-card value IDs:
// clientCountTotal, clientCountApproved, clientCountPendingReview,
// clientCountAdminReview, clientCountSubscriptionActive, clientCountInactive

import {
  adminListClientProfiles,
  adminGetClientProfileCounts,
  adminUpdateClientProfile
} from 'backend/clientProfiles.jsw';

let selectedClient = null;
let loadedProfiles = [];

$w.onReady(async function () {
  setupHandlers();
  await loadClientProfiles();
});

function el(id) {
  try {
    return $w(`#${id}`);
  } catch (err) {
    return null;
  }
}

function setupHandlers() {
  const refreshButton = el('clientRefreshButton');
  const statusFilter = el('clientStatusFilter');
  const table = el('clientProfilesTable');
  const saveButton = el('saveClientButton');
  const approveButton = el('approveClientButton');
  const suspendButton = el('suspendClientButton');

  if (refreshButton && typeof refreshButton.onClick === 'function') refreshButton.onClick(loadClientProfiles);
  if (statusFilter && typeof statusFilter.onChange === 'function') statusFilter.onChange(loadClientProfiles);

  if (table && typeof table.onRowSelect === 'function') {
    table.onRowSelect((event) => {
      selectedClient = event.rowData;
      fillEditor(selectedClient);
      setMessage('Selected client profile loaded.');
    });
  } else {
    setMessage('clientProfilesTable is not a Wix Table element. Add a real Table element and set its ID to clientProfilesTable.');
  }

  if (saveButton && typeof saveButton.onClick === 'function') saveButton.onClick(saveClientProfile);
  if (approveButton && typeof approveButton.onClick === 'function') approveButton.onClick(() => quickStatusUpdate('approved', 'approved', true));
  if (suspendButton && typeof suspendButton.onClick === 'function') suspendButton.onClick(() => quickStatusUpdate('suspended', 'suspended', false));
}

async function loadClientProfiles() {
  try {
    setMessage('Loading client profiles...');

    const filterElement = el('clientStatusFilter');
    const selectedStatus = filterElement?.value || 'all';
    const statusFilter = selectedStatus === 'all' ? '' : selectedStatus;

    const [counts, profiles] = await Promise.all([
      adminGetClientProfileCounts(),
      adminListClientProfiles(statusFilter)
    ]);

    loadedProfiles = profiles;

    const countsText = el('adminClientCountsText');
    if (countsText) countsText.text = formatCounts(counts);
    setCountCards(counts);

    const table = el('clientProfilesTable');
    if (table && 'columns' in table && 'rows' in table) {
      table.columns = [
        { id: 'fullName', dataPath: 'fullName', label: 'Name', type: 'string' },
        { id: 'companyName', dataPath: 'companyName', label: 'Company', type: 'string' },
        { id: 'loginEmail', dataPath: 'loginEmail', label: 'Email', type: 'string' },
        { id: 'homeAirport', dataPath: 'homeAirport', label: 'Home', type: 'string' },
        { id: 'tailNumbers', dataPath: 'tailNumbers', label: 'Tail(s)', type: 'string' },
        { id: 'clientStatus', dataPath: 'clientStatus', label: 'Client Status', type: 'string' },
        { id: 'subscriptionStatus', dataPath: 'subscriptionStatus', label: 'Subscription', type: 'string' },
        { id: 'activeText', dataPath: 'activeText', label: 'Active', type: 'string' },
        { id: 'updatedText', dataPath: 'updatedText', label: 'Updated', type: 'string' }
      ];

      table.rows = profiles.map((profile) => ({
        ...profile,
        activeText: profile.isActive === false ? 'No' : 'Yes',
        updatedText: profile.lastProfileUpdate ? new Date(profile.lastProfileUpdate).toLocaleString() : ''
      }));
    } else {
      setMessage('Loaded client profiles, but clientProfilesTable is not a Wix Table element. Replace it with a real Table element.');
    }

    setMessage(`Loaded ${profiles.length} client profiles.`);

    if (profiles.length === 1) {
      selectedClient = profiles[0];
      fillEditor(selectedClient);
      setMessage('Loaded 1 client profile and selected it automatically.');
    }
  } catch (err) {
    console.error('Admin clients load failed:', err);
    setMessage(`Admin clients error: ${err.message || err}`);
    const countsText = el('adminClientCountsText');
    if (countsText) countsText.text = 'Admin clients error. Check ClientProfiles collection, admin permissions, and element IDs.';
  }
}

function formatCounts(counts) {
  return [
    `Total: ${counts.total}`,
    `Approved: ${counts.approved}`,
    `Pending Review: ${counts.pendingReview}`,
    `Admin Review: ${counts.adminReview}`,
    `Inactive: ${counts.inactive}`,
    `Suspended: ${counts.suspended}`,
    `Subscription Active: ${counts.subscriptionActive}`,
    `Subscription None: ${counts.subscriptionNone}`
  ].join(' | ');
}

function setCountCards(counts) {
  setText('clientCountTotal', String(counts.total ?? 0));
  setText('clientCountApproved', String(counts.approved ?? 0));
  setText('clientCountPendingReview', String(counts.pendingReview ?? 0));
  setText('clientCountAdminReview', String(counts.adminReview ?? 0));
  setText('clientCountSubscriptionActive', String(counts.subscriptionActive ?? 0));
  setText('clientCountInactive', String(counts.inactive ?? 0));
}

function fillEditor(profile) {
  if (!profile) return;

  const selectedText = el('selectedClientText');
  if (selectedText) selectedText.text = `${profile.fullName || 'Client Profile'} — ${profile.loginEmail || ''}`;

  setValue('editClientName', profile.fullName || '');
  setValue('editClientPhone', profile.phone || '');
  setValue('editClientCompany', profile.companyName || '');
  setValue('editClientStatus', profile.clientStatus || 'pending_review');
  setValue('editClientApprovalStatus', profile.approvalStatus || 'pending');
  setValue('editClientType', profile.clientType || 'owner');
  setChecked('editClientActive', profile.isActive !== false);
  setValue('editClientHomeAirport', profile.homeAirport || '');
  setValue('editClientPreferredAirport', profile.preferredAirport || '');
  setValue('editClientAircraftOwned', profile.aircraftOwned || '');
  setValue('editClientTailNumbers', profile.tailNumbers || '');
  setValue('editClientBillingPreference', profile.billingPreference || 'invoice');
  setValue('editClientBillingContactName', profile.billingContactName || '');
  setValue('editClientBillingEmail', profile.billingEmail || '');
  setValue('editClientBillingPhone', profile.billingPhone || '');
  setValue('editClientAuthorizedRequesters', profile.authorizedRequesters || '');
  setValue('editClientServicePreferences', profile.servicePreferences || '');
  setValue('editClientOwnerNotes', profile.ownerNotes || '');
  setValue('editClientSubscriptionStatus', profile.subscriptionStatus || 'none');
  setValue('editClientPreferredPlan', profile.preferredPlan || 'none');
  setValue('editClientDefaultAircraftCategory', profile.defaultAircraftCategory || '');
}

function readEditor() {
  return {
    fullName: getValue('editClientName'),
    phone: getValue('editClientPhone'),
    companyName: getValue('editClientCompany'),
    clientStatus: getValue('editClientStatus'),
    approvalStatus: getValue('editClientApprovalStatus'),
    clientType: getValue('editClientType'),
    isActive: getChecked('editClientActive'),
    homeAirport: getValue('editClientHomeAirport'),
    preferredAirport: getValue('editClientPreferredAirport'),
    aircraftOwned: getValue('editClientAircraftOwned'),
    tailNumbers: getValue('editClientTailNumbers'),
    billingPreference: getValue('editClientBillingPreference'),
    billingContactName: getValue('editClientBillingContactName'),
    billingEmail: getValue('editClientBillingEmail'),
    billingPhone: getValue('editClientBillingPhone'),
    authorizedRequesters: getValue('editClientAuthorizedRequesters'),
    servicePreferences: getValue('editClientServicePreferences'),
    ownerNotes: getValue('editClientOwnerNotes'),
    subscriptionStatus: getValue('editClientSubscriptionStatus'),
    preferredPlan: getValue('editClientPreferredPlan'),
    defaultAircraftCategory: getValue('editClientDefaultAircraftCategory')
  };
}

async function saveClientProfile() {
  if (!selectedClient || !selectedClient._id) {
    if (loadedProfiles.length === 1) {
      selectedClient = loadedProfiles[0];
    } else {
      setMessage('Select a client profile from the table first.');
      return;
    }
  }

  try {
    setMessage('Saving client profile...');
    const saved = await adminUpdateClientProfile(selectedClient._id, readEditor());
    selectedClient = saved;
    await loadClientProfiles();
    fillEditor(saved);
    setMessage('Client profile saved.');
  } catch (err) {
    console.error('Save client profile failed:', err);
    setMessage(`Save failed: ${err.message || err}`);
  }
}

async function quickStatusUpdate(clientStatus, approvalStatus, active) {
  if (!selectedClient || !selectedClient._id) {
    if (loadedProfiles.length === 1) {
      selectedClient = loadedProfiles[0];
    } else {
      setMessage('Select a client profile from the table first.');
      return;
    }
  }

  try {
    setMessage('Updating client profile status...');
    const saved = await adminUpdateClientProfile(selectedClient._id, {
      ...readEditor(),
      clientStatus,
      approvalStatus,
      isActive: active
    });

    selectedClient = saved;
    await loadClientProfiles();
    fillEditor(saved);
    setMessage(`Client profile marked ${clientStatus}.`);
  } catch (err) {
    console.error('Client status update failed:', err);
    setMessage(`Update failed: ${err.message || err}`);
  }
}

function setMessage(message) {
  const item = el('adminClientMessage');
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
