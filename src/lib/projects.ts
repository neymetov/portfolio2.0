import { nextProjectIn, type Category, type Project } from './project-model';

export * from './project-model';

const modules = import.meta.glob<Partial<Omit<Project, 'slug'>>>('../data/projects/*.json', {
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
    cover: '',
    coverVideo: '',
    gallery: [],
    landing: { discriminant: false, value: null },
    ...data,
  }))
  .sort((a, b) => Number(a.order) - Number(b.order));

export const nextProject = (slug: string) => nextProjectIn(projects, slug);
