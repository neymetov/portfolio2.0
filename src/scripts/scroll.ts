import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reduce, scrollKit } from './core';

/* Smooth scrolling and scroll-linked animation. Loaded by the pages that use them (About, Works, case studies);
   once created it is shared by every page and survives client-side navigation. */

gsap.registerPlugin(ScrollTrigger);

export { ScrollTrigger };

export const lenis: Lenis | null = reduce ? null : new Lenis({ lerp: 0.09 });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

scrollKit.current = { lenis, ScrollTrigger };
