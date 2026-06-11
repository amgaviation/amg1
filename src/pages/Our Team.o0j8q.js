/**
 * Our Team.o0j8q.js — AMG Aviation Group
 * Team page: leadership cards, bios, CTA.
 */

import wixLocation from 'wix-location';

$w.onReady(function () {
  initScrollReveal();
  initTeamRepeater();
  initCTAButtons();
});

function initScrollReveal() {
  ['#teamHero', '#teamGrid', '#joinTeamSection'].forEach(id => {
    try { $w(id).onViewportEnter(() => { $w(id).show('fade', { duration: 450 }); }); } catch {}
  });
}

function initTeamRepeater() {
  try {
    $w('#teamRepeater').onItemReady(($item, itemData) => {
      try { $item('#memberName').text = itemData.name || ''; } catch {}
      try { $item('#memberTitle').text = itemData.title || ''; } catch {}
      try { $item('#memberBio').text = itemData.bio || ''; } catch {}
      try {
        if (itemData.linkedIn) {
          $item('#btnLinkedIn').link = itemData.linkedIn;
        } else {
          $item('#btnLinkedIn').hide();
        }
      } catch {}
    });
  } catch {}
}

function initCTAButtons() {
  try { $w('#btnJoinTeam').onClick(() => wixLocation.to('/contact?subject=Careers')); } catch {}
  try { $w('#btnTeamContact').onClick(() => wixLocation.to('/contact')); } catch {}
}
