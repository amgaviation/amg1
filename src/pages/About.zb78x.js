/**
 * About.zb78x.js — AMG Aviation Group
 * About page: mission statement, leadership, values, Part 91 disclosure.
 */

import wixLocation from 'wix-location';

$w.onReady(function () {
  initScrollReveal();
  initCTAButtons();
  initTeamLinks();
});

function initScrollReveal() {
  const sections = ['#missionSection', '#valuesSection', '#teamPreview', '#disclaimerSection'];
  sections.forEach(id => {
    try {
      $w(id).onViewportEnter(() => {
        $w(id).show('fade', { duration: 500 });
      });
    } catch (e) {}
  });
}

function initCTAButtons() {
  try { $w('#btnAboutCTA').onClick(() => wixLocation.to('/booking-request')); } catch (e) {}
  try { $w('#btnMeetTeam').onClick(() => wixLocation.to('/our-team')); } catch (e) {}
  try { $w('#btnAboutServices').onClick(() => wixLocation.to('/services')); } catch (e) {}
}

function initTeamLinks() {
  // If there is a repeater for team preview, attach click navigation
  try {
    $w('#teamRepeater').onItemReady(($item, itemData) => {
      $item('#teamCard').onClick(() => wixLocation.to('/our-team'));
    });
  } catch (e) {}
}
