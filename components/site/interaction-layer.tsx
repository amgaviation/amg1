"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";

export function InteractionLayer() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState("");
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorVisibleRef = useRef(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches && window.innerWidth >= 768;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lenis: Lenis | null = null;
    let animationContext: gsap.Context | null = null;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let lastScroll = window.scrollY;

    const updateScrollVars = (next: number, velocity: number) => {
      document.documentElement.style.setProperty("--scroll-depth", String(next));
      document.documentElement.style.setProperty("--scroll-velocity", String(Math.max(-40, Math.min(40, velocity))));
    };

    if (!reduceMotion) {
      gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.1,
        wheelMultiplier: 0.9,
      });

      lenis.on("scroll", ({ scroll, velocity }: { scroll: number; velocity: number }) => {
        updateScrollVars(scroll, velocity * 24);
        ScrollTrigger.update();
      });

      animationContext = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-scroll-animate]").forEach((element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 64, scale: 0.98 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: element,
                start: "top 86%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
          const depth = Number(element.dataset.parallax || 0.12);
          gsap.to(element, {
            yPercent: depth * -100,
            ease: "none",
            scrollTrigger: {
              trigger: element.closest("section") ?? element,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        });

        gsap.utils.toArray<HTMLVideoElement>("[data-scroll-video]").forEach((video) => {
          gsap.to(video, {
            scale: 1.08,
            filter: "saturate(1.06) contrast(1.06)",
            ease: "none",
            scrollTrigger: {
              trigger: video.closest("section") ?? video,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });
      }, document.body);
    }

    const tick = (time: number) => {
      lenis?.raf(time);
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      raf = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const next = window.scrollY;
      updateScrollVars(next, next - lastScroll);
      lastScroll = next;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    raf = window.requestAnimationFrame(tick);

    if (!finePointer || reduceMotion) {
      return () => {
        lenis?.destroy();
        animationContext?.revert();
        window.cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
      };
    }

    setEnabled(true);

    const onPointerMove = (event: PointerEvent) => {
      if (!cursorVisibleRef.current) {
        cursorVisibleRef.current = true;
        setVisible(true);
      }
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const trigger = target.closest<HTMLElement>("[data-cursor]");
      setLabel(trigger?.dataset.cursor ?? "");
    };

    document.documentElement.classList.add("amg-cursor-active");
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });

    return () => {
      document.documentElement.classList.remove("amg-cursor-active");
      lenis?.destroy();
      animationContext?.revert();
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!enabled || !visible) return null;

  return (
    <div ref={cursorRef} className="amg-cursor" aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}
