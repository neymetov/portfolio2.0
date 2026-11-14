import assert from 'node:assert/strict';
import { test } from 'node:test';
import { yearsSince } from '../src/lib/years';
import { telegramUrl, whatsappUrl } from '../src/lib/links';
import { shortText } from '../src/lib/share';
import { nextProjectIn, previewImages, type Project } from '../src/lib/project-model';

test('yearsSince counts whole years from the anniversary', () => {
  assert.equal(yearsSince('2013-09-01', new Date('2026-08-31')), 12);
  assert.equal(yearsSince('2013-09-01', new Date('2026-09-01')), 13);
  assert.equal(yearsSince('2013-09-01', new Date('2026-11-14')), 13);
  assert.equal(yearsSince('2013', new Date('2026-01-01')), 13); // month and day default to January 1st
  assert.equal(yearsSince('2030-01-01', new Date('2026-01-01')), 0); // never negative
});

test('telegramUrl builds a t.me link from a username', () => {
  assert.equal(telegramUrl('neymetov'), 'https://t.me/neymetov');
  assert.equal(telegramUrl('@neymetov'), 'https://t.me/neymetov');
  assert.equal(telegramUrl(''), '');
  assert.equal(telegramUrl(), '');
});

test('whatsappUrl accepts a ready link or a phone number', () => {
  assert.equal(whatsappUrl('https://wa.me/neymetov?s=p'), 'https://wa.me/neymetov?s=p');
  assert.equal(whatsappUrl('+994 50 123-45-67'), 'https://wa.me/994501234567');
  assert.equal(whatsappUrl(''), '');
  assert.equal(whatsappUrl(), '');
});

test('shortText cleans, collapses and trims at a word boundary', () => {
  assert.equal(shortText('  Hello \n\n  world  '), 'Hello world');
  assert.equal(shortText('a​b'), 'ab'); // invisible characters are removed
  const long = 'word '.repeat(80);
  const out = shortText(long, 60);
  assert.ok(out.length <= 60, `too long: ${out.length}`);
  assert.ok(out.endsWith('…'));
  assert.ok(!/\s…$/.test(out));
  assert.equal(shortText('short text', 160), 'short text');
});

const project = (over: Partial<Project> = {}): Project => ({
  slug: 'p', title: 'P', category: 'Branding', order: 1, summary: '', description: '',
  cover: '/cover.webp', coverVideo: '', gallery: [], landing: { discriminant: false, value: null },
  ...over,
});

test('previewImages: landing images first, then the gallery, no cover, no repeats, no gif or video', () => {
  const p = project({
    gallery: [{ image: '/g1.webp', video: '', alt: '', wide: false }, { image: '/cover.webp', video: '', alt: '', wide: false }],
    landing: {
      discriminant: true,
      value: {
        theme: { discriminant: 'dark', value: null } as never,
        blocks: [
          { discriminant: 'hero', value: { video: '', poster: '/hero.webp', title: 't', sub: '' } },
          { discriminant: 'zoom', value: { image: '/hero.webp', alt: '' } }, // repeat
          { discriminant: 'wide', value: { video: '/clip.mp4', alt: '', caption: '' } }, // no image
          { discriminant: 'fan', value: { title: '', images: ['/anim.gif', '/f1.webp', '/f2.webp'] } },
        ],
      },
    },
  });
  assert.deepEqual(previewImages(p), ['/hero.webp', '/f1.webp']);
  assert.deepEqual(previewImages(p, 3), ['/hero.webp', '/f1.webp', '/f2.webp']);
  assert.deepEqual(previewImages(project()), []);
});

test('nextProjectIn wraps around and is explicit about unknown slugs', () => {
  const list = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
  assert.equal(nextProjectIn(list, 'a')?.slug, 'b');
  assert.equal(nextProjectIn(list, 'c')?.slug, 'a'); // wraps
  assert.equal(nextProjectIn(list, 'nope'), undefined); // not the first project by accident
  assert.equal(nextProjectIn([{ slug: 'only' }], 'only'), undefined); // never links to itself
  assert.equal(nextProjectIn([], 'a'), undefined);
});
