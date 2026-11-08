import { enter, fine, hoverCursor, tilt } from './core';

export const init = () => {
  const view = document.querySelector<HTMLElement>('.contacts-view');
  if (!view) return;

  /* the two chat bubbles appear one after the other */
  view.classList.remove('on');
  requestAnimationFrame(() => requestAnimationFrame(() => view.classList.add('on')));

  enter(view.querySelectorAll('.c-head > *, .c-card, .c-social > *'));

  if (fine) {
    view.querySelectorAll<HTMLElement>('.c-card').forEach((card) => {
      const face = card.querySelector<HTMLElement>('.c-face');
      if (!face) return;
      tilt(card, face, 12);
      hoverCursor(card, 'write');
    });
  }
};
