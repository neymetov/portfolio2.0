import { big, enter, fine, gsap, hoverCursor, listen, onCleanup, reduce, refresh, scrollToY, tilt } from './core';

export const init = () => {
  const wrap = document.querySelector<HTMLElement>('.w-filter');
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.w-filter button')];
  const indicator = wrap?.querySelector<HTMLElement>('.w-ind');
  const cards = [...document.querySelectorAll<HTMLElement>('.w-card')];
  const empty = document.querySelector<HTMLElement>('.w-empty');
  if (!wrap || !indicator || !empty || !buttons.length) return;

  const known = buttons.map((button) => button.dataset.filter!);
  const fromUrl = new URLSearchParams(location.search).get('category');
  let active = fromUrl && known.includes(fromUrl) ? fromUrl : 'All';
  const urlFor = (category: string) => (category === 'All' ? location.pathname : `?category=${encodeURIComponent(category)}`);

  const moveIndicator = () => {
    const button = buttons.find((item) => item.dataset.filter === active);
    if (!button || !button.offsetWidth) return;
    indicator.style.width = `${button.offsetWidth}px`;
    indicator.style.transform = `translateX(${button.offsetLeft - 4}px)`;
  };

  const setFilter = (category: string, instant = false) => {
    active = category;
    buttons.forEach((button) => {
      const on = button.dataset.filter === category;
      button.classList.toggle('on', on);
      button.setAttribute('aria-pressed', String(on));
    });
    moveIndicator();
    const matches = (card: HTMLElement) => category === 'All' || card.dataset.category === category;
    const show = cards.filter(matches);
    const hide = cards.filter((card) => !matches(card));
    const apply = () => {
      hide.forEach((card) => (card.hidden = true));
      show.forEach((card) => (card.hidden = false));
      empty.hidden = show.length > 0;
      refresh();
      if (!instant && !reduce) {
        gsap.fromTo(
          [...show, empty],
          { y: 30, opacity: 0, scale: 0.96, filter: 'blur(10px)' },
          { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out', stagger: 0.07, clearProps: 'filter,transform,opacity' },
        );
      }
    };
    const visible = cards.filter((card) => !card.hidden).concat(empty.hidden ? [] : [empty]);
    if (instant || reduce || !visible.length) return apply();
    gsap.to(visible, {
      y: -16,
      opacity: 0,
      scale: 0.97,
      filter: 'blur(10px)',
      duration: 0.28,
      ease: 'power2.in',
      stagger: 0.03,
      onComplete: () => {
        gsap.set(visible, { clearProps: 'all' });
        apply();
      },
    });
  };

  setFilter(active, true);
  history.replaceState(history.state, '', urlFor(active));
  document.querySelectorAll('video').forEach((video) => void video.play().catch(() => {}));

  buttons.forEach((button) =>
    listen(button, 'click', () => {
      if (button.dataset.filter === active) return;
      setFilter(button.dataset.filter!);
      history.replaceState(history.state, '', urlFor(button.dataset.filter!));
    }),
  );
  listen(window, 'resize', moveIndicator);

  /* on this page a service row only switches the filter and scrolls back up */
  document.querySelectorAll<HTMLAnchorElement>('.w-services a').forEach((row) =>
    listen(row, 'click', (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      const category = row.dataset.filter;
      if (category && known.includes(category) && category !== active) setFilter(category);
      if (category) history.replaceState(history.state, '', urlFor(active));
      scrollToY(0);
    }, true),
  );

  cards.forEach((card) => {
    const image = card.querySelector<HTMLElement>('.w-img');
    if (!image || !fine) return;
    tilt(card, image, 12);
    hoverCursor(card, 'open');
  });

  enter(document.querySelectorAll('.w-title, .w-filter, .w-card:not([hidden]), .w-services a'));
  onCleanup(() => big(false));
};
