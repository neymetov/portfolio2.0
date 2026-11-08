import type { ThemeInput } from './theme';

export const categories = ['Branding', 'Packaging', 'Illustration'] as const;
export type Category = (typeof categories)[number];

export interface GalleryItem {
  image: string;
  video: string;
  alt: string;
  wide: boolean;
}

export type Block =
  | { discriminant: 'hero'; value: { video: string; poster: string; kicker: string; title: string; sub: string } }
  | { discriminant: 'intro'; value: { text: string; meta: { label: string; value: string }[] } }
  | { discriminant: 'zoom'; value: { image: string; alt: string; caption: string } }
  | { discriminant: 'palette'; value: { title: string; colors: { name: string; hex: string }[]; specimen: string[] } }
  | { discriminant: 'pinned'; value: { title: string; steps: { image: string; heading: string; text: string }[] } }
  | { discriminant: 'stories'; value: { title: string; images: string[] } }
  | { discriminant: 'wide'; value: { image: string; alt: string; caption: string } };

export interface Project {
  slug: string;
  title: string;
  category: Category;
  order: number;
  summary: string;
  description: string;
  featured: boolean;
  cover: string;
  coverVideo: string;
  gallery: GalleryItem[];
  landing: { discriminant: boolean; value: { theme: ThemeInput; blocks: Block[] } | null };
}

const modules = import.meta.glob<Partial<Omit<Project, 'slug'>>>('../content/projects/*.json', {
  eager: true,
  import: 'default',
});

export const projects: Project[] = Object.entries(modules)
  .map(([path, data]) => ({
    slug: path.split('/').pop()!.replace('.json', ''),
    title: '',
    category: 'Branding' as Category,
    order: 0,
    summary: '',
    description: '',
    featured: false,
    cover: '',
    coverVideo: '',
    gallery: [],
    landing: { discriminant: false, value: null },
    ...data,
  }))
  .sort((a, b) => Number(a.order) - Number(b.order));

export const featuredProjects = projects.filter((project) => project.featured).slice(0, 2);

export const nextProject = (slug: string) => {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
};
