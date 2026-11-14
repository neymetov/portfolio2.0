import { onCleanup, scrollKit } from './core';

/* Shared behaviour of the two dialogs (the image viewer on case pages and the story sheet on About):
   focus moves into the dialog and stays there, the page behind it is inert and does not scroll, Escape closes it,
   and focus goes back to whatever opened it. */

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let release: (() => void) | null = null;

/** Makes `box` a modal dialog. Returns the function that closes the modal behaviour (it is also called on page leave). */
export const openModal = (box: HTMLElement, onClose: () => void, firstFocus?: HTMLElement | null) => {
  release?.();

  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  box.setAttribute('aria-modal', 'true');

  /* everything else on the page is unreachable while the dialog is open */
  const inerted: Element[] = [];
  [...document.body.children].forEach((el) => {
    if (el === box || el.contains(box) || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;
    el.setAttribute('inert', '');
    inerted.push(el);
  });

  document.documentElement.classList.add('modal-open');
  scrollKit.current?.lenis?.stop();

  const focusables = () => [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hidden && el.getClientRects().length > 0);
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0], last = items[items.length - 1];
    const current = document.activeElement as HTMLElement | null;
    if (event.shiftKey && (current === first || !box.contains(current))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (current === last || !box.contains(current))) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', keys, true);

  /* the dialog fades in from hidden: move focus once it is laid out */
  requestAnimationFrame(() => (firstFocus ?? focusables()[0] ?? box).focus({ preventScroll: true }));

  const me = () => {
    if (release !== me) return;
    release = null;
    document.removeEventListener('keydown', keys, true);
    inerted.forEach((el) => el.removeAttribute('inert'));
    document.documentElement.classList.remove('modal-open');
    scrollKit.current?.lenis?.start();
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  };
  release = me;
  onCleanup(me);
  return me;
};

/** Stops a video and frees its file, so a closed dialog does not keep downloading or playing it. */
export const freeVideo = (video: HTMLVideoElement) => {
  video.pause();
  video.removeAttribute('src');
  video.load();
};
