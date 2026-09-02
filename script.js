import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { initDrawPathCursorEffect } from "./drawScript.js";

gsap.registerPlugin(SplitText);

// wait for full page load (not just DOM/fonts) so the stylesheet is guaranteed applied
// before layout-dependent values (e.g. clip-path circle center) are computed
const pageLoaded = document.readyState === "complete"
  ? Promise.resolve()
  : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

Promise.all([document.fonts.ready, pageLoaded]).then(() => {
  const heading = SplitText.create(".hero-header h1", {
    type: "lines, words, chars",
    charsClass: "char",
    wordsClass: "word",
  });

  const footerText = SplitText.create(".hero-footer p", {
    type: "lines",
    mask: "lines",
    linesClass: "footer-line",
  });

  gsap.set(".nav-logo img", { scale: 0 });
  // set explicitly so GSAP's from/to clip-path values always share the same "at x y" structure
  // (minified CSS may drop the default "at 50% 50%", which breaks GSAP's numeric interpolation)
  gsap.set(".preloader-revealer", { clipPath: "circle(0% at 50% 50%)" });
  gsap.set(heading.chars, { y: 50, opacity: 0, scale: 0.5 });
  gsap.set(".hero-copy > *", { y: 12, opacity: 0 });
  gsap.set(footerText.lines, { yPercent: 100 });

  const tl = gsap.timeline({ delay: 0.5 });

  tl.to(".preloader-revealer", {
    clipPath: "circle(100% at 50% 50%)",
    duration: 0.7,
    stagger: 0.175,
    ease: "power2.inOut",
  });

  tl.set(".preloader-revealer-1, .preloader-revealer-2, .preloader-revealer-3", {
    display: "none",
  });

  tl.to(".preloader-revealer-4", {
    opacity: 0,
    duration: 0.245,
    ease: "power2.out",
  });

  tl.set(".preloader-revealer", { display: "none" });
  tl.add(initDrawPathCursorEffect);

  tl.to(
    ".preloader-logo",
    { scale: 1, opacity: 1, duration: 0.25, ease: "power3.out" },
    "-=0.39",
  );

  tl.set(".preloader-backdrop", { display: "none" });

  tl.to({}, { duration: 0.125 });

  tl.to(
    ".preloader-logo",
    { y: "-120vh", scale: 2.5, duration: 0.375, ease: "power2.in" },
    "+=0.1125",
  );

  tl.to(
    ".nav-logo img",
    { scale: 1, duration: 0.75, ease: "power3.out" },
    "-=0.2",
  );

  tl.to(
    heading.chars,
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.5,
      stagger: 0.015,
      ease: "elastic.out(0.75, 0.25)",
    },
    "<0.15",
  );

  tl.to(
    ".hero-copy > *",
    {
      y: 0,
      opacity: 1,
      duration: 0.55,
      stagger: 0.12,
      ease: "power3.out",
    },
    ">0.1",
  );

  tl.to(
    footerText.lines,
    { yPercent: 0, duration: 0.75, stagger: 0.1, ease: "power3.out" },
    "<0.2",
  );

  tl.to(".hero-img-bg", { scale: 1, duration: 1, ease: "power3.out" }, ">0.1");
  tl.to(
    ".hero-img img",
    { y: "-60%", duration: 1, ease: "power3.out" },
    "<0.3",
  );

  tl.set(".preloader", { display: "none" });
});
