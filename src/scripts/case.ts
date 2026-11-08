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
  /* images and videos cannot be dragged out or saved from the context menu */
  listen(view, 'contextmenu', (event: Event) => {
    if ((event.target as Element).closest('img, video')) event.preventDefault();
  });
  listen(view, 'dragstart', (event: Event) => event.preventDefault());
  if (view.classList.contains('landing')) landing(view);
  else simple(view);

  /* images load lazily and change the page height, so every scroll trigger below them must be measured again */
  let timer = 0;
  const remeasure = () => {
    clearTimeout(timer);
    timer = window.setTimeout(refresh, 150);
  };
  view.querySelectorAll('img').forEach((img) => {
    if (!img.complete) listen(img, 'load', remeasure);
  });
  listen(window, 'load', remeasure);
  onCleanup(() => clearTimeout(timer));
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

  /* the hero takes the proportions of the uploaded image or video, so it always fits the page width */
  const heroMedia = q<HTMLElement>('.lb-hero-media');
  const heroEl = heroMedia?.querySelector<HTMLVideoElement | HTMLImageElement>('video, img');
  if (heroMedia && heroEl) {
    const fit = () => {
      const w = heroEl instanceof HTMLVideoElement ? heroEl.videoWidth : heroEl.naturalWidth;
      const h = heroEl instanceof HTMLVideoElement ? heroEl.videoHeight : heroEl.naturalHeight;
      if (w && h) {
        heroMedia.style.aspectRatio = `${w} / ${h}`;
        refresh();
      }
    };
    if (heroEl instanceof HTMLVideoElement) {
      if (heroEl.readyState >= 1) fit();
      else listen(heroEl, 'loadedmetadata', fit);
    } else if (heroEl.complete) fit();
    else listen(heroEl, 'load', fit);
  }

  if (!reduce) {
    const hero = q('.lb-hero');
    if (hero) {
      gsap.fromTo(q('.lb-hero-media'), { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
      const scrub = { trigger: '.lb-hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.fromTo(q('.lb-hero-text'), { yPercent: 0 }, { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: scrub });
    }
    /* every block animates on its own trigger: a project can use the same block several times */
    const reveal = (selector: string, from: gsap.TweenVars, container: string | null, start = 'top 85%', extra: gsap.TweenVars = {}) => {
      const to = { y: 0, yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', ...extra };
      if (container) {
        all(container).forEach((box) => {
          const items = [...box.querySelectorAll(selector)];
          if (items.length) gsap.fromTo(items, from, { ...to, scrollTrigger: { trigger: box, start } });
        });
      } else {
        all(selector).forEach((el) => gsap.fromTo(el, from, { ...to, scrollTrigger: { trigger: el, start } }));
      }
    };
    reveal('.lb-statement', { y: 40, opacity: 0 }, null, 'top 80%', { duration: 1.2 });
    reveal('.lb-meta > div', { y: 24, opacity: 0 }, '.lb-meta', 'top 85%', { duration: 1, stagger: 0.08 });
    reveal('.lb-story', { y: 120, rotate: 0, opacity: 0 }, '.lb-fan', 'top 85%', { duration: 1.2, stagger: 0.08, clearProps: 'transform,opacity' });
    reveal('.lb-wide-fig', { y: 60, opacity: 0 }, null, 'top 90%', { duration: 1.2 });
    reveal('figure', { y: 60, opacity: 0 }, '.lb-gallery-grid', 'top 85%', { duration: 1.2, stagger: 0.1 });

    /* zoom: an inset, rounded image opens to the full sheet while scrolling */
    const phone = innerWidth <= 640;
    all('.lb-zoom').forEach((section) => {
      const fig = section.querySelector<HTMLElement>('.lb-zoom-fig');
      if (!fig) return;
      /* only the frame opens; the picture itself is never scaled or cropped */
      gsap.fromTo(fig, { clipPath: phone ? 'inset(4% 6% 4% 6% round 20px)' : 'inset(8% 14% 8% 14% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: section, start: 'top 85%', end: 'center 45%', scrub: true } });
    });
  }

  /* pinned: the phone stays, the active step swaps its screen and fills the progress bar */
  const steps = all('.lb-step');
  const shots = all('.lb-pin-img > img');
  const bars = all('.lb-progress i');
  const setStep = (i: number) => {
    steps.forEach((step, j) => step.classList.toggle('on', j === i));
    shots.forEach((shot, j) => shot.classList.toggle('on', j === i));
    bars.forEach((bar, j) => bar.classList.toggle('done', j <= i));
  };
  steps.forEach((step, i) => ScrollTrigger.create({ trigger: step, start: 'top 60%', end: 'bottom 60%', onToggle: (self) => self.isActive && setStep(i) }));
  if (steps.length) setStep(0);

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
