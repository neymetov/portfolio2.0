import site from '../content/site.json';

export default site;

export const telegramUrl = (username: string) => (username ? `https://t.me/${username.replace(/^@/, '')}` : '');
export const whatsappUrl = (number: string) => (number ? `https://wa.me/${number.replace(/\D/g, '')}` : '');
