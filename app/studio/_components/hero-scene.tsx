"use client";

import { useEffect, useRef } from "react";

/**
 * The hero centrepiece: a live traffic picture. Range rings, a rotating sweep,
 * and a set of tracks that illuminate as the sweep passes over them — the way a
 * real scope paints a target and lets it decay.
 *
 * Deliberately Canvas 2D and hand-written. A WebGL library would add hundreds of
 * kilobytes to a one-page site for an effect that costs a few hundred lines
 * here, and this file ships zero dependencies.
 *
 * It is only ever mounted by hero-scene-mount.tsx, which holds it back until the
 * page is idle and never mounts it at all under reduced motion. Everything below
 * can therefore assume "motion is wanted"; it still has to earn its frames:
 *   - device pixel ratio capped (harder cap on low-power devices)
 *   - track budget scaled to the device
 *   - rAF stopped entirely when scrolled offscreen or the tab is hidden
 */

type Track = {
  x: number;
  y: number;
  heading: number;
  speed: number;
  /** Trail history, newest last. */
  trail: { x: number; y: number }[];
  /** 0..1 afterglow, set to 1 when the sweep crosses the track. */
  paint: number;
  size: number;
};

const TAU = Math.PI * 2;

function angleTo(cx: number, cy: number, x: number, y: number) {
  const a = Math.atan2(y - cy, x - cx);
  return a < 0 ? a + TAU : a;
}

