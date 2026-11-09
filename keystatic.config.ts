import { collection, config, fields, singleton } from '@keystatic/core';
import { colour } from './src/keystatic/colour';

const cloudProject = import.meta.env.PUBLIC_KEYSTATIC_CLOUD_PROJECT;

const categories = [
  { label: 'Branding', value: 'Branding' },
  { label: 'Packaging', value: 'Packaging' },
  { label: 'Illustration', value: 'Illustration' },
] as const;

const image = (label: string, directory = 'public/images/projects', publicPath = '/images/projects/') =>
  fields.image({ label, directory, publicPath });

const siteImage = (label: string) => image(label, 'public/images/site', '/images/site/');

const video = (label: string) => fields.file({ label, directory: 'public/images/projects', publicPath: '/images/projects/' });

const chat = (label: string) =>
  fields.object(
    {
      outgoing: fields.text({ label: 'Visitor message', multiline: true }),
      outgoingTime: fields.text({ label: 'Visitor message time' }),
      incoming: fields.text({ label: 'Your reply', multiline: true }),
      incomingTime: fields.text({ label: 'Your reply time' }),
    },
    { label },
  );

const required = { validation: { isRequired: true } } as const;

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
        careerStart: fields.date({
          label: 'Career start',
          description: 'The "years of experience" number is counted from this date and grows by itself every year.',
          defaultValue: '2013-09-01',
          validation: { isRequired: true },
        }),
        cv: fields.file({
          label: 'CV file (PDF)',
          description: 'The "Download CV" button stays a "coming soon" hint until a file is uploaded.',
          directory: 'public/cv',
          publicPath: '/cv/',
        }),
        stories: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            text: fields.text({ label: 'Text', multiline: true }),
            art: fields.select({
              label: 'Animated illustration',
              defaultValue: 'knight',
              options: [
                { label: 'Knight', value: 'knight' },
                { label: 'Bridge', value: 'bridge' },
                { label: 'Folder', value: 'folder' },
                { label: 'Compass', value: 'compass' },
              ],
            }),
          }),
          { label: 'Story cards (ring)', itemLabel: (props) => props.fields.title.value || 'Card' },
        ),
        experience: fields.array(
          fields.object({
            year: fields.text({ label: 'Year' }),
            company: fields.text({ label: 'Company' }),
            role: fields.text({ label: 'Role' }),
            text: fields.text({ label: 'Period', description: 'e.g. Jul 2020 – Nov 2023 · 3 yrs 5 mos', multiline: true }),
            photo: siteImage('Logo'),
            color: fields.text({ label: 'Brand color (hex)', description: 'Colour of the timeline while this job is active, e.g. #0704d7' }),
          }),
          { label: 'Experience', itemLabel: (props) => props.fields.company.value || 'Company' },
        ),
        meetupText: fields.text({ label: 'Meetups description', multiline: true }),
        meetupPhotos: fields.array(siteImage('Photo'), {
          label: 'Meetups photos (5 work best)',
          itemLabel: () => 'Photo',
        }),
        services: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            category: fields.select({
              label: 'Opens works filter',
              defaultValue: 'Branding',
              options: [...categories],
            }),
            image: siteImage('Hover preview'),
          }),
          { label: 'Services', itemLabel: (props) => props.fields.title.value || 'Service' },
        ),
        showCta: fields.checkbox({ label: 'Show the closing block ("Let\'s build it together")', description: 'The coloured panel with a button to Contacts, above the footer on the About page. Off by default.', defaultValue: false }),
        ctaTitle: fields.text({ label: 'Closing block title' }),
        contactTitle: fields.text({ label: 'Contacts headline' }),
        contactAccent: fields.text({ label: 'Contacts headline accent (pink)' }),
        contactText: fields.text({ label: 'Contacts text', multiline: true }),
        whatsapp: fields.text({ label: 'WhatsApp link or number', description: 'A full link, e.g. https://wa.me/username, or digits with country code, e.g. 994501234567' }),
        telegram: fields.text({ label: 'Telegram username', description: 'Without @' }),
        whatsappChat: chat('WhatsApp chat preview'),
        telegramChat: chat('Telegram chat preview'),
        socials: fields.array(
          fields.object({
            label: fields.text({ label: 'Network' }),
            url: fields.text({ label: 'URL' }),
          }),
          { label: 'Social networks', itemLabel: (props) => props.fields.label.value || 'Network' },
        ),
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
        category: fields.select({ label: 'Category', defaultValue: 'Branding', options: [...categories] }),
        order: fields.integer({ label: 'Order', defaultValue: 1 }),
        summary: fields.text({ label: 'Short description (cards)', multiline: true }),
        description: fields.text({ label: 'Description (case page)', multiline: true }),
        featured: fields.checkbox({ label: 'Show in "some big projects" on About', defaultValue: false }),
        cover: image('Cover image'),
        shareImage: fields.image({
          label: 'Share image (link preview)',
          description: 'Shown when the project link is sent in a messenger or social network. 1200 × 630 JPG or WebP under 1 MB works best. If empty, the cover or hero image is used (GIFs and very large files are skipped).',
          directory: 'public/images/projects',
          publicPath: '/images/projects/',
        }),
        coverVideo: video('Cover video (mp4, optional: replaces the image on /works)'),
        gallery: fields.array(
          fields.object({
            image: image('Image'),
            video: video('Video (mp4, optional)'),
            alt: fields.text({ label: 'Alt text' }),
            wide: fields.checkbox({ label: 'Full width (16:9)', defaultValue: false }),
          }),
          { label: 'Gallery (simple case template)', itemLabel: (props) => props.fields.alt.value || 'Image' },
        ),
        landing: fields.conditional(
          fields.checkbox({ label: 'Use the landing layout (theme + blocks)', defaultValue: false }),
          {
            false: fields.empty(),
            true: fields.object(
              {
                theme: fields.conditional(
                  fields.select({
                    label: 'Page colours',
                    description: 'Pick a ready-made look or choose four colours by hand. Everything else is derived from them.',
                    defaultValue: 'dark',
                    options: [
                      { label: 'Light', value: 'light' },
                      { label: 'Dark', value: 'dark' },
                      { label: 'Custom colours', value: 'custom' },
                    ],
                  }),
                  {
                    light: fields.empty(),
                    dark: fields.empty(),
                    custom: fields.object(
                      {
                        frame: colour({ label: 'Frame and top bar', defaultValue: '#20346d', description: 'The border around the page and the title bar.' }),
                        bg: colour({ label: 'Page background', defaultValue: '#0d1733' }),
                        text: colour({ label: 'Text', defaultValue: '#f3ede6' }),
                        accent: colour({ label: 'Accent', defaultValue: '#d1b29f', description: 'Links, numbers and the next-project arrow.' }),
                      },
                      { label: 'Custom colours' },
                    ),
                  },
                ),
                blocks: fields.blocks(
                  {
                    hero: {
                      label: 'Hero (video or image)',
                      schema: fields.object({
                        video: fields.file({ label: 'Video (mp4)', description: 'Best at 1920 × 1080. The hero always fits the width of the page and takes the proportions of this file.', directory: 'public/images/projects', publicPath: '/images/projects/' }),
                        poster: fields.image({ label: 'Poster / image', description: 'Best at 1920 × 1080. Used as the hero when there is no video.', directory: 'public/images/projects', publicPath: '/images/projects/' }),
                        title: fields.text({ label: 'Title', ...required }),
                        showSub: fields.checkbox({ label: 'Show description', defaultValue: true }),
                        sub: fields.text({ label: 'Description' }),
                      }),
                    },
                    intro: {
                      label: 'Intro (statement + facts)',
                      schema: fields.object({
                        text: fields.text({ label: 'Statement', multiline: true, ...required }),
                        meta: fields.array(
                          fields.object({ label: fields.text({ label: 'Label' }), value: fields.text({ label: 'Value' }) }),
                          { label: 'Facts', itemLabel: (props) => props.fields.label.value || 'Fact', validation: { length: { max: 4 } }, description: 'Up to four: client, scope, role, year.' },
                        ),
                      }),
                    },
                    zoom: {
                      label: 'Zoom image',
                      schema: fields.object({
                        image: fields.image({ label: 'Image', directory: 'public/images/projects', publicPath: '/images/projects/', validation: { isRequired: true } }),
                        alt: fields.text({ label: 'Alt text' }),
                      }),
                    },
                    pinned: {
                      label: 'Pinned image with steps',
                      schema: fields.object({
                        title: fields.text({ label: 'Title' }),
                        steps: fields.array(
                          fields.object({
                            image: image('Image (shown in a square, any picture)'),
                            heading: fields.text({ label: 'Heading', ...required }),
                            text: fields.text({ label: 'Text', multiline: true }),
                          }),
                          { label: 'Steps', itemLabel: (props) => props.fields.heading.value || 'Step', validation: { length: { min: 1 } } },
                        ),
                      }),
                    },
                    fan: {
                      label: 'Image fan',
                      schema: fields.object({
                        title: fields.text({ label: 'Title' }),
                        images: fields.array(image('Image'), { label: 'Images (any format)', itemLabel: () => 'Image', validation: { length: { min: 1 } } }),
                      }),
                    },
                    wide: {
                      label: 'Wide image',
                      schema: fields.object({
                        image: fields.image({ label: 'Image', directory: 'public/images/projects', publicPath: '/images/projects/', validation: { isRequired: true } }),
                        alt: fields.text({ label: 'Alt text' }),
                        caption: fields.text({ label: 'Caption' }),
                      }),
                    },
                    gallery: {
                      label: 'Image gallery',
                      schema: fields.object({
                        images: fields.array(
                          fields.object({
                            image: fields.image({ label: 'Image', directory: 'public/images/projects', publicPath: '/images/projects/', validation: { isRequired: true } }),
                            alt: fields.text({ label: 'Alt text' }),
                          }),
                          {
                            label: 'Images',
                            description: 'Two columns: 2 images make one row side by side, 4 make a 2 × 2 grid, 6 make 2 × 3.',
                            itemLabel: (props) => props.fields.alt.value || 'Image',
                            validation: { length: { min: 2, max: 6 } },
                          },
                        ),
                      }),
                    },
                  },
                  { label: 'Blocks' },
                ),
              },
              { label: 'Landing' },
            ),
          },
        ),
      },
    }),
  },
});
