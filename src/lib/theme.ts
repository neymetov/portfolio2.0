export interface Theme {
  frame: string;
  frameInk: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  mode: 'dark' | 'light';
}

/** What the CMS stores: a ready-made look, or four colours picked by hand. */
export interface ThemeInput {
  discriminant: 'light' | 'dark' | 'custom';
  value?: { frame: string; bg: string; text: string; accent: string } | null;
}

const PRESETS = {
  light: { frame: '#ff62ed', bg: '#f9fafb', text: '#000000', accent: '#ff62ed' },
  dark: { frame: '#22222e', bg: '#0a0a0f', text: '#f3f3f5', accent: '#ff62ed' },
};

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
};
const hex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return hex(x.map((v, i) => v + (y[i] - v) * t) as Rgb);
};
const luminance = (color: string) => {
  const [r, g, b] = rgb(color).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Turns the four chosen colours into everything the case page needs. */
export const resolveTheme = (input: ThemeInput): Theme => {
  const base = input.discriminant === 'custom' && input.value ? input.value : PRESETS[input.discriminant === 'dark' ? 'dark' : 'light'];
  const mode = luminance(base.bg) < 0.4 ? 'dark' : 'light';
  const [r, g, b] = rgb(base.text);
  return {
    frame: base.frame,
    bg: base.bg,
    text: base.text,
    accent: base.accent,
    mode,
    surface: mode === 'dark' ? mix(base.bg, base.frame, 0.5) : mix(base.bg, base.text, 0.06),
    muted: `rgba(${r},${g},${b},.62)`,
    frameInk: contrast(base.text, base.frame) >= 4.5 ? base.text : luminance(base.frame) < 0.5 ? '#ffffff' : '#000000',
  };
};
