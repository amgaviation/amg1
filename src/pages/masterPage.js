/**
 * masterPage.js — AMG Aviation Group
 * Global site controller: sticky nav, member auth state, portal routing.
 * Runs on every page.
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members';

$w.onReady(async function () {
  // ── Sticky nav scroll handler ──────────────────────────────
  initStickyNav();

  // ── Handle messages from HTML embeds ──────────────────────
  wixWindow.getBoundingRect().then(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleEmbedMessage);
    }
  });

  // ── Auth state for nav portal button ──────────────────────
  initMemberNav();
});

// ── Sticky nav ─────────────────────────────────────────────────
function initStickyNav() {
  try {
    // If the page has a nav HTML embed, update its scroll class
    const navEl = $w('#navEmbed');
    if (navEl) {
      wixWindow.getBoundingRect().then(rect => {
        if (typeof window !== 'undefined') {
          window.addEventListener('scroll', () => {
            const scrolled = window.scrollY > 40;
            navEl.postMessage(JSON.stringify({ type: 'scrollState', scrolled }));
          }, { passive: true });
        }
      });
    }
  } catch (e) {
    // Nav embed not on this page — normal for portal pages
  }

  // Native Wix sticky strip fallback
  try {
    const strip = $w('#headerStrip');
    if (strip) {
      wixWindow.getBoundingRect().then(() => {
        if (typeof window !== 'undefined') {
          let lastScroll = 0;
          window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (y > 60 && lastScroll <= 60) {
              strip.style = 'background: rgba(14,34,54,0.92); backdrop-filter: blur(18px);';
            } else if (y <= 60 && lastScroll > 60) {
              strip.style = 'background: transparent;';
            }
            lastScroll = y;
          }, { passive: true });
        }
      });
    }
  } catch (e) {
    // Element may not exist on every page
  }
}

// ── Member nav state ───────────────────────────────────────────
async function initMemberNav() {
  try {
    const member = await currentMember.getMember();
    const loggedIn = !!member;

    // Toggle portal/login button visibility if elements exist
    try {
      if (loggedIn) {
        $w('#btnPortalNav') && $w('#btnPortalNav').show();
        $w('#btnLoginNav')  && $w('#btnLoginNav').hide();
        $w('#memberName')   && ($w('#memberName').text = member.profile?.nickname || member.loginEmail || '');
      } else {
        $w('#btnPortalNav') && $w('#btnPortalNav').hide();
        $w('#btnLoginNav')  && $w('#btnLoginNav').show();
      }
    } catch (e) {
      // Elements not present on this page — fine
    }

    // Portal nav button click → router
    try {
      $w('#btnPortalNav').onClick(() => {
        wixLocation.to('/portal-router');
      });
    } catch (e) {}

  } catch (e) {
    // Not logged in or member API unavailable
    try { $w('#btnPortalNav') && $w('#btnPortalNav').hide(); } catch {}
    try { $w('#btnLoginNav')  && $w('#btnLoginNav').show();  } catch {}
  }
}

// ── Embed message bridge ────────────────────────────────────────
function handleEmbedMessage(e) {
  if (!e.data || typeof e.data !== 'object') return;

  switch (e.data.type) {
    // Internal nav links from HTML embeds
    case 'navigate':
      if (e.data.href) wixLocation.to(e.data.href);
      break;

    // Auto-resize HTML embed height
    case 'wix-amg-resize':
      if (e.data.height && e.data.id) {
        try { $w(`#${e.data.id}`).height = e.data.height + 16; } catch {}
      }
      break;

    // CTA redirect
    case 'cta':
      if (e.data.href) wixLocation.to(e.data.href);
      break;
  }
}
