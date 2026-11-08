import data from '../content/site.json';

/** Keystatic leaves empty fields out of the JSON when saving, so everything it may omit is optional here. */
type Raw = typeof data;
interface Site extends Omit<Raw, 'cv' | 'whatsapp' | 'telegram' | 'socials' | 'whatsappChat' | 'telegramChat'> {
  cv?: string;
  whatsapp?: string;
  telegram?: string;
  socials: { label: string; url?: string }[];
  whatsappChat: { outgoing: string; outgoingTime: string; incoming: string; incomingTime: string };
  telegramChat: { outgoing: string; outgoingTime: string; incoming: string; incomingTime: string };
}

const site = data as unknown as Site;

export default site;

export const telegramUrl = (username = '') => (username ? `https://t.me/${username.replace(/^@/, '')}` : '');
export const whatsappUrl = (number = '') => (number ? `https://wa.me/${number.replace(/\D/g, '')}` : '');
