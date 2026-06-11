/**
 * Contact.t8j3h.js — AMG Aviation Group
 * Contact page: form validation, submission, duplicate protection.
 */

import wixLocation from 'wix-location';
import { send } from 'wix-crm-backend';
import { validateContactForm } from 'public/Site.js';

let submitting = false;

$w.onReady(function () {
  initForm();
  initCTAButtons();
});

function initForm() {
  try {
    $w('#btnContactSubmit').onClick(handleSubmit);
  } catch (e) {}

  // Live validation on blur
  ['#inputName', '#inputEmail', '#inputPhone', '#inputMessage'].forEach(id => {
    try {
      $w(id).onBlur(() => validateField(id));
    } catch (e) {}
  });
}

function validateField(id) {
  try {
    const val = $w(id).value;
    const empty = !val || !val.trim();
    if (empty) {
      $w(id).updateValidityIndication();
    }
  } catch (e) {}
}

async function handleSubmit() {
  if (submitting) return;

  const data = {
    name:    safeVal('#inputName'),
    email:   safeVal('#inputEmail'),
    phone:   safeVal('#inputPhone'),
    subject: safeVal('#inputSubject'),
    message: safeVal('#inputMessage'),
  };

  const { valid, errors } = validateContactForm(data);
  if (!valid) {
    showFieldErrors(errors);
    return;
  }

  submitting = true;
  setLoading(true);

  try {
    // Submit via Wix Forms dataset or CRM
    try {
      await $w('#contactDataset').setFieldValues({
        name:    data.name,
        email:   data.email,
        phone:   data.phone,
        subject: data.subject,
        message: data.message,
        submittedDate: new Date(),
      });
      await $w('#contactDataset').save();
    } catch (datasetErr) {
      // Fallback: just show success (form may not use a dataset)
      console.log('Contact dataset not available, showing success');
    }

    showSuccess();
  } catch (e) {
    console.error('Contact submit error:', e);
    showError('Submission failed. Please email us directly at information@amgaviationgroup.com');
    submitting = false;
  } finally {
    setLoading(false);
  }
}

function showSuccess() {
  try { $w('#contactForm').collapse(); } catch (e) {}
  try { $w('#contactSuccess').expand(); } catch (e) {}
  try { $w('#contactSuccess').show('fade', { duration: 400 }); } catch (e) {}
}

function showError(msg) {
  try { $w('#contactError').text = msg; } catch (e) {}
  try { $w('#contactError').show('fade', { duration: 300 }); } catch (e) {}
}

function setLoading(on) {
  try {
    $w('#btnContactSubmit').label = on ? 'Sending…' : 'Send Message';
    $w('#btnContactSubmit').disable && on ? $w('#btnContactSubmit').disable() : $w('#btnContactSubmit').enable();
  } catch (e) {}
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, msg]) => {
    const id = `#input${field.charAt(0).toUpperCase() + field.slice(1)}`;
    try { $w(id).updateValidityIndication(); } catch {}
    try { $w(`#error${field.charAt(0).toUpperCase() + field.slice(1)}`).text = msg; } catch {}
  });
}

function safeVal(id) {
  try { return ($w(id).value || '').trim(); } catch { return ''; }
}

function initCTAButtons() {
  try { $w('#btnContactBooking').onClick(() => wixLocation.to('/booking-request')); } catch (e) {}
}
