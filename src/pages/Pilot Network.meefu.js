/**
 * Pilot Network.meefu.js — AMG Aviation Group
 * Pilot Network public page: crew showcase, join CTA, requirements.
 * NOTE: Part 91 language only — never imply AMG dispatches or certifies crew.
 */

import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';

$w.onReady(async function () {
  initScrollReveal();
  initCTAButtons();
  await initAuthState();
});

function initScrollReveal() {
  ['#networkHero', '#requirementsSection', '#benefitsSection', '#joinSection'].forEach(id => {
    try {
      $w(id).onViewportEnter(() => { $w(id).show('fade', { duration: 450 }); });
    } catch (e) {}
  });
}

async function initAuthState() {
  try {
    const member = await currentMember.getMember();
    if (member) {
      // Already a member — show portal link instead of join CTA
      try { $w('#btnJoinNetwork').label = 'Go to My Portal'; } catch {}
      try {
        $w('#btnJoinNetwork').onClick(() => wixLocation.to('/portal-router'));
      } catch {}
    }
  } catch (e) {
    // Not logged in — show default join CTA
  }
}

function initCTAButtons() {
  try {
    $w('#btnJoinNetwork').onClick(() => {
      // Route to registration / membership signup
      wixLocation.to('/plans-pricing');
    });
  } catch (e) {}

  try { $w('#btnNetworkContact').onClick(() => wixLocation.to('/contact')); } catch (e) {}
  try { $w('#btnNetworkBooking').onClick(() => wixLocation.to('/booking-request')); } catch (e) {}
}
