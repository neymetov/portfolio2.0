import { collection, config, fields, singleton } from '@keystatic/core';

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

const colour = (label: string, description?: string) => fields.text({ label, description });

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
            text: fields.text({ label: 'Details (period, location)', multiline: true }),
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
        ctaTitle: fields.text({ label: 'Closing block title' }),
        ctaText: fields.text({ label: 'Closing block text' }),
        contactTitle: fields.text({ label: 'Contacts headline' }),
        contactAccent: fields.text({ label: 'Contacts headline accent (pink)' }),
        contactText: fields.text({ label: 'Contacts text', multiline: true }),
        contactEmail: fields.text({ label: 'Contact email' }),
        whatsapp: fields.text({ label: 'WhatsApp number', description: 'Digits with country code, e.g. 994501234567' }),
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
                theme: fields.object(
                  {
                    frame: colour('Frame colour', 'Colour of the frame and top bar, e.g. #20346d'),
                    frameInk: colour('Frame text colour'),
                    bg: colour('Page background'),
                    surface: colour('Card / tile background'),
                    text: colour('Text colour'),
                    muted: colour('Muted text colour'),
                    accent: colour('Accent colour'),
                    mode: fields.select({
                      label: 'Mode',
                      defaultValue: 'dark',
                      options: [
                        { label: 'Dark', value: 'dark' },
                        { label: 'Light', value: 'light' },
                      ],
                    }),
                  },
                  { label: 'Theme' },
                ),
                blocks: fields.blocks(
                  {
                    hero: {
                      label: 'Hero (video or image)',
                      schema: fields.object({
                        video: video('Video (mp4)'),
                        poster: image('Poster / image'),
                        kicker: fields.text({ label: 'Kicker' }),
                        title: fields.text({ label: 'Title' }),
                        sub: fields.text({ label: 'Subtitle' }),
                      }),
                    },
                    intro: {
                      label: 'Intro (statement + facts)',
                      schema: fields.object({
                        text: fields.text({ label: 'Statement', multiline: true }),
                        meta: fields.array(
                          fields.object({ label: fields.text({ label: 'Label' }), value: fields.text({ label: 'Value' }) }),
                          { label: 'Facts', itemLabel: (props) => props.fields.label.value || 'Fact' },
                        ),
                      }),
                    },
                    zoom: {
                      label: 'Zoom image',
                      schema: fields.object({
                        image: image('Image'),
                        alt: fields.text({ label: 'Alt text' }),
                        caption: fields.text({ label: 'Caption' }),
                      }),
                    },
                    palette: {
                      label: 'Colour and type',
                      schema: fields.object({
                        title: fields.text({ label: 'Title' }),
                        colors: fields.array(
                          fields.object({ name: fields.text({ label: 'Name' }), hex: fields.text({ label: 'Hex' }) }),
                          { label: 'Colours', itemLabel: (props) => props.fields.name.value || 'Colour' },
                        ),
                        specimen: fields.array(fields.text({ label: 'Line' }), {
                          label: 'Type specimen (4 lines: caps, caps, script word, caps)',
                          itemLabel: (props) => props.value || 'Line',
                        }),
                      }),
                    },
                    pinned: {
                      label: 'Pinned phone with steps',
                      schema: fields.object({
                        title: fields.text({ label: 'Title' }),
                        steps: fields.array(
                          fields.object({
                            image: image('Screen'),
                            heading: fields.text({ label: 'Heading' }),
                            text: fields.text({ label: 'Text', multiline: true }),
                          }),
                          { label: 'Steps', itemLabel: (props) => props.fields.heading.value || 'Step' },
                        ),
                      }),
                    },
                    stories: {
                      label: 'Story fan',
                      schema: fields.object({
                        title: fields.text({ label: 'Title' }),
                        images: fields.array(image('Story'), { label: 'Stories (9:16)', itemLabel: () => 'Story' }),
                      }),
                    },
                    wide: {
                      label: 'Wide image',
                      schema: fields.object({
                        image: image('Image'),
                        alt: fields.text({ label: 'Alt text' }),
                        caption: fields.text({ label: 'Caption' }),
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
