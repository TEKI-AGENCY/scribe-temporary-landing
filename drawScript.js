import gsap from "gsap";

export function initDrawPathCursorEffect() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const trailDuration = 1250; // how long the trail lingers in ms

  const strokeMinWidth = 2; // thinnest line (fast movement)
  const strokeMaxWidth = 16; // thickest line (slow movement)
  const strokeSmoothing = 0.1; // 0–1 — lower = smoother width transitions

  const velocitySlow = 0.08; // px/ms threshold for "slow"
  const velocityFast = 2.8; // px/ms threshold for "fast"

  const glowBlur = 10; // px — glow radius
  const glowIntensity = 0.25; // 0–1 — glow opacity

  const cursorLag = 0.15; // seconds — GSAP easing duration

  const dot = document.querySelector('[data-cursor-dot]');
  const canvas = document.querySelector('[data-cursor-canvas]');
  const ctx = canvas.getContext('2d');

  let points = [];
  let hasMouse = false;
  let runningWidth = strokeMinWidth;

  const color = getComputedStyle(canvas).color.match(/\d+(?:\.\d+)?/g).slice(0, 3);

  gsap.set(dot, { xPercent: -50, yPercent: -50, opacity: 0 });
  const xTo = gsap.quickTo(dot, 'x', { duration: cursorLag, ease: 'power3' });
  const yTo = gsap.quickTo(dot, 'y', { duration: cursorLag, ease: 'power3' });

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
  });
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
  });

  window.addEventListener('mousemove', (e) => {
    hasMouse = true;
    xTo(e.clientX);
    yTo(e.clientY);
  });

  gsap.ticker.add(() => {
    if (!hasMouse) return;

    const x = gsap.getProperty(dot, 'x');
    const y = gsap.getProperty(dot, 'y');

    if (points.length > 0) {
      const last = points[points.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;
      if (dx * dx + dy * dy < 0.1) return;
    }

    points.push({ x, y, time: performance.now() });
  });

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function remap(v, inMin, inMax, outMin, outMax) {
    const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return outMin + t * (outMax - outMin);
  }

  function render() {
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = points.filter(p => now - p.time < trailDuration);

    if (points.length >= 3) drawTrail(now);
    requestAnimationFrame(render);
  }

  function drawTrail(now) {
    const [r, g, b] = color;

    ctx.lineCap = 'butt';
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowIntensity})`;
    ctx.shadowBlur = glowBlur;

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const mx1 = (prev.x + curr.x) * 0.5;
      const my1 = (prev.y + curr.y) * 0.5;
      const mx2 = (curr.x + next.x) * 0.5;
      const my2 = (curr.y + next.y) * 0.5;

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dt = curr.time - prev.time || 1;
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

      const targetWidth = remap(velocity, velocitySlow, velocityFast, strokeMaxWidth, strokeMinWidth);
      runningWidth += (targetWidth - runningWidth) * strokeSmoothing;

      const age = now - curr.time;
      const life = 1 - age / trailDuration;
      const alpha = life * life;
      if (alpha <= 0.005) continue;

      ctx.beginPath();
      ctx.moveTo(mx1, my1);
      ctx.quadraticCurveTo(curr.x, curr.y, mx2, my2);
      ctx.lineWidth = runningWidth;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(render);
}