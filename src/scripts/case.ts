import { ScrollTrigger, enter, fine, gsap, hoverCursor, lenis, listen, onCleanup, reduce, refresh, tilt } from './core';

interface Media {
  img?: string;
  video?: string;
  alt: string;
}

export const init = () => {
  const view = document.querySelector<HTMLElement>('.case-view');
  if (!view) return;
  const next = view.querySelector<HTMLElement>('.cs-next');
  if (next) hoverCursor(next, 'next');
  if (view.classList.contains('landing')) landing(view);
  else simple(view);
  view.querySelectorAll('video').forEach((video) => void video.play().catch(() => {}));
};

/* ——— simple template: a gallery with tilt, glare and a lightbox ——— */
const simple = (view: HTMLElement) => {
  const tiles = [...view.querySelectorAll<HTMLElement>('.cs-tile')];
  const items: Media[] = tiles.map((tile) => {
    const video = tile.querySelector('video');
    const image = tile.querySelector('img');
    return { video: video?.getAttribute('src') ?? undefined, img: image?.getAttribute('src') ?? undefined, alt: image?.alt ?? '' };
  });
  tiles.forEach((tile, index) => {
    const media = tile.querySelector<HTMLElement>('.cs-media')!;
    const has = !!(items[index].img || items[index].video);
    if (fine) {
      tilt(tile, media, 8);
      if (has) hoverCursor(tile, 'view');
    }
    listen(tile, 'click', () => {
      if (has) openLightbox(items.filter((item) => item.img || item.video), items.filter((item) => item.img || item.video).indexOf(items[index]));
    });
  });
  enter(view.querySelectorAll('.cs-back, .cs-intro > *, .cs-tile, .cs-next'), { stagger: 0.07 });
};

