import { collection, config, fields, singleton } from '@keystatic/core';

const cloudProject = import.meta.env.PUBLIC_KEYSTATIC_CLOUD_PROJECT;

const categories = [
  { label: 'Branding', value: 'Branding' },
  { label: 'Packaging', value: 'Packaging' },
  { label: 'Illustration', value: 'Illustration' },
] as const;

const projectImage = (label: string) =>
  fields.image({ label, directory: 'public/images/projects', publicPath: '/images/projects/' });

export default config({
  storage: cloudProject ? { kind: 'cloud' } : { kind: 'local' },
  ...(cloudProject ? { cloud: { project: cloudProject } } : {}),
  ui: {
    brand: { name: 'Elshan Neymatov' },
    navigation: {
      Content: ['site', 'projects'],
    },
  },
  singletons: {
    site: singleton({
      label: 'Site content',
      path: 'src/content/site',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Name' }),
        heroLead: fields.text({ label: 'Hero statement', multiline: true }),
        heroAccent: fields.text({ label: 'Hero accent (pink)' }),
        years: fields.integer({ label: 'Years of experience' }),
        stories: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            text: fields.text({ label: 'Text', multiline: true }),
            art: fields.select({
              label: 'Animated illustration',
              defaultValue: 'none',
              options: [
                { label: 'None (use image)', value: 'none' },
                { label: 'Knight', value: 'knight' },
                { label: 'Bridge', value: 'bridge' },
                { label: 'Folder', value: 'folder' },
                { label: 'Compass', value: 'compass' },
              ],
            }),
            image: fields.image({ label: 'Static image (when no animation)', directory: 'public/images/stories', publicPath: '/images/stories/' }),
          }),
          { label: 'Story cards (fan)', itemLabel: (props) => props.fields.title.value || 'Card' },
        ),
        experience: fields.array(
          fields.object({
            year: fields.text({ label: 'Year' }),
            company: fields.text({ label: 'Company' }),
            role: fields.text({ label: 'Role' }),
            text: fields.text({ label: 'Details (period, location)', multiline: true }),
            photo: projectImage('Photo or logo (empty = portrait)'),
            color: fields.text({ label: 'Brand color (hex)', description: 'Colour of the plate while this job is active, e.g. #0704d7' }),
          }),
          { label: 'Experience', itemLabel: (props) => props.fields.year.value || 'Year' },
        ),
        meetupText: fields.text({ label: 'Meetups description', multiline: true }),
        services: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            category: fields.select({
              label: 'Opens works filter',
              defaultValue: 'all',
              options: [{ label: 'All works', value: 'all' }, ...categories],
            }),
          }),
          { label: 'Services', itemLabel: (props) => props.fields.title.value || 'Service' },
        ),
        contactTitle: fields.text({ label: 'Contacts title' }),
        contactPrompt: fields.text({ label: 'Message placeholder' }),
        contactEmail: fields.text({ label: 'Contact email' }),
      },
    }),
  },
  collections: {
    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'title',
      format: { data: 'json' },
      columns: ['title', 'category', 'order'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        subtitle: fields.text({ label: 'Case headline' }),
        category: fields.select({ label: 'Category', defaultValue: 'Branding', options: [...categories] }),
        order: fields.integer({ label: 'Order', defaultValue: 1 }),
        summary: fields.text({ label: 'Short description (cards)', multiline: true }),
        description: fields.text({ label: 'Description (case page)', multiline: true }),
        featured: fields.checkbox({ label: 'Show in "some big projects" on About', defaultValue: false }),
        emblem: projectImage('Emblem (featured block)'),
        cover: projectImage('Cover image'),
        gallery: fields.array(projectImage('Image'), { label: 'Gallery', itemLabel: () => 'Image' }),
        galleryNote: fields.text({ label: 'Caption between gallery images', multiline: true }),
      },
    }),
  },
});
