/**
 * Plan Customization.hh2rl.js — AMG Aviation Group
 * Plan customization / quote builder page.
 */

import wixLocation from 'wix-location';

const ADD_ONS = {
  groundTransport:  { label: 'Ground Transport Coordination', price: 350  },
  dedicatedConcierge:{ label: 'Dedicated Concierge', price: 500 },
  inFlightCatering:  { label: 'In-Flight Catering', price: 250 },
  maintenanceSupport:{ label: 'Maintenance Oversight', price: 400 },
  crewBriefings:     { label: 'Advanced Crew Briefings', price: 150 },
};

let selectedAddOns = new Set();
let basePrice = 0;

$w.onReady(function () {
  readBasePlanFromQuery();
  initAddOnToggles();
  initCTAButtons();
  updateTotal();
});

function readBasePlanFromQuery() {
  try {
    const q = wixLocation.query;
    const plan = q.plan || 'essentials';
    const billing = q.billing || 'monthly';

    const prices = {
      essentials: { monthly: 1500, annual: 15000 },
      preferred:  { monthly: 3500, annual: 35000 },
      elite:      { monthly: 7500, annual: 75000 },
    };

    basePrice = prices[plan]?.[billing] || 0;
    const label = `${plan.charAt(0).toUpperCase() + plan.slice(1)} — $${basePrice.toLocaleString()} / ${billing === 'annual' ? 'yr' : 'mo'}`;

    try { $w('#planLabel').text = label; } catch {}
  } catch {}
}

function initAddOnToggles() {
  Object.keys(ADD_ONS).forEach(key => {
    try {
      $w(`#toggle${cap(key)}`).onChange(e => {
        if (e.target.checked) {
          selectedAddOns.add(key);
        } else {
          selectedAddOns.delete(key);
        }
        updateTotal();
      });
    } catch {}
  });
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function updateTotal() {
  let addOnTotal = 0;
  selectedAddOns.forEach(key => { addOnTotal += ADD_ONS[key]?.price || 0; });
  const total = basePrice + addOnTotal;
  try { $w('#totalPrice').text = `$${total.toLocaleString()}`; } catch {}
  try { $w('#addOnTotal').text = addOnTotal > 0 ? `+$${addOnTotal.toLocaleString()}` : '$0'; } catch {}
}

function initCTAButtons() {
  try {
    $w('#btnProceedCheckout').onClick(() => {
      const addOnKeys = [...selectedAddOns].join(',');
      const q = wixLocation.query;
      const qs = `plan=${q.plan || 'essentials'}&billing=${q.billing || 'monthly'}${addOnKeys ? '&addons=' + addOnKeys : ''}`;
      wixLocation.to(`/checkout?${qs}`);
    });
  } catch {}

  try { $w('#btnBackToPlans').onClick(() => wixLocation.to('/plans-pricing')); } catch {}
  try { $w('#btnContactCustom').onClick(() => wixLocation.to('/contact?subject=Custom+Plan')); } catch {}
}
