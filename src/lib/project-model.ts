import type { ThemeInput } from './theme';

export const categories = ['Branding', 'Print', 'Illustration'] as const;
export type Category = (typeof categories)[number];

export interface GalleryItem {
  image: string;
  video: string;
  alt: string;
  wide: boolean;
}

export type Block =
  | { discriminant: 'hero'; value: { video: string; poster: string; title: string; showSub?: boolean; sub: string } }
  | { discriminant: 'intro'; value: { text: string; meta: { label: string; value: string }[] } }
  | { discriminant: 'zoom'; value: { image: string; alt: string } }
  | { discriminant: 'pinned'; value: { title: string; video?: string; poster?: string; steps: { image?: string; heading: string; text: string }[] } }
  | { discriminant: 'fan'; value: { title: string; images: string[] } }
  | { discriminant: 'wide'; value: { image?: string; video?: string; alt: string; caption: string } }
  | { discriminant: 'text'; value: { text: string } }
  | { discriminant: 'reels'; value: { title: string; videos: { video: string; poster: string }[] } }
  | { discriminant: 'gallery'; value: { images: { image: string; alt: string }[] } };

export interface Project {
  slug: string;
  title: string;
  category: Category;
  order: number;
  summary: string;
  description: string;
  cover: string;
  shareImage?: string;
  coverVideo: string;
  gallery: GalleryItem[];
  landing: { discriminant: boolean; value: { theme: ThemeInput; blocks: Block[] } | null };
}

/** Pictures that peek out from behind the cover on the home page: the project's own images, in the order
 *  they appear on its page (landing blocks first, then the simple gallery), without the cover and without repeats. */
export const previewImages = (project: Project, limit = 2): string[] => {
  const found: string[] = [];
  const blocks = project.landing.discriminant ? project.landing.value?.blocks ?? [] : [];
  for (const block of blocks) {
    if (block.discriminant === 'hero') found.push(block.value.poster);
    else if (block.discriminant === 'zoom' || block.discriminant === 'wide') found.push(block.value.image ?? '');
    else if (block.discriminant === 'pinned') found.push(block.value.poster ?? '', ...block.value.steps.map((step) => step.image ?? ''));
    else if (block.discriminant === 'fan') found.push(...block.value.images);
    else if (block.discriminant === 'reels') found.push(...block.value.videos.map((item) => item.poster));
    else if (block.discriminant === 'gallery') found.push(...block.value.images.map((item) => item.image));
  }
  found.push(...project.gallery.map((item) => item.image));
  const seen = new Set<string>([project.cover]);
  return found.filter((src) => src && !seen.has(src) && seen.add(src) && !/\.(gif|mp4|webm|mov)$/i.test(src)).slice(0, limit);
};

/** The project shown after `slug` in the list (wrapping around). `undefined` when the slug is unknown or there is
 *  no other project to go to, so a page never links to itself or to an arbitrary first project. */
export const nextProjectIn = <T extends { slug: string }>(list: readonly T[], slug: string): T | undefined => {
  const index = list.findIndex((project) => project.slug === slug);
  if (index === -1 || list.length < 2) return undefined;
  return list[(index + 1) % list.length];
};
