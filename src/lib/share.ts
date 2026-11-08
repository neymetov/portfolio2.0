import type { Project } from './projects';

/** The image shown in link previews when a project has no picture that suits one. */
export const DEFAULT_SHARE_IMAGE = '/og-default.jpg';

const MAX_BYTES = 1_500_000;

/** Messengers show a still frame of a GIF at best and skip very heavy files, so those are not offered as previews. */
const suitable = async (path: string) => {
  if (!path || /\.(gif|mp4|mov|webm)$/i.test(path)) return false;
  try {
    const [{ stat }, { join }] = await Promise.all([import('node:fs/promises'), import('node:path')]);
    const size = (await stat(join(process.cwd(), 'public', path))).size;
    return size <= MAX_BYTES;
  } catch {
    return true; // cannot inspect the file: trust it
  }
};

/** Share image first, then the cover, then the landing hero, then the first gallery image, then the site default. */
export const shareImageFor = async (project: Project) => {
  const hero = project.landing.value?.blocks.find((block) => block.discriminant === 'hero');
  const candidates = [
    project.shareImage,
    project.cover,
    hero && hero.discriminant === 'hero' ? hero.value.poster : '',
    project.gallery[0]?.image,
  ];
  for (const candidate of candidates) {
    if (candidate && (await suitable(candidate))) return candidate;
  }
  return DEFAULT_SHARE_IMAGE;
};

/** A short, clean line for link previews: no invisible characters, at most ~160 characters. */
export const shortText = (text: string, max = 160) => {
  const clean = text.replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[.,;:\s]+$/, '')}…`;
};
