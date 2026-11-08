import {
  CanvasTexture,
  Color,
  ColorManagement,
  DoubleSide,
  LinearFilter,
  LinearSRGBColorSpace,
  Group,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { ScrollTrigger, fine, gsap, lenis, reduce } from './core';

/* The story cards sit on the inside of a cylinder. Each card is painted into a 2D canvas (same layout as the
   mobile story card) and used as a texture; a post pass adds the prismatic blur toward the left and right edges. */

interface Story {
  title: string;
  text: string;
  art: 'knight' | 'bridge' | 'folder' | 'compass';
}

const ARTS = ['knight', 'bridge', 'folder', 'compass'] as const;
const ASSETS = '/images/site';

const CARD_W = 255, CARD_H = 380, PAD = 18, K = 2.6;
const TW = Math.round((CARD_W + PAD * 2) * K), TH = Math.round((CARD_H + PAD * 2) * K);
const UNIT = 3.0 / CARD_W; /* world units per css px */
const PW = (CARD_W + PAD * 2) * UNIT, PH = (CARD_H + PAD * 2) * UNIT;
const R = 9, N = 16, STEP = (Math.PI * 2) / N, TAU = Math.PI * 2;
const PINK = '#ff62ed';
const CARD_R = 0; /* corner radius of the story cards, in css px */
const BG = 0xf9fafb;

/* ---- easing (the same curves the CSS animations use) ---- */
const bez = (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
    const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
    u = Math.min(1, Math.max(0, u));
  }
  return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
};
const E = { ease: bez(0.25, 0.1, 0.25, 1), out: bez(0, 0, 0.58, 1), in: bez(0.42, 0, 1, 1), inout: bez(0.42, 0, 0.58, 1), spring: bez(0.34, 1.56, 0.64, 1) };
const prog = (t: number, delay: number, dur: number, fn: (p: number) => number) => fn(Math.min(1, Math.max(0, (t - delay) / dur)));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const loadImg = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const CURVE = 'M1.10651 13.1474C28.1065 -16.3526 57.6065 17.6474 31.6065 33.1473C0.511806 51.6844 0.606509 74.6474 17.1065 78.6474C28.8778 81.501 38.6099 72.6473 40.3582 62.1473C42.1065 51.6473 47.5768 46.6474 60.6068 46.6474';
const curvePath = new Path2D(CURVE);
let curveLen = 140;
{
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', CURVE);
  svg.appendChild(path);
  svg.style.cssText = 'position:absolute;width:0;height:0';
  document.body.appendChild(svg);
  try {
    curveLen = path.getTotalLength();
  } catch {
    /* keep the estimate */
  }
  svg.remove();
}

const wrap = (x: CanvasRenderingContext2D, text: string, maxW: number) => {
  const lines: string[] = [];
  let line = '';
  text.split(' ').forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (x.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  });
  if (line) lines.push(line);
  return lines;
};

type Images = Record<string, HTMLImageElement | null>;

