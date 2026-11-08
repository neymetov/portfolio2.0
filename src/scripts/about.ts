import { ScrollTrigger, fine, gsap, hoverCursor, listen, onCleanup, reduce, refresh, scrollToY, split } from './core';

interface Job {
  year: string;
  company: string;
  role: string;
  text: string;
  photo: string;
  color: string;
}

export const init = () => {
  hero();
  experience();
  stacks();
  collage();
  closing();
  ring();
};

/* ——— hero: words rise from a mask, the CV button explains itself until a file exists ——— */
const hero = () => {
  const cv = document.querySelector<HTMLAnchorElement>('#cvBtn');
  if (cv) {
    listen(
      cv,
      'click',
      (event: Event) => {
        if (cv.dataset.file) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        cv.classList.add('tip');
        clearTimeout((cv as any)._t);
        (cv as any)._t = setTimeout(() => cv.classList.remove('tip'), 1800);
      },
      true,
    );
  }

  document.querySelectorAll<HTMLElement>('.split').forEach((el) => {
    const words = split(el);
    if (reduce) return;
    const timeline = gsap.timeline({ paused: true });
    words.forEach((word, i) => timeline.fromTo(word, { yPercent: 110, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out' }, i * 0.045));
    if (el.tagName === 'H1') timeline.delay(0.3).play();
    else ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => timeline.play() });
  });

  if (reduce) return;
  gsap.from('.avatar', { y: 24, scale: 0.8, opacity: 0, duration: 1.1, ease: 'expo.out', delay: 0.05, clearProps: 'transform' });
  gsap.from('.badge', { y: 20, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.15 });
  gsap.from('.cv-btn', { y: 20, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.9, clearProps: 'transform,opacity' });
  gsap.from('.meetups p', { y: 30, opacity: 0, filter: 'blur(8px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.meetups', start: 'top 75%' } });
  gsap.from('.collage img', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.collage', start: 'top 80%' }, clearProps: 'transform,opacity' });
  gsap.from('.f-item', { y: 100, opacity: 0, filter: 'blur(10px)', duration: 1.4, ease: 'expo.out', stagger: 0.15, scrollTrigger: { trigger: '.featured .items', start: 'top 80%' } });
  gsap.from('.services a', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.services', start: 'top 85%' } });
};

/* ——— experience: a sticky timeline whose active place follows the scroll ——— */
const experience = () => {
  const track = document.querySelector<HTMLElement>('#track');
  const fill = document.querySelector<HTMLElement>('#fill');
  const tile = document.querySelector<HTMLElement>('#tile');
  const tileImg = document.querySelector<HTMLImageElement>('#tileImg');
  const copy = document.querySelector<HTMLElement>('#copy');
  if (!track || !fill || !tile || !tileImg || !copy) return;

  const jobs: Job[] = JSON.parse(track.dataset.exp ?? '[]');
  if (!jobs.length) return;
  const years = [...track.querySelectorAll<HTMLElement>('.yr')];
  const ROW = 48, TOP = 16, TILE = 104, GAP = 12;
  let current = -1;
  let heights: number[] = [];

  const markup = (job: Job) => `<h3>${esc(job.company)}</h3><strong>${esc(job.role)}</strong><p>${esc(job.text)}</p>`;

  /* measure each place's text block at the current width, so later years never sit under it */
  const measure = () => {
    const probe = document.createElement('div');
    probe.className = 'exp-copy';
    probe.style.cssText = 'visibility:hidden;transform:none;transition:none';
    copy.parentNode!.appendChild(probe);
    heights = jobs.map((job) => {
      probe.innerHTML = `<div class="in">${markup(job)}</div>`;
      return probe.offsetHeight + 20;
    });
    probe.remove();
    track.style.height = `${TOP + jobs.length * ROW + GAP + TILE + 16 + Math.max(...heights) + 16}px`;
  };

  const layout = (i: number) => {
    years.forEach((year, j) => {
      const offset = j > i ? TILE + GAP * 2 + heights[i] : 0;
      year.style.transform = `translateY(${TOP + j * ROW + offset}px)`;
      year.classList.toggle('passed', j <= i);
    });
    const tileY = TOP + (i + 1) * ROW + GAP;
    tile.style.transform = `translateY(${tileY}px)`;
    fill.style.setProperty('--fill', `${tileY + TILE + GAP}px`);
    copy.style.transform = `translateY(${tileY + TILE + GAP + 16}px)`;
  };

  const set = (i: number) => {
    if (i === current) return;
    const first = current < 0;
    current = i;
    const job = jobs[i];
    track.closest<HTMLElement>('.exp-stage')!.style.setProperty('--accent', job.color);
    layout(i);
    const inner = copy.querySelector<HTMLElement>('.in')!;
    const apply = () => {
      inner.innerHTML = markup(job);
      inner.classList.remove('out');
      tileImg.src = job.photo;
      tileImg.classList.remove('swap');
    };
    if (first) return apply();
    inner.classList.add('out');
    tileImg.classList.add('swap');
    const timer = setTimeout(apply, 220);
    onCleanup(() => clearTimeout(timer));
  };

  const relayout = () => {
    measure();
    if (current >= 0) layout(current);
  };
  measure();
  set(0);
  listen(window, 'resize', relayout);
  void document.fonts?.ready.then(() => {
    relayout();
    refresh();
  });

  const trigger = ScrollTrigger.create({
    trigger: '.exp-scroll',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => set(Math.min(jobs.length - 1, Math.floor(self.progress * jobs.length * 0.999))),
  });
  years.forEach((year) =>
    listen(year, 'click', () => scrollToY(trigger.start + ((trigger.end - trigger.start) * (Number(year.dataset.i) + 0.5)) / jobs.length)),
  );
};

const esc = (text: string) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/* ——— project stacks: tilt and glare on the front card, a click brings the back one forward ——— */
const stacks = () => {
  document.querySelectorAll<HTMLElement>('.stack').forEach((stack) => {
    hoverCursor(stack, 'next');
    const front = () => stack.querySelector<HTMLElement>('.slide.front .face')!;
    let bound: HTMLElement | null = null;
    let qx: gsap.QuickToFunc, qy: gsap.QuickToFunc;
    const bind = () => {
      const face = front();
      if (face === bound) return;
      if (bound) gsap.to(bound, { rotateX: 0, rotateY: 0, duration: 0.5 });
      bound = face;
      qx = gsap.quickTo(face, 'rotateY', { duration: 0.6, ease: 'power3' });
      qy = gsap.quickTo(face, 'rotateX', { duration: 0.6, ease: 'power3' });
    };
    if (fine) {
      listen(stack, 'mousemove', (event: MouseEvent) => {
        bind();
        const face = front();
        const rect = face.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        qx((x - 0.5) * 16);
        qy((0.5 - y) * 16);
        face.style.setProperty('--mx', `${x * 100}%`);
        face.style.setProperty('--my', `${y * 100}%`);
      });
      listen(stack, 'mouseleave', () => {
        if (bound) {
          qx(0);
          qy(0);
        }
      });
    }
    listen(stack, 'click', () => {
      const back = stack.querySelector('.slide.back')!;
      const front = stack.querySelector('.slide.front')!;
      back.classList.replace('back', 'front');
      front.classList.replace('front', 'back');
      if (bound) gsap.set(bound, { rotateX: 0, rotateY: 0 });
      bound = null;
    });
  });
};

/* ——— meetups collage: hover fans the photos out, a tap does it on touch screens ——— */
const collage = () => {
  const el = document.querySelector<HTMLElement>('.collage');
  if (el && !fine) listen(el, 'click', () => el.classList.toggle('fanned'));
};

/* ——— closing panel: slow drifting blobs ——— */
const closing = () => {
  if (reduce) return;
  const tweens = [
    gsap.to('.b1', { xPercent: 30, yPercent: 20, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
    gsap.to('.b2', { xPercent: -25, yPercent: -15, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
    gsap.to('.b3', { xPercent: 20, yPercent: -30, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
  ];
  onCleanup(() => tweens.forEach((tween) => tween.kill()));

};

/* ——— story ring: three.js is only loaded once the hero is visible ——— */
const ring = () => {
  const canvas = document.querySelector<HTMLCanvasElement>('#ring');
  const heroEl = document.querySelector<HTMLElement>('.hero');
  if (!canvas || !heroEl) return;
  let stop: (() => void) | undefined;
  let cancelled = false;
  onCleanup(() => {
    cancelled = true;
    stop?.();
  });
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      void import('./ring').then(({ mountRing }) => {
        if (cancelled) return;
        const result = mountRing(canvas);
        if (!result) {
          heroEl.classList.add('no-webgl');
          heroEl.querySelector('.ring-fallback')?.removeAttribute('hidden');
        }
        else stop = result;
      });
    },
    { rootMargin: '200px' },
  );
  observer.observe(canvas);
  onCleanup(() => observer.disconnect());
};
