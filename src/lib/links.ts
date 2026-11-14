export const telegramUrl = (username = '') => (username ? `https://t.me/${username.replace(/^@/, '')}` : '');
/** Accepts a ready wa.me link or just a phone number. */
export const whatsappUrl = (value = '') => (!value ? '' : /^https?:\/\//.test(value) ? value : `https://wa.me/${value.replace(/\D/g, '')}`);