/* one card frame; t = seconds since the card became active (Infinity = settled) */
const drawCard = (x: CanvasRenderingContext2D, A: Images, story: Story, t: number, k = K) => {
  const type = Math.max(0, ARTS.indexOf(story.art));
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, x.canvas.width, x.canvas.height);
  x.setTransform(k, 0, 0, k, PAD * k, PAD * k);
  x.save();
  x.shadowColor = 'rgba(140,150,165,.22)';
  x.shadowBlur = 24 * k;
  x.shadowOffsetY = 8 * k;
  x.beginPath();
  x.roundRect(0, 0, CARD_W, CARD_H, CARD_R);
  x.fillStyle = '#fff';
  x.fill();
  x.restore();
  x.save();
  x.beginPath();
  x.roundRect(0, 0, CARD_W, CARD_H, CARD_R);
  x.clip();
  const T = t;
  if (type === 0) {
    /* knight drops in, four diamonds pop under it */
    x.save();
    x.translate(75.5 + 56.355, 57.3 + 56.355);
    x.rotate((30 * Math.PI) / 180);
    x.scale(1, 0.87);
    x.transform(1, 0, Math.tan((-30 * Math.PI) / 180), 1, 0, 0);
    x.translate(-56.355, -56.355);
    const rects: [number, number, number][] = [[37.5703, 75.1396, 3], [0, 37.5703, 0], [75.1396, 37.5703, 1], [37.5703, 0, 2]];
    x.fillStyle = PINK;
    rects.forEach(([rx, ry, n]) => {
      const p = prog(T, 0.5 + n * 0.09, 0.45, E.spring);
      if (p <= 0) return;
      x.save();
      x.globalAlpha = Math.min(1, p);
      x.translate(rx + 18.785, ry + 18.785);
      x.scale(p, p);
      x.fillRect(-18.785, -18.785, 37.57, 37.57);
      x.restore();
    });
    x.restore();
    if (A.knight) {
      const u = Math.min(1, Math.max(0, T / 0.95));
      let ty = 0, sx = 1, sy = 1, op = 1;
      if (u < 0.45) {
        ty = lerp(-120, 0, E.in(u / 0.45));
        op = Math.min(1, u / 0.12);
      } else if (u < 0.55) {
        const q = E.out((u - 0.45) / 0.1);
        sx = lerp(1, 1.06, q);
        sy = lerp(1, 0.92, q);
      } else if (u < 0.7) {
        const q = E.out((u - 0.55) / 0.15);
        ty = lerp(0, -9, q);
        sx = lerp(1.06, 0.99, q);
        sy = lerp(0.92, 1.02, q);
      } else if (u < 0.85) {
        const q = E.in((u - 0.7) / 0.15);
        ty = lerp(-9, 0, q);
        sx = lerp(0.99, 1.01, q);
        sy = lerp(1.02, 0.99, q);
      } else {
        const q = E.ease((u - 0.85) / 0.15);
        sx = lerp(1.01, 1, q);
        sy = lerp(0.99, 1, q);
      }
      x.save();
      x.globalAlpha = op;
      x.translate(81 + 50.5, 34 + 87 + ty);
      x.scale(sx, sy);
      x.drawImage(A.knight, -50.5, -87, 101, 87);
      x.restore();
    }
  } else if (type === 1) {
    /* bridge rises, two arcs are revealed */
    const p = prog(T, 0, 0.6, E.out);
    if (A.bridge) {
      x.save();
      x.globalAlpha = p;
      x.translate(55 + 73, 59 + 54.5 + lerp(24, 0, p));
      const s = lerp(0.94, 1, p);
      x.scale(s, s);
      x.drawImage(A.bridge, -73, -54.5, 146, 109);
      x.restore();
    }
    const reveal = (img: HTMLImageElement | null, bx: number, by: number, bw: number, bh: number, ix: number, iy: number, iw: number, ih: number, pr: number, rtl: boolean) => {
      if (!img || pr <= 0) return;
      x.save();
      x.beginPath();
      const w = (bw + 20) * pr;
      x.rect(rtl ? bx + bw + 10 - w : bx - 10, by - 10, w, bh + 20);
      x.clip();
      x.drawImage(img, bx + ix * bw, by + iy * bh, iw * bw, ih * bh);
      x.restore();
    };
    reveal(A.arcsOuter, 54, 37.87, 149, 43.13, -0.0093, -0.0348, 1.0093, 1.048, prog(T, 0.3, 0.8, E.inout), false);
    reveal(A.arcsInner, 69, 54, 116, 28, 0, -0.0536, 1.0112, 1.0806, prog(T, 0.55, 0.8, E.inout), true);
  } else if (type === 2) {
    /* folder rises, three squares fly in */
    const p = prog(T, 0, 0.55, E.out);
    if (A.folder) {
      x.save();
      x.globalAlpha = p;
      x.translate(54.5 + 73.5, 50 + 49 + lerp(24, 0, p));
      const s = lerp(0.94, 1, p);
      x.scale(s, s);
      x.drawImage(A.folder, -73.5, -49, 147, 98);
      x.restore();
    }
    ([[71, 49, -46, -34, 0.35], [168, 65, 46, -34, 0.45], [126, 111, 0, 46, 0.55]] as const).forEach(([sx, sy, fx, fy, d]) => {
      const q = prog(T, d, 0.5, E.spring);
      const lin = Math.min(1, Math.max(0, (T - d) / 0.5));
      if (lin <= 0) return;
      x.save();
      x.globalAlpha = lin;
      x.translate(sx + 16 + fx * (1 - q), sy + 16 + fy * (1 - q));
      const s = lerp(0.3, 1, q);
      x.scale(s, s);
      x.fillStyle = PINK;
      x.beginPath();
      x.roundRect(-16, -16, 32, 32, 2);
      x.fill();
      x.restore();
    });
  } else {
    /* compass: the curve draws itself, the compass spins in, the arrow is revealed */
    const pc = prog(T, 0, 0.9, E.inout);
    x.save();
    x.translate(39.4, 42.85);
    x.strokeStyle = PINK;
    x.lineWidth = 3;
    x.lineCap = 'butt';
    x.setLineDash([curveLen, curveLen]);
    x.lineDashOffset = curveLen * (1 - pc);
    if (pc > 0) x.stroke(curvePath);
    x.restore();
    const q = prog(T, 0.65, 0.6, E.spring);
    const lin = Math.min(1, Math.max(0, (T - 0.65) / 0.6));
    if (A.compass && lin > 0) {
      x.save();
      x.globalAlpha = lin;
      x.translate(79 + 49, 40 + 49);
      x.rotate((lerp(-140, 0, q) * Math.PI) / 180);
      const s = lerp(0.5, 1, q);
      x.scale(s, s);
      x.drawImage(A.compass, -49, -49, 98, 98);
      x.restore();
    }
    const pa = prog(T, 1.05, 0.45, E.out);
    if (A.arrow && pa > 0) {
      x.save();
      x.beginPath();
      x.rect(137 - 10, 76.95 - 10, (79 + 20) * pa, 22.09 + 20);
      x.clip();
      x.drawImage(A.arrow, 137, 76.95, 79, 22.09);
      x.restore();
    }
  }
  /* text block, bottom aligned: padding 24 32, gap 10 */
  x.fillStyle = '#000';
  x.textBaseline = 'alphabetic';
  x.font = '400 14px Satoshi, "Helvetica Neue", Arial, sans-serif';
  const body = wrap(x, story.text, CARD_W - 64);
  const y = CARD_H - 24 - (body.length - 1) * 20 - 5;
  body.forEach((line, i) => x.fillText(line, 32, y + i * 20));
  x.font = '700 18px Satoshi, "Helvetica Neue", Arial, sans-serif';
  x.fillText(story.title, 32, y - 15 - 10 - 4);
  x.restore();
};

