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
  return page === 'case' ? 'works' : page || 'about';
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

export const mountShell = () => {
  setPill(currentTab());

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

  /* rows with a hover preview that follows the cursor */
  const preview = document.querySelector<HTMLElement>('.preview');
  const previewImg = preview?.querySelector('img');
  if (preview && previewImg && fine) {
    document.querySelectorAll<HTMLElement>('.services a').forEach((row) => {
      listen(row, 'mouseenter', () => {
        if (row.dataset.img) previewImg.src = row.dataset.img;
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
