/**
 * Home.obeh4.js — AMG Aviation Group
 * Home page: cinematic hero, stats, services overview, aircraft teaser, CTA.
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { timeline } from 'wix-animations';

$w.onReady(function () {
  initHeroAnimations();
  initStatCounters();
  initScrollReveal();
  initCTAButtons();
  initVideoBackground();
});

// ── Hero entrance animation ──────────────────────────────────
function initHeroAnimations() {
  try {
    // Stagger hero text elements in
    const els = ['#heroEyebrow', '#heroTitle', '#heroSubtitle', '#heroCTA'];
    els.forEach((id, i) => {
      try {
        $w(id).hide();
        setTimeout(() => {
          $w(id).show('fade', { duration: 600, delay: i * 120 });
        }, 200 + i * 120);
      } catch (e) {}
    });
  } catch (e) {}
}

// ── Animated stat counters ───────────────────────────────────
function initStatCounters() {
  const stats = [
    { id: '#statFlights',  target: 500,  suffix: '+' },
    { id: '#statYears',    target: 15,   suffix: '+' },
    { id: '#statAircraft', target: 120,  suffix: '+' },
    { id: '#statNetwork',  target: 2000, suffix: '+' },
  ];

  stats.forEach(({ id, target, suffix }) => {
    try {
      const el = $w(id);
      if (!el) return;

      let observer;
      // Use intersection via scroll event
      let started = false;
      const check = () => {
        if (started) return;
        // approximate — start counter when page has been visible for 1s
        started = true;
        animateCount(el, target, suffix);
      };
      setTimeout(check, 1200);
    } catch (e) {}
  });
}

function animateCount(el, target, suffix) {
  const duration = 1800;
  const steps = 60;
  const increment = target / steps;
  let current = 0;
  const interval = setInterval(() => {
    current = Math.min(current + increment, target);
    el.text = Math.floor(current).toLocaleString() + suffix;
    if (current >= target) clearInterval(interval);
  }, duration / steps);
}

// ── Scroll reveal for section cards ─────────────────────────
function initScrollReveal() {
  const revealIds = [
    '#servicesSection',
    '#aircraftTeaser',
    '#statsSection',
    '#networkSection',
    '#ctaSection',
  ];

  revealIds.forEach(id => {
    try {
      $w(id).onViewportEnter(() => {
        $w(id).show('fade', { duration: 500 });
      });
    } catch (e) {}
  });
}

// ── CTA button routing ────────────────────────────────────────
function initCTAButtons() {
  // Primary hero CTA
  try {
    $w('#btnHeroCTA').onClick(() => wixLocation.to('/booking-request'));
  } catch (e) {}

  // Secondary hero CTA
  try {
    $w('#btnHeroSecondary').onClick(() => wixLocation.to('/services'));
  } catch (e) {}

  // Services learn more
  try {
    $w('#btnServicesMore').onClick(() => wixLocation.to('/services'));
  } catch (e) {}

  // Aircraft CTA
  try {
    $w('#btnAircraftMore').onClick(() => wixLocation.to('/aircraft'));
  } catch (e) {}

  // Pilot network CTA
  try {
    $w('#btnPilotNetwork').onClick(() => wixLocation.to('/pilot-network'));
  } catch (e) {}

  // Request support sticky CTA
  try {
    $w('#btnRequestSupport').onClick(() => wixLocation.to('/booking-request'));
  } catch (e) {}

  // Portal / members CTA
  try {
    $w('#btnPortalHome').onClick(() => wixLocation.to('/portal-router'));
  } catch (e) {}
}

// ── Video background auto-play helper ────────────────────────
function initVideoBackground() {
  try {
    const video = $w('#heroVideo');
    if (video) {
      video.mute();
      video.play();
    }
  } catch (e) {}
}