const vert = `uniform float uAngle; uniform float uR; uniform float uBend; varying vec2 vUv;
void main(){ vUv = uv; float a = uAngle + position.x / uR; vec3 p = vec3(sin(a) * uR, position.y + (1.0 - cos(a)) * uBend, -cos(a) * uR); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const frag = `uniform sampler2D uTex; uniform vec3 uBg; varying vec2 vUv; void main(){ vec4 c = texture2D(uTex, vUv); gl_FragColor = vec4(mix(uBg, c.rgb, c.a), 1.0); }`;
const postFrag = `uniform sampler2D tDiffuse; uniform float uStrength; uniform float uEdge; varying vec2 vUv;
  vec3 spec(float t){ return clamp(vec3(1.5 - abs(4.0*t - 1.0), 1.5 - abs(4.0*t - 2.0), 1.5 - abs(4.0*t - 3.0)), 0.0, 1.0); }
  void main(){ vec2 c = vUv - 0.5; float ex = smoothstep(uEdge, 0.52, abs(c.x)); float amt = ex * ex * uStrength;
    if (amt < 0.002) { gl_FragColor = texture2D(tDiffuse, vUv); return; }
    vec2 dir = normalize(vec2(c.x, c.y * 0.35) + 1e-5); vec3 acc = vec3(0.0); vec3 ws = vec3(0.0);
    for (int i = 0; i < 24; i++) { float t = float(i) / 23.0; vec2 o = dir * (t - 0.5) * amt * 0.11; vec3 w = spec(t) + 0.15; acc += texture2D(tDiffuse, vUv + o).rgb * w; ws += w; }
    gl_FragColor = vec4(acc / ws, 1.0); }`;

/** Starts the ring on `canvas`. Returns a function that tears it down, or null when WebGL is unavailable. */
export const mountRing = (canvas: HTMLCanvasElement): (() => void) | null => {
  const stories: Story[] = JSON.parse(canvas.dataset.stories ?? '[]').filter((s: Story) => ARTS.includes(s.art));
  if (!stories.length) return null;

  /* the prototype was tuned with raw colour values, so keep three from converting them */
  ColorManagement.enabled = false;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true });
  } catch {
    return null;
  }
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(BG, 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  const group = new Group();
  scene.add(group);

  const geo = new PlaneGeometry(PW, PH, 48, 1);
  geo.translate(0, -PH / 2 + 0.55, 0);
  const bg = new Color(BG);
  const rt = new WebGLRenderTarget(2, 2, { minFilter: LinearFilter, magFilter: LinearFilter });
  const postMat = new ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uStrength: { value: 1 }, uEdge: { value: 0.1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: postFrag,
  });
  const postScene = new Scene();
  const postCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postGeo = new PlaneGeometry(2, 2);
  postScene.add(new Mesh(postGeo, postMat));

  let lookY = 1.6;
  const resize = () => {
    /* phones: the ring sits right under the text, sized from the width */
    if (innerWidth <= 640) {
      const cw = innerWidth * 0.5, ch = (cw * PH) / PW;
      canvas.style.setProperty('--ringH', `${Math.round(ch / 0.92)}px`);
    }
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const dpr = renderer.getPixelRatio();
    rt.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
    camera.aspect = w / h;
    const narrow = w / h < 1;
    camera.fov = narrow ? 50 : 48;
    camera.position.set(0, 0, narrow ? R * 0.42 : R * 0.72);
    if (innerWidth <= 640) {
      /* front card is about 54% of the width, never taller than 88% of the strip */
      const tv = Math.tan((camera.fov * Math.PI) / 360), asp = w / h;
      const D = Math.max(PW / (1.0 * tv * asp), PH / (1.72 * tv));
      camera.position.z = Math.min(R * 0.8, D - R);
    }
    postMat.uniforms.uEdge.value = narrow ? 0.36 : 0.1;
    lookY = innerWidth <= 640 ? 0.55 - PH / 2 : narrow ? 0.75 : h < 1000 ? 1.45 : 1.15;
    camera.updateProjectionMatrix();
  };

  const intro = { y: reduce ? 0 : -4 };
  let angle = 0, vel = 0, dragging = false, lastX = 0, heroP = 0, visible = true, activeIdx = -1;
  const auto = reduce ? 0 : 0.0016;
  /* touch screens: no auto-spin; a swipe flicks the ring and it settles with one card centred */
  const SNAP = !fine;
  let snapTarget: number | null = null, downX = 0, downY = 0, downT = 0, idleUntil = 0;

  type Card = { mesh: Mesh<PlaneGeometry, ShaderMaterial>; ctx: CanvasRenderingContext2D; tex: CanvasTexture; s: number; base: number; start: number | null };
  const cards: Card[] = [];
  const cleanups: (() => void)[] = [];
  let stopped = false;

  const on = <T extends EventTarget>(target: T, type: string, handler: (event: any) => void, options?: AddEventListenerOptions) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  /* ---- reading sheet: the card opened large, with its art animation ---- */
  const sheet = document.querySelector<HTMLElement>('#storySheet')!;
  const sCanvas = sheet.querySelector('canvas')!;
  const sCtx = sCanvas.getContext('2d')!;
  const sCount = sheet.querySelector<HTMLElement>('.ss-count')!;
  const SK = 3.4;
  sCanvas.width = Math.round((CARD_W + PAD * 2) * SK);
  sCanvas.height = Math.round((CARD_H + PAD * 2) * SK);
  let sIdx = 0, sStart = 0, sRaf = 0;
  const A: Images = {};

  const sheetTick = () => {
    const t = performance.now() / 1000 - sStart;
    drawCard(sCtx, A, stories[sIdx], reduce ? Infinity : t, SK);
    if (t < 1.9 && !sheet.hidden) sRaf = requestAnimationFrame(sheetTick);
  };
  const sheetShow = (idx: number) => {
    sIdx = (idx + stories.length) % stories.length;
    sStart = performance.now() / 1000;
    cancelAnimationFrame(sRaf);
    sheetTick();
    sCount.textContent = `${sIdx + 1} / ${stories.length}`;
  };
  const openSheet = (idx: number) => {
    if (idx < 0 || !cards[idx]) return;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('on'));
    sheetShow(cards[idx].s);
    lenis?.stop();
  };
  const closeSheet = () => {
    sheet.classList.remove('on');
    setTimeout(() => {
      sheet.hidden = true;
    }, 300);
    lenis?.start();
  };
  /* bring the nearest card of this story to the front */
  const goTo = (story: number) => {
    let bestK: number | null = null, bestD = 1e9;
    const k0 = Math.round(angle / STEP);
    for (let d = -N; d <= N; d++) {
      const k = k0 + d;
      const idx = ((-k % N) + N) % N;
      if (cards[idx] && cards[idx].s === story && Math.abs(d) < bestD) {
        bestD = Math.abs(d);
        bestK = k;
      }
    }
    if (bestK !== null) {
      vel = 0;
      snapTarget = bestK * STEP;
      idleUntil = performance.now() + 5000;
    }
  };
  on(sheet.querySelector('.ss-close')!, 'click', closeSheet);
  on(sheet, 'click', (event) => {
    if (event.target === sheet) closeSheet();
  });
  on(sheet.querySelector('.ss-prev')!, 'click', () => {
    sheetShow(sIdx - 1);
    goTo(sIdx);
  });
  on(sheet.querySelector('.ss-next')!, 'click', () => {
    sheetShow(sIdx + 1);
    goTo(sIdx);
  });
  let sx0: number | null = null;
  on(sheet, 'touchstart', (event) => (sx0 = event.touches[0].clientX), { passive: true });
  on(sheet, 'touchend', (event) => {
    if (sx0 === null) return;
    const dx = event.changedTouches[0].clientX - sx0;
    sx0 = null;
    if (Math.abs(dx) > 50) sheet.querySelector<HTMLElement>(dx < 0 ? '.ss-next' : '.ss-prev')!.click();
  });
  on(window, 'keydown', (event) => {
    if (sheet.hidden) return;
    if (event.key === 'Escape') closeSheet();
    if (event.key === 'ArrowRight') sheet.querySelector<HTMLElement>('.ss-next')!.click();
    if (event.key === 'ArrowLeft') sheet.querySelector<HTMLElement>('.ss-prev')!.click();
  });

  /* ---- ring interaction ---- */
  on(canvas, 'pointerdown', (event: PointerEvent) => {
    dragging = true;
    lastX = downX = event.clientX;
    downY = event.clientY;
    downT = performance.now();
    snapTarget = null;
    canvas.classList.add('grabbing');
    canvas.setPointerCapture(event.pointerId);
  });
  on(canvas, 'pointermove', (event: PointerEvent) => {
    if (!dragging) return;
    vel = (event.clientX - lastX) * 0.0022;
    angle += vel * (SNAP ? 1 : 0);
    lastX = event.clientX;
  });
  const up = (event?: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('grabbing');
    idleUntil = performance.now() + 5000;
    /* a tap (not a swipe) opens the card in front for reading */
    if (event && event.type === 'pointerup' && Math.hypot(event.clientX - downX, event.clientY - downY) < 8 && performance.now() - downT < 400) {
      vel = 0;
      openSheet(activeIdx);
    }
  };
  on(canvas, 'pointerup', up);
  on(canvas, 'pointercancel', up);
  canvas.style.touchAction = 'pan-y';
  on(window, 'resize', resize);

  const trigger = ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: (self) => (heroP = self.progress) });
  const observer = new IntersectionObserver((entries) => (visible = entries[0].isIntersecting));
  observer.observe(canvas);

  const frame = () => {
    if (!visible || stopped) return;
    const now = performance.now() / 1000;
    /* on phones the ring sits in the page flow, so it must scroll with it: no lift, bend or extra blur from scrolling */
    const lift = innerWidth <= 640 ? 0 : heroP;
    const sv = lenis ? lenis.velocity : 0;
    if (SNAP) {
      if (!dragging) {
        if (snapTarget === null && Math.abs(vel) > 0.003) {
          angle += vel;
          vel *= 0.93;
        } else {
          vel = 0;
          const target = snapTarget ?? Math.round(angle / STEP) * STEP;
          angle += (target - angle) * 0.14;
          if (Math.abs(target - angle) < 1e-4) {
            angle = target;
            snapTarget = null;
          }
        }
      }
    } else {
      if (!dragging) vel += ((performance.now() < idleUntil ? 0 : auto) - vel) * 0.04;
      angle += vel + sv * 0.00025;
    }
    /* the card facing the viewer replays its art animation, like .is-active on the mobile site */
    let best = 0, bestD = 9;
    cards.forEach((card, i) => {
      let a = (((card.base + angle) % TAU) + TAU) % TAU;
      if (a > Math.PI) a -= TAU;
      if (Math.abs(a) < bestD) {
        bestD = Math.abs(a);
        best = i;
      }
    });
    if (best !== activeIdx) {
      activeIdx = best;
      if (!reduce) cards[best].start = now;
    }
    cards.forEach((card) => {
      if (card.start !== null) {
        const t = now - card.start;
        drawCard(card.ctx, A, stories[card.s], t);
        card.tex.needsUpdate = true;
        if (t > 1.8) card.start = null;
      }
      card.mesh.material.uniforms.uAngle.value = card.base + angle;
      card.mesh.material.uniforms.uBend.value = 0.35 + lift * 1.6;
    });
    group.position.y = lift * 2 + intro.y;
    group.rotation.x = lift * 0.22;
    camera.lookAt(0, lookY - lift * 0.4, -R);
    postMat.uniforms.uStrength.value = (SNAP ? 0.55 : 1) + Math.min(Math.abs(vel) * 120 + (SNAP ? 0 : Math.abs(sv) * 0.04), 1.6) + lift * 1.2;
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  };

  const teardown = () => {
    if (stopped) return;
    stopped = true;
    gsap.ticker.remove(frame);
    cancelAnimationFrame(sRaf);
    cleanups.forEach((fn) => fn());
    observer.disconnect();
    trigger.kill();
    sheet.hidden = true;
    sheet.classList.remove('on');
    cards.forEach((card) => {
      card.tex.dispose();
      card.mesh.material.dispose();
    });
    geo.dispose();
    postGeo.dispose();
    postMat.dispose();
    rt.dispose();
    renderer.dispose();
  };

  const fontsReady = document.fonts
    ? Promise.all(['700 18px Satoshi', '400 14px Satoshi'].map((font) => document.fonts.load(font))).catch(() => {})
    : Promise.resolve();
  void Promise.all([
    loadImg(`${ASSETS}/art-knight.png`),
    loadImg(`${ASSETS}/art-bridge.png`),
    loadImg(`${ASSETS}/art-folder.png`),
    loadImg(`${ASSETS}/art-compass.png`),
    loadImg(`${ASSETS}/art-arrow.svg`),
    loadImg(`${ASSETS}/art-arcs-outer.svg`),
    loadImg(`${ASSETS}/art-arcs-inner.svg`),
    Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 2500))]),
  ]).then(([knight, bridge, folder, compass, arrow, arcsOuter, arcsInner]) => {
    if (stopped) return;
    Object.assign(A, { knight, bridge, folder, compass, arrow, arcsOuter, arcsInner });
    for (let i = 0; i < N; i++) {
      const cv = document.createElement('canvas');
      cv.width = TW;
      cv.height = TH;
      const ctx = cv.getContext('2d')!;
      const s = i % stories.length;
      drawCard(ctx, A, stories[s], Infinity);
      const tex = new CanvasTexture(cv);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.premultiplyAlpha = false;
      const material = new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        side: DoubleSide,
        transparent: false,
        uniforms: { uTex: { value: tex }, uAngle: { value: i * STEP }, uR: { value: R }, uBend: { value: 0.35 }, uBg: { value: bg } },
      });
      const mesh = new Mesh(geo, material);
      mesh.frustumCulled = false;
      group.add(mesh);
      cards.push({ mesh, ctx, tex, s, base: i * STEP, start: null });
    }
    resize();
    setTimeout(resize, 1600);
    gsap.ticker.add(frame);
    gsap.to(intro, { y: 0, duration: 2.2, ease: 'expo.out' });
  });

  return teardown;
};
