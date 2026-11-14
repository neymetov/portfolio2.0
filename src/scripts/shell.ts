import { fine, gsap, listen, onCleanup, reduce } from './core';

/* ——— things that live in the persistent shell: set up once ——— */

let cx = 0, cy = 0, mx = 0, my = 0, px = innerWidth / 2, py = innerHeight / 2, rot = 0;
let previewOn = false;

export const setupShell = () => {
  addEventListener('mousemove', (event) => {
    mx = event.clientX;
    my = event.clientY;
  });
  gsap.ticker.add(() => {
    const cursor = document.querySelector<HTMLElement>('.cursor');
    if (cursor) {
      cx += (mx - cx) * 0.25;
      cy += (my - cy) * 0.25;
      cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    }
    const preview = document.querySelector<HTMLElement>('.preview');
    if (preview) {
      const dx = mx - px;
      px += dx * 0.12;
      py += (my - py) * 0.12;
      rot += (dx * 0.08 - rot) * 0.1;
      preview.style.opacity = previewOn ? '1' : '0';
      preview.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%) scale(${previewOn ? 1 : 0.6}) rotate(${Math.max(-12, Math.min(12, rot))}deg)`;
    }
  });

  /* the tab bar previews a move on hover and returns to the current page when left */
  const pill = document.querySelector<HTMLElement>('#pill');
  if (pill) {
    pill.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => link.addEventListener('mouseenter', () => setPill(link.dataset.s!)));
    pill.addEventListener('mouseleave', () => setPill(currentTab()));
    addEventListener('resize', () => setPill(currentTab()));
  }
};

const currentTab = () => {
  const page = document.body.dataset.page;
  return page === 'case' || page === 'notfound' ? 'works' : page || 'about';
};

export const setPill = (name: string) => {
  const pill = document.querySelector<HTMLElement>('#pill');
  const ind = pill?.querySelector<HTMLElement>('.ind');
  const links = [...(pill?.querySelectorAll<HTMLAnchorElement>('a') ?? [])];
  const active = links.find((link) => link.dataset.s === name);
  if (!pill || !ind || !active) return;
  ind.style.left = `${active.offsetLeft}px`;
  ind.style.width = `${active.offsetWidth}px`;
  ind.style.background = name === 'contacts' ? 'var(--pink)' : '#000';
  links.forEach((link) => {
    const on = link === active;
    link.classList.toggle('on', on);
    if (on) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
};

/* ——— things that belong to the swapped page: set up on every page load ——— */

/* the built page may be days or months old: numbers that depend on today's date are recalculated in the browser */
const refreshDates = () => {
  const now = new Date();
  document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => (el.textContent = String(now.getFullYear())));
  document.querySelectorAll<HTMLElement>('[data-career-start]').forEach((el) => {
    const [year, month = 1, day = 1] = el.dataset.careerStart!.split('-').map(Number);
    let years = now.getFullYear() - year;
    if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) years -= 1;
    el.textContent = String(Math.max(0, years));
  });
};

/* ——— looping videos ———
   Videos marked data-play have no src in the HTML, only data-src: nothing is requested until the video comes
   near the screen. Then the file is attached, loads and plays, and it pauses again when it leaves.
   The hero video (autoplay, with a real src) is already in view, so it just plays. */
const attach = (video: HTMLVideoElement) => {
  if (!video.getAttribute('src') && video.dataset.src) {
    video.src = video.dataset.src;
    video.load();
  }
};

const mountVideos = () => {
  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-play], video[autoplay]')];
  if (!videos.length) return;

  if (reduce) {
    /* reduced motion: nothing moves. A video without a poster would stay blank, so once it is near the screen it
       loads just enough to show its first frame. */
    videos.forEach((video) => {
      video.removeAttribute('autoplay');
      video.pause();
    });
    if (!('IntersectionObserver' in window)) return;
    const still = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target as HTMLVideoElement;
        still.unobserve(video);
        attach(video);
        video.preload = 'auto';
        const frame = () => {
          video.currentTime = 0.05;
        };
        if (video.readyState >= 2) frame();
        else video.addEventListener('loadeddata', frame, { once: true });
      }),
      { rootMargin: '250px 0px' },
    );
    videos.forEach((video) => still.observe(video));
    onCleanup(() => still.disconnect());
    return;
  }

  const timers = new Map<HTMLVideoElement, number>();
  const tries = new WeakMap<HTMLVideoElement, number>();
  const wanted = new WeakSet<HTMLVideoElement>();

  const start = (video: HTMLVideoElement) => {
    attach(video);
    if (video.preload !== 'auto') video.preload = 'auto';
    video.play().catch(() => {
      /* autoplay refused or the file is not ready: try again once the browser has data, a couple of times at most */
      const n = (tries.get(video) ?? 0) + 1;
      tries.set(video, n);
      if (n > 3 || !wanted.has(video)) return;
      window.clearTimeout(timers.get(video));
      timers.set(video, window.setTimeout(() => {
        if (!wanted.has(video)) return;
        if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) video.load();
        start(video);
      }, 800 * n));
    });
  };

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            wanted.add(video);
            tries.delete(video);
            start(video);
          } else {
            wanted.delete(video);
            window.clearTimeout(timers.get(video));
            video.pause();
          }
        }),
        { rootMargin: '250px 0px' },
      )
    : null;

  videos.forEach((video) => {
    if (observer) observer.observe(video);
    else start(video);
  });

  onCleanup(() => {
    observer?.disconnect();
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    videos.forEach((video) => video.pause());
  });
};

export const mountShell = () => {
  setPill(currentTab());
  refreshDates();

  const title = document.querySelector<HTMLElement>('#topTitle');
  const heading = document.body.dataset.heading ?? '';
  if (title && title.textContent !== heading) {
    if (reduce) title.textContent = heading;
    else
      gsap.to(title, {
        opacity: 0,
        y: -6,
        duration: 0.15,
        onComplete: () => {
          title.textContent = heading;
          gsap.fromTo(title, { y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' });
        },
      });
  }

  mountVideos();

  /* rows with a hover preview that follows the cursor */
  const preview = document.querySelector<HTMLElement>('.preview');
  const previewImg = preview?.querySelector('img');
  if (preview && previewImg && fine) {
    document.querySelectorAll<HTMLElement>('.services a').forEach((row) => {
      listen(row, 'mouseenter', () => {
        if (!row.dataset.img) return;
        previewImg.src = row.dataset.img;
        previewOn = true;
      });
      listen(row, 'mouseleave', () => {
        previewOn = false;
      });
    });
    onCleanup(() => {
      previewOn = false;
    });
  }

  /* links that are not filled in yet explain themselves instead of going nowhere */
  const tip = document.querySelector<HTMLElement>('#todoTip');
  document.querySelectorAll<HTMLElement>('[data-todo]').forEach((el) => {
    listen(
      el,
      'click',
      (event: Event) => {
        if (el.getAttribute('href')) return;
        event.preventDefault();
        if (!tip) return;
        tip.textContent = `${el.dataset.todo} coming soon`;
        tip.classList.add('on');
        clearTimeout((tip as any)._t);
        (tip as any)._t = setTimeout(() => tip.classList.remove('on'), 1600);
      },
      true,
    );
  });
};
