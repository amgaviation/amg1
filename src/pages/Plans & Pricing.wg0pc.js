/**
 * Plans & Pricing.wg0pc.js — AMG Aviation Group
 * Plans & Pricing page: plan cards, toggle annual/monthly, CTA to checkout.
 */

import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';

let isAnnual = false;

const PLANS = {
  essentials: { monthly: 1500,  annual: 15000  },
  preferred:  { monthly: 3500,  annual: 35000  },
  elite:      { monthly: 7500,  annual: 75000  },
};

$w.onReady(async function () {
  initBillingToggle();
  initPlanCTAs();
  initScrollReveal();
  await highlightCurrentPlan();
});

function initBillingToggle() {
  try {
    $w('#toggleAnnual').onChange(e => {
      isAnnual = e.target.checked;
      updatePrices();
    });
  } catch {}

  try {
    $w('#btnToggleMonthly').onClick(() => { isAnnual = false; updatePrices(); });
    $w('#btnToggleAnnual').onClick(() => { isAnnual = true;  updatePrices(); });
  } catch {}
}

function updatePrices() {
  Object.entries(PLANS).forEach(([plan, prices]) => {
    const price = isAnnual ? prices.annual : prices.monthly;
    const label = isAnnual
      ? `$${price.toLocaleString()} / yr`
      : `$${price.toLocaleString()} / mo`;

    try { $w(`#price${cap(plan)}`).text = label; } catch {}
  });

  // Toggle savings badge
  try { $w('#savingsBadge')[isAnnual ? 'show' : 'hide'](); } catch {}
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function initPlanCTAs() {
  const plans = ['essentials', 'preferred', 'elite', 'custom'];
  plans.forEach(plan => {
    try {
      $w(`#btn${cap(plan)}Select`).onClick(async () => {
        const member = await getMember();
        if (!member) {
          wixLocation.to(`/plans-customization?plan=${plan}`);
        } else {
          wixLocation.to(`/checkout?plan=${plan}&billing=${isAnnual ? 'annual' : 'monthly'}`);
        }
      });
    } catch {}
  });

  // Custom plan CTA
  try { $w('#btnCustomPlan').onClick(() => wixLocation.to('/contact?subject=Custom+Plan')); } catch {}
  try { $w('#btnComparePlans').onClick(() => wixLocation.to('/contact')); } catch {}
}

function initScrollReveal() {
  ['#plansHero', '#plansGrid', '#comparisonTable', '#plansCTA'].forEach(id => {
    try { $w(id).onViewportEnter(() => { $w(id).show('fade', { duration: 450 }); }); } catch {}
  });
}

async function highlightCurrentPlan() {
  try {
    // If member has a subscription, highlight their current plan card
    // This is a UI hint only — actual entitlement is controlled by Wix Pricing Plans
    const member = await getMember();
    if (!member) return;
    // Future: query member subscription from Wix Paid Plans API
  } catch {}
}

async function getMember() {
  try { return await currentMember.getMember(); } catch { return null; }
}
