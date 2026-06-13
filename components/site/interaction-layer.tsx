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
    let playbackReset: number | undefined;

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
        const nextRate = Math.max(0.86, Math.min(1.18, 1 + Math.abs(velocity) * 0.018));
        document.querySelectorAll<HTMLVideoElement>("[data-scroll-video]").forEach((video) => {
          video.playbackRate = nextRate;
        });
        if (playbackReset) window.clearTimeout(playbackReset);
        playbackReset = window.setTimeout(() => {
          document.querySelectorAll<HTMLVideoElement>("[data-scroll-video]").forEach((video) => {
            video.playbackRate = 1;
          });
        }, 160);
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

        gsap.utils.toArray<HTMLElement>("[data-stagger-container]").forEach((container) => {
          const items = gsap.utils.toArray<HTMLElement>("[data-stagger-item]", container);
          if (!items.length) return;

          gsap.fromTo(
            items,
            { autoAlpha: 0, y: 42, scale: 0.985 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.09,
              scrollTrigger: {
                trigger: container,
                start: "top 84%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-progress-rail]").forEach((line) => {
          gsap.fromTo(
            line,
            { scaleY: 0, transformOrigin: "top center" },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: line.closest("[data-process-track]") ?? line,
                start: "top 72%",
                end: "bottom 54%",
                scrub: true,
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-process-step]").forEach((element, index) => {
          const marker = element.querySelector<HTMLElement>("[data-step-marker]");
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: element,
              start: "top 82%",
              end: "top 42%",
              scrub: true,
            },
          });

          timeline.fromTo(
            element,
            { autoAlpha: 0.42, y: index % 2 === 0 ? 42 : 58, scale: 0.965 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
          );

          if (marker) {
            timeline.fromTo(marker, { scale: 0.78 }, { scale: 1, duration: 0.8, ease: "power3.out" }, 0);
          }
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
        if (playbackReset) window.clearTimeout(playbackReset);
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
      if (playbackReset) window.clearTimeout(playbackReset);
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
