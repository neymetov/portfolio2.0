import data from '../data/site.json';

/** Keystatic leaves empty fields out of the JSON when saving, so everything it may omit is optional here. */
type Raw = typeof data;
interface Site extends Omit<Raw, 'featuredProjects' | 'cv' | 'whatsapp' | 'telegram' | 'socials' | 'whatsappChat' | 'telegramChat'> {
  featuredProjects?: string[];
  cv?: string;
  whatsapp?: string;
  telegram?: string;
  socials: { label: string; url?: string }[];
  whatsappChat: { outgoing: string; outgoingTime: string; incoming: string; incomingTime: string };
  telegramChat: { outgoing: string; outgoingTime: string; incoming: string; incomingTime: string };
}

const site = data as unknown as Site;

export default site;

export { telegramUrl, whatsappUrl } from './links';
