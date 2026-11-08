import { createReader } from '@keystatic/core/reader';
import config from '/Users/neymetov/Desktop/Claude Projects/Portfolio 2.0/keystatic.config';
const reader = createReader('/Users/neymetov/Desktop/Claude Projects/Portfolio 2.0', config);
const site = await reader.singletons.site.read();
console.log('site:', site ? Object.keys(site).length + ' fields, experience photo=' + site.experience[0].photo + ', meetupPhotos=' + site.meetupPhotos.length + ', services=' + site.services.length : 'NULL');
for (const slug of await reader.collections.projects.list()) {
  const p = await reader.collections.projects.read(slug);
  console.log(slug, p ? 'ok cover=' + p.cover + ' landing=' + p.landing.discriminant + (p.landing.discriminant ? ' blocks=' + (p.landing.value as any).blocks.length : '') : 'NULL');
}
