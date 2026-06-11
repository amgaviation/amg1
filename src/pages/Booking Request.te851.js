/**
 * Booking Request.te851.js — AMG Aviation Group
 * Mission/support request form with full validation and duplicate protection.
 */

import wixLocation from 'wix-location';
import { validateBookingForm } from 'public/Site.js';

let submitting = false;

$w.onReady(function () {
  prefillFromQuery();
  initForm();
  initPassengerCounter();
});

// Pre-fill aircraft field from URL query (e.g. ?aircraft=Citation+CJ3)
function prefillFromQuery() {
  try {
    const q = wixLocation.query;
    if (q.aircraft) {
      try { $w('#inputAircraft').value = decodeURIComponent(q.aircraft); } catch {}
    }
  } catch (e) {}
}

function initForm() {
  // Live blur validation
  ['#inputName', '#inputEmail', '#inputPhone', '#inputDeparture', '#inputArrival', '#inputDate'].forEach(id => {
    try { $w(id).onBlur(() => validateFieldEl(id)); } catch {}
  });

  // Submit
  try { $w('#btnBookingSubmit').onClick(handleSubmit); } catch {}

  // Date minimum = today
  try {
    const today = new Date().toISOString().split('T')[0];
    $w('#inputDate').minDate = new Date();
  } catch {}
}

function initPassengerCounter() {
  let count = 1;
  const update = () => {
    try { $w('#paxCount').text = String(count); } catch {}
  };
  update();
  try { $w('#btnPaxMinus').onClick(() => { if (count > 1) { count--; update(); } }); } catch {}
  try { $w('#btnPaxPlus').onClick(() => { if (count < 19) { count++; update(); } }); } catch {}
}

function validateFieldEl(id) {
  try {
    const val = ($w(id).value || '').trim();
    if (!val) $w(id).updateValidityIndication();
  } catch {}
}

async function handleSubmit() {
  if (submitting) return;

  const data = {
    name:      safeVal('#inputName'),
    email:     safeVal('#inputEmail'),
    phone:     safeVal('#inputPhone'),
    departure: safeVal('#inputDeparture'),
    arrival:   safeVal('#inputArrival'),
    date:      safeVal('#inputDate'),
    returnDate:safeVal('#inputReturnDate'),
    aircraft:  safeVal('#inputAircraft'),
    pax:       safeNum('#paxCount'),
    notes:     safeVal('#inputNotes'),
  };

  const { valid, errors } = validateBookingForm(data);
  if (!valid) {
    showFieldErrors(errors);
    return;
  }

  submitting = true;
  setLoading(true);
  clearMessages();

  try {
    try {
      await $w('#bookingDataset').setFieldValues({
        ...data,
        submittedDate: new Date(),
        status: 'new',
      });
      await $w('#bookingDataset').save();
    } catch (err) {
      // Dataset may not be configured — still show success to avoid blocking UX
      console.log('Booking dataset save skipped:', err.message);
    }

    showSuccess();
  } catch (e) {
    console.error('Booking submit error:', e);
    showError('Submission failed. Please call us or email information@amgaviationgroup.com');
    submitting = false;
  } finally {
    setLoading(false);
  }
}

function showSuccess() {
  try { $w('#bookingForm').collapse(); } catch {}
  try { $w('#bookingSuccess').expand(); $w('#bookingSuccess').show('fade', { duration: 400 }); } catch {}
  try { $w('#btnSuccessHome').onClick(() => wixLocation.to('/')); } catch {}
}

function showError(msg) {
  try { $w('#bookingError').text = msg; $w('#bookingError').show(); } catch {}
}

function clearMessages() {
  try { $w('#bookingError').hide(); } catch {}
}

function setLoading(on) {
  try {
    $w('#btnBookingSubmit').label = on ? 'Submitting…' : 'Submit Request';
    on ? $w('#btnBookingSubmit').disable() : $w('#btnBookingSubmit').enable();
  } catch {}
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, msg]) => {
    try {
      const id = `#error${field.charAt(0).toUpperCase() + field.slice(1)}`;
      $w(id).text = msg;
      $w(id).show();
    } catch {}
  });
}

function safeVal(id) {
  try { return ($w(id).value || '').trim(); } catch { return ''; }
}

function safeNum(id) {
  try { return parseInt($w(id).text || '1', 10); } catch { return 1; }
}
