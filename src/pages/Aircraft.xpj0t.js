/**
 * Aircraft.xpj0t.js — AMG Aviation Group
 * Aircraft page: fleet showcase, specs, filter by category.
 */

import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(function () {
  initScrollReveal();
  initCategoryFilters();
  initAircraftRepeater();
  initCTAButtons();
});

function initScrollReveal() {
  ['#aircraftHero', '#fleetGrid', '#specSection'].forEach(id => {
    try {
      $w(id).onViewportEnter(() => { $w(id).show('fade', { duration: 450 }); });
    } catch (e) {}
  });
}

// Category filter buttons (Light Jet / Mid Jet / Heavy Jet / Turboprop / Helicopter)
function initCategoryFilters() {
  const categories = [
    { id: '#filterAll',        value: 'all'       },
    { id: '#filterLightJet',   value: 'Light Jet' },
    { id: '#filterMidJet',     value: 'Mid Jet'   },
    { id: '#filterHeavyJet',   value: 'Heavy Jet' },
    { id: '#filterTurboprop',  value: 'Turboprop' },
  ];

  categories.forEach(({ id, value }) => {
    try {
      $w(id).onClick(() => {
        // Highlight active filter
        categories.forEach(c => {
          try { $w(c.id).label = $w(c.id).label; } catch {}
        });

        if (value === 'all') {
          try { $w('#aircraftDataset').setFilter(wixData.filter()); } catch {}
        } else {
          try {
            $w('#aircraftDataset').setFilter(
              wixData.filter().eq('category', value)
            );
          } catch {}
        }
      });
    } catch (e) {}
  });
}

// Aircraft repeater item interactions
function initAircraftRepeater() {
  try {
    $w('#aircraftRepeater').onItemReady(($item, itemData) => {
      // Populate specs
      try { $item('#aircraftName').text = itemData.title || ''; } catch {}
      try { $item('#aircraftCategory').text = itemData.category || ''; } catch {}
      try { $item('#aircraftRange').text = itemData.range ? `${itemData.range} nm` : '—'; } catch {}
      try { $item('#aircraftPax').text = itemData.pax ? `${itemData.pax} pax` : '—'; } catch {}
      try { $item('#aircraftSpeed').text = itemData.speed ? `${itemData.speed} kts` : '—'; } catch {}

      // Request support for this aircraft
      try {
        $item('#btnAircraftRequest').onClick(() => {
          wixLocation.to(`/booking-request?aircraft=${encodeURIComponent(itemData.title || '')}`);
        });
      } catch {}
    });
  } catch (e) {}
}

function initCTAButtons() {
  try { $w('#btnAircraftCTA').onClick(() => wixLocation.to('/booking-request')); } catch (e) {}
  try { $w('#btnPilotNetwork').onClick(() => wixLocation.to('/pilot-network')); } catch (e) {}
}