/* ——— landing: theme + blocks, each block owns its motion ——— */
const landing = (view: HTMLElement) => {
  const q = <T extends Element>(selector: string) => view.querySelector<T>(selector);
  const all = <T extends Element>(selector: string) => [...view.querySelectorAll<T>(selector)];

  if (!reduce) {
    const hero = q('.lb-hero');
    if (hero) {
      gsap.fromTo(q('.lb-hero-media'), { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
      const scrub = { trigger: '.lb-hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.fromTo(q('.lb-hero-text'), { yPercent: 0 }, { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: scrub });
      const heroVideo = q('.lb-hero-media video, .lb-hero-media img');
      if (heroVideo) gsap.fromTo(heroVideo, { yPercent: 0 }, { yPercent: 12, ease: 'none', scrollTrigger: scrub });
    }
    const reveal = (selector: string, from: gsap.TweenVars, trigger: string, start = 'top 85%', extra: gsap.TweenVars = {}) => {
      const els = all(selector);
      if (!els.length) return;
      gsap.fromTo(els, from, { y: 0, yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger, start }, ...extra });
    };
    reveal('.lb-statement', { y: 40, opacity: 0 }, '.lb-intro', 'top 80%', { duration: 1.2 });
    reveal('.lb-meta > div', { y: 24, opacity: 0 }, '.lb-meta', 'top 85%', { duration: 1, stagger: 0.08 });
    reveal('.lb-sw', { y: 60, opacity: 0 }, '.lb-swatches', 'top 85%', { duration: 1, stagger: 0.08 });
    reveal('.lb-specimen > span', { yPercent: 100, opacity: 0 }, '.lb-specimen', 'top 85%', { stagger: 0.1 });
    reveal('.lb-story', { y: 120, rotate: 0, opacity: 0 }, '.lb-fan', 'top 85%', { duration: 1.2, stagger: 0.08, clearProps: 'transform,opacity' });
    reveal('.lb-wide-fig', { y: 60, opacity: 0 }, '.lb-wide', 'top 85%', { duration: 1.2 });

    /* zoom: an inset, rounded image opens to the full sheet while scrolling */
    const zoom = q('.lb-zoom-fig');
    if (zoom) {
      gsap.fromTo(zoom, { clipPath: 'inset(8% 14% 8% 14% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.lb-zoom', start: 'top 85%', end: 'center 45%', scrub: true } });
      gsap.fromTo(q('.lb-zoom-fig img'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.lb-zoom', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  }

  /* pinned: the phone stays, the active step swaps its screen and fills the progress bar */
  const steps = all('.lb-step');
  const shots = all('.lb-phone > img');
  const bars = all('.lb-progress i');
  const setStep = (i: number) => {
    steps.forEach((step, j) => step.classList.toggle('on', j === i));
    shots.forEach((shot, j) => shot.classList.toggle('on', j === i));
    bars.forEach((bar, j) => bar.classList.toggle('done', j <= i));
  };
  steps.forEach((step, i) => ScrollTrigger.create({ trigger: step, start: 'top 60%', end: 'bottom 60%', onToggle: (self) => self.isActive && setStep(i) }));
  if (steps.length) setStep(0);

  /* palette: click copies the hex */
  all<HTMLButtonElement>('.lb-sw').forEach((swatch) =>
    listen(swatch, 'click', () => {
      void navigator.clipboard?.writeText(swatch.dataset.hex ?? '').catch(() => {});
      swatch.classList.add('copied');
      const timer = setTimeout(() => swatch.classList.remove('copied'), 1200);
      onCleanup(() => clearTimeout(timer));
    }),
  );

  /* stories and the wide image open in the lightbox */
  const figures = all<HTMLElement>('.lb-story, .lb-wide-fig');
  const items: Media[] = figures.map((figure) => {
    const image = figure.querySelector('img')!;
    return { img: image.getAttribute('src')!, alt: image.alt };
  });
  figures.forEach((figure, index) => {
    listen(figure, 'click', () => openLightbox(items, index));
    hoverCursor(figure, 'view');
  });

  refresh();
};

/* ——— lightbox ——— */
const openLightbox = (items: Media[], start: number) => {
  const box = document.querySelector<HTMLElement>('#lb');
  const stage = box?.querySelector<HTMLElement>('.lb-stage');
  const count = box?.querySelector<HTMLElement>('.lb-count');
  if (!box || !stage || !count || !items.length) return;
  let index = Math.max(0, start);

  const show = () => {
    const item = items[index];
    stage.innerHTML = '';
    const node = item.video ? document.createElement('video') : document.createElement('img');
    if (node instanceof HTMLVideoElement) {
      Object.assign(node, { src: item.video, autoplay: true, muted: true, loop: true, playsInline: true });
    } else {
      node.src = item.img ?? '';
      node.alt = item.alt;
    }
    stage.appendChild(node);
    count.textContent = `${index + 1} / ${items.length}`;
    if (!reduce) gsap.fromTo(node, { scale: 0.94, opacity: 0, filter: 'blur(10px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' });
  };
  const step = (dir: number) => {
    index = (index + dir + items.length) % items.length;
    show();
  };
  const close = () => {
    box.classList.remove('on');
    removeEventListener('keydown', keys);
    setTimeout(() => {
      box.hidden = true;
      stage.innerHTML = '';
    }, 300);
    lenis?.start();
  };
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'ArrowLeft') step(-1);
  };

  /* fresh handlers each time: assigning onclick replaces the previous ones */
  box.querySelector<HTMLElement>('.lb-close')!.onclick = close;
  box.querySelector<HTMLElement>('.lb-prev')!.onclick = (event) => {
    event.stopPropagation();
    step(-1);
  };
  box.querySelector<HTMLElement>('.lb-next')!.onclick = (event) => {
    event.stopPropagation();
    step(1);
  };
  box.onclick = (event) => {
    if (event.target === box || event.target === stage) close();
  };
  addEventListener('keydown', keys);
  onCleanup(() => removeEventListener('keydown', keys));

  box.hidden = false;
  requestAnimationFrame(() => box.classList.add('on'));
  show();
  lenis?.stop();
};
