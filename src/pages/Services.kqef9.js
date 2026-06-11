/**
 * Services.kqef9.js — AMG Aviation Group
 * Services page: service cards, capability details, CTA routing.
 */

import wixLocation from 'wix-location';

$w.onReady(function () {
  initScrollReveal();
  initServiceFilters();
  initCTAButtons();
});

function initScrollReveal() {
  const els = ['#servicesHero', '#servicesGrid', '#capabilitiesSection', '#servicesCTA'];
  els.forEach(id => {
    try {
      $w(id).onViewportEnter(() => { $w(id).show('fade', { duration: 450 }); });
    } catch (e) {}
  });
}

function initServiceFilters() {
  // If a repeater is connected to the Services CMS collection, handle filtering
  try {
    const filters = ['#filterAll', '#filterOps', '#filterCrew', '#filterFleet'];
    filters.forEach(id => {
      try {
        $w(id).onClick(() => {
          filters.forEach(f => { try { $w(f).style.backgroundColor = 'transparent'; } catch {} });
          $w(id).style.backgroundColor = 'rgba(30,107,255,0.12)';
        });
      } catch (e) {}
    });
  } catch (e) {}
}

function initCTAButtons() {
  try { $w('#btnServicesCTA').onClick(() => wixLocation.to('/booking-request')); } catch (e) {}
  try { $w('#btnServicesContact').onClick(() => wixLocation.to('/contact')); } catch (e) {}
  try { $w('#btnServicesPlans').onClick(() => wixLocation.to('/plans-pricing')); } catch (e) {}
}
