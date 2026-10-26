export const categories = ['Branding', 'Packaging', 'Illustration'] as const;
export type Category = (typeof categories)[number];

export const placeholderImage = '/images/figma/work-image.png';

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  order: number;
  summary: string;
  description: string;
  featured: boolean;
  emblem: string;
  cover: string;
  gallery: string[];
  galleryNote: string;
}

const modules = import.meta.glob<Partial<Omit<Project, 'slug'>>>('../content/projects/*.json', {
  eager: true,
  import: 'default',
});

export const projects: Project[] = Object.entries(modules)
  .map(([path, data]) => ({
    slug: path.split('/').pop()!.replace('.json', ''),
    title: '',
    subtitle: '',
    category: 'Branding' as Category,
    order: 0,
    summary: '',
    description: '',
    featured: false,
    emblem: '',
    cover: '',
    gallery: [],
    galleryNote: '',
    ...data,
  }))
  .sort((a, b) => Number(a.order) - Number(b.order));

export const featuredProjects = projects.filter((project) => project.featured);
