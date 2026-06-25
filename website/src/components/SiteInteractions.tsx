"use client";

import { useEffect } from "react";

/**
 * All client-side interactions for the landing page, ported verbatim from the
 * approved static mockup:
 *  1. Staggered reveal-on-scroll via IntersectionObserver
 *  2. Squiggle underline draw-in on first visibility
 *  3. Soft nav-link active state by section
 *  4. Header condensing into a floating pill on scroll
 *
 * Each block guards on reduced-motion / missing IntersectionObserver so the
 * page degrades to "everything visible" rather than "everything hidden".
 */
export default function SiteInteractions() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hasIO = "IntersectionObserver" in window;
    const cleanups: Array<() => void> = [];

    // ── 1. Staggered reveal on scroll ──────────────────
    const revealEls = document.querySelectorAll<HTMLElement>(".reveal");
    if (!hasIO || reduceMotion) {
      revealEls.forEach((el) => el.classList.add("visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      );
      revealEls.forEach((el) => observer.observe(el));
      cleanups.push(() => observer.disconnect());
    }

    // ── 2. Squiggle underline draw-in on first visibility ──
    const word = document.getElementById("underline-sidekick");
    if (word) {
      if (!hasIO || reduceMotion) {
        word.classList.add("drawn");
      } else {
        const obs = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              word.classList.add("drawn");
              obs.disconnect();
            }
          },
          { threshold: 0.5 },
        );
        obs.observe(word);
        cleanups.push(() => obs.disconnect());
      }
    }

    // ── 3. Soft nav link active state ────────────────────
    const sections = document.querySelectorAll<HTMLElement>("section[id]");
    const navLinks =
      document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]');
    if (sections.length && navLinks.length && hasIO) {
      const sectionObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navLinks.forEach((link) => {
              const isActive = link.getAttribute("href") === `#${id}`;
              link.style.fontWeight = isActive ? "700" : "";
              link.style.color = isActive ? "var(--ink)" : "";
            });
          });
        },
        { threshold: 0.4 },
      );
      sections.forEach((s) => sectionObs.observe(s));
      cleanups.push(() => sectionObs.disconnect());
    }

    // ── 4. Header condenses into a floating pill on scroll ──
    const nav = document.querySelector("nav");
    if (nav) {
      const THRESHOLD = 40;
      let ticking = false;
      const update = () => {
        nav.classList.toggle("scrolled", window.scrollY > THRESHOLD);
        ticking = false;
      };
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      update();
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