export function HeroScene({ lowPower = false }: { lowPower?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const TRACK_COUNT = lowPower ? 7 : 16;
    const TRAIL_LEN = lowPower ? 10 : 18;
    const SWEEP_SEGMENTS = lowPower ? 14 : 26;
    const maxDpr = lowPower ? 1.5 : 2;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cx = 0;
    let cy = 0;
    let radius = 0;

    let sweep = -Math.PI / 2;
    let pointerX = 0;
    let pointerY = 0;
    let driftX = 0;
    let driftY = 0;
    let scrollY = 0;

    let frame = 0;
    let running = false;
    let last = 0;

    const tracks: Track[] = [];

    const seed = (track: Track, initial: boolean) => {
      // Enter from just outside the ring set and cross the field.
      const entry = Math.random() * TAU;
      const dist = initial ? radius * (0.15 + Math.random() * 0.85) : radius * 1.15;
      track.x = cx + Math.cos(entry) * dist;
      track.y = cy + Math.sin(entry) * dist * 0.62;
      // Head roughly across the scope rather than straight at the centre.
      track.heading = entry + Math.PI + (Math.random() - 0.5) * 1.1;
      track.speed = 14 + Math.random() * 26;
      track.size = 3.4 + Math.random() * 2.2;
      track.trail.length = 0;
      track.paint = initial ? Math.random() : 0;
    };

    const layout = () => {
      const box = host.getBoundingClientRect();
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wide = width >= 900;
      cx = wide ? width * 0.7 : width * 0.62;
      cy = wide ? height * 0.5 : height * 0.72;
      radius = Math.min(width * (wide ? 0.46 : 0.68), height * (wide ? 0.62 : 0.42));

      if (tracks.length === 0) {
        for (let i = 0; i < TRACK_COUNT; i += 1) {
          const track: Track = {
            x: 0,
            y: 0,
            heading: 0,
            speed: 0,
            trail: [],
            paint: 0,
            size: 4,
          };
          seed(track, true);
          tracks.push(track);
        }
      }
    };

    const drawRings = (ox: number, oy: number) => {
      ctx.save();
      ctx.translate(cx + ox, cy + oy);
      ctx.scale(1, 0.62);

      for (let i = 1; i <= 4; i += 1) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.strokeStyle = `rgba(122, 210, 165, ${i === 4 ? 0.3 : 0.17})`;
        ctx.lineWidth = 1;
        ctx.setLineDash(i % 2 === 0 ? [] : [3, 7]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Bearing ticks every 30°, longer on the cardinals.
      for (let deg = 0; deg < 360; deg += 30) {
        const a = (deg * Math.PI) / 180;
        const inner = radius * (deg % 90 === 0 ? 0.9 : 0.955);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
        ctx.strokeStyle = "rgba(122, 210, 165, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawSweep = (ox: number, oy: number) => {
      ctx.save();
      ctx.translate(cx + ox, cy + oy);
      ctx.scale(1, 0.62);

      const step = 0.028;
      for (let i = 0; i < SWEEP_SEGMENTS; i += 1) {
        const a0 = sweep - i * step;
        const alpha = 0.2 * (1 - i / SWEEP_SEGMENTS) ** 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a0 - step, a0);
        ctx.closePath();
        ctx.fillStyle = `rgba(59, 240, 138, ${alpha.toFixed(4)})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweep) * radius, Math.sin(sweep) * radius);
      ctx.strokeStyle = `rgba(59, 240, 138, ${lowPower ? 0.26 : 0.42})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    };

    const drawTracks = (ox: number, oy: number) => {
      for (const track of tracks) {
        const x = track.x + ox;
        const y = track.y + oy;

        // Trail: dotted history, fading toward the oldest sample.
        for (let i = 0; i < track.trail.length; i += 1) {
          const point = track.trail[i];
          const fade = (i / track.trail.length) * 0.5 * (0.25 + track.paint * 0.75);
          ctx.beginPath();
          ctx.arc(point.x + ox, point.y + oy, 1.1, 0, TAU);
          ctx.fillStyle = `rgba(122, 210, 165, ${fade.toFixed(3)})`;
          ctx.fill();
        }

        const glow = 0.22 + track.paint * 0.78;

        // Velocity leader — where the target will be, which is the whole point
        // of a scope.
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(track.heading) * track.speed * 0.55,
          y + Math.sin(track.heading) * track.speed * 0.34,
        );
        ctx.strokeStyle = `rgba(59, 240, 138, ${(glow * 0.5).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // The target itself: a small heading-aligned delta.
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(track.heading);
        ctx.beginPath();
        ctx.moveTo(track.size, 0);
        ctx.lineTo(-track.size * 0.7, track.size * 0.62);
        ctx.lineTo(-track.size * 0.7, -track.size * 0.62);
        ctx.closePath();
        ctx.fillStyle = `rgba(59, 240, 138, ${glow.toFixed(3)})`;
        ctx.fill();
        ctx.restore();

        if (track.paint > 0.55 && !lowPower) {
          ctx.beginPath();
          ctx.arc(x, y, track.size * 3.4, 0, TAU);
          ctx.fillStyle = `rgba(59, 240, 138, ${((track.paint - 0.55) * 0.09).toFixed(3)})`;
          ctx.fill();
        }
      }
    };

    const step = (dt: number) => {
      const prevSweep = sweep;
      sweep = (sweep + dt * 0.42) % TAU;

      for (const track of tracks) {
        track.x += Math.cos(track.heading) * track.speed * dt;
        track.y += Math.sin(track.heading) * track.speed * dt * 0.62;

        track.trail.push({ x: track.x, y: track.y });
        if (track.trail.length > TRAIL_LEN) track.trail.shift();

        // Repaint when the sweep line crosses this target's bearing.
        const bearing = angleTo(cx, cy, track.x, track.y);
        const from = ((prevSweep % TAU) + TAU) % TAU;
        const to = ((sweep % TAU) + TAU) % TAU;
        const crossed = from <= to ? bearing > from && bearing <= to : bearing > from || bearing <= to;
        if (crossed) track.paint = 1;
        track.paint = Math.max(0, track.paint - dt * 0.42);

        const dx = track.x - cx;
        const dy = (track.y - cy) / 0.62;
        if (Math.hypot(dx, dy) > radius * 1.25) seed(track, false);
      }

      // Parallax targets: cursor drift plus a slower scroll offset, eased so the
      // scene never snaps.
      driftX += (pointerX * 16 - driftX) * Math.min(1, dt * 3);
      driftY += (pointerY * 10 - driftY) * Math.min(1, dt * 3);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const parallax = scrollY * 0.06;
      // Two layers at different rates: the ring furniture lags the traffic.
      drawRings(driftX * 0.45, driftY * 0.45 + parallax * 0.5);
      drawSweep(driftX * 0.45, driftY * 0.45 + parallax * 0.5);
      drawTracks(driftX, driftY + parallax);
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      step(dt);
      render();
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    layout();
    render();

    const resizeObserver = new ResizeObserver(() => {
      layout();
      if (!running) render();
    });
    resizeObserver.observe(host);

    // Offscreen means zero frames — the single biggest win available here.
    let visible = true;
    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersection.observe(host);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        scrollY = window.scrollY;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
    };
  }, [lowPower]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}

export default HeroScene;
