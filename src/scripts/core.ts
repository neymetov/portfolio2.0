import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

/** Smooth scrolling is shared by every page and survives client-side navigation. */
export const lenis: Lenis | null = reduce ? null : new Lenis({ lerp: 0.09 });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const scrollToY = (y: number, immediate = false) => {
  if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.2 });
  else scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' });
};

/** Everything a page registers here is undone before the next page is swapped in. */
const cleanups: (() => void)[] = [];
export const onCleanup = (fn: () => void) => void cleanups.push(fn);
export const runCleanups = () => {
  while (cleanups.length) {
    try {
      cleanups.pop()!();
    } catch (error) {
      console.error(error);
    }
  }
};

export const listen = <K extends keyof WindowEventMap>(
  target: Window | Document | Element,
  type: K | string,
  handler: (event: any) => void,
  options?: boolean | AddEventListenerOptions,
) => {
  target.addEventListener(type, handler, options);
  onCleanup(() => target.removeEventListener(type, handler, options));
};

/** The custom cursor: a dot that grows into a labelled pink circle over interactive media. */
export const big = (on: boolean, label?: string) => {
  const cursor = document.querySelector<HTMLElement>('.cursor');
  if (!cursor) return;
  cursor.classList.toggle('big', on);
  if (label) cursor.querySelector('span')!.textContent = label;
};

export const hoverCursor = (el: Element, label: string) => {
  if (!fine) return;
  listen(el, 'mouseenter', () => big(true, label));
  listen(el, 'mouseleave', () => big(false));
};

/** Wraps every word in a mask so it can rise into place. Returns the inner spans. */
export const split = (el: HTMLElement) => {
  const out: HTMLElement[] = [];
  (function walk(node: Node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (child.textContent ?? '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const word = document.createElement('span');
          word.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          word.appendChild(inner);
          frag.appendChild(word);
          out.push(inner);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    });
  })(el);
  return out;
};

/** 3D tilt plus a moving glare on `target`, driven by the pointer over `area`. */
export const tilt = (area: Element, target: HTMLElement, amount: number) => {
  if (!fine) return;
  const rotateY = gsap.quickTo(target, 'rotateY', { duration: 0.6, ease: 'power3' });
  const rotateX = gsap.quickTo(target, 'rotateX', { duration: 0.6, ease: 'power3' });
  listen(area, 'mousemove', (event: MouseEvent) => {
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rotateY((x - 0.5) * amount);
    rotateX((0.5 - y) * amount);
    target.style.setProperty('--mx', `${x * 100}%`);
    target.style.setProperty('--my', `${y * 100}%`);
  });
  listen(area, 'mouseleave', () => {
    rotateY(0);
    rotateX(0);
  });
};

export const refresh = () => ScrollTrigger.refresh();

export const enter = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) => {
  if (reduce) return;
  gsap.fromTo(
    targets,
    { y: 40, opacity: 0, filter: 'blur(8px)' },
    { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'expo.out', stagger: 0.06, clearProps: 'filter,transform,opacity', ...vars },
  );
};
