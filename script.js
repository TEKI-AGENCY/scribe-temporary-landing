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

  const itemTargets = [
    { x: "-20vw", y: "-30vh", rotation: -20 },
    { x: "25vw", y: "-20vh", rotation: 15 },
    { x: "-32vw", y: "30vh", rotation: 12 },
    { x: "15vw", y: "25vh", rotation: -15 },
  ];

  const EXIT_DISTANCE = 3.5;
  const itemExits = itemTargets.map((target) => ({
    x: parseFloat(target.x) * EXIT_DISTANCE + "vw",
    y: parseFloat(target.y) * EXIT_DISTANCE + "vh",
    rotation: target.rotation * 2.5,
  }));

  const items = gsap.utils.toArray(".item");
  const floatingTweens = [];

  const tl = gsap.timeline({ delay: 0.5 });

  tl.to(".preloader-revealer", {
    clipPath: "circle(100% at 50% 50%)",
    duration: 1,
    stagger: 0.25,
    ease: "power2.inOut",
  });

  tl.set(".preloader-revealer-1, .preloader-revealer-2, .preloader-revealer-3", {
    display: "none",
  });

  tl.to(".preloader-revealer-4", {
    opacity: 0,
    duration: 0.35,
    ease: "power2.out",
  });

  tl.set(".preloader-revealer", { display: "none" });
  tl.add(initDrawPathCursorEffect);

  items.forEach((item, i) => {
    const target = itemTargets[i];
    const image = item.querySelector("img");

    tl.to(
      item,
      {
        x: target.x,
        y: target.y,
        scale: 1,
        rotation: target.rotation,
        duration: 1,
        ease: "power3.out",
        onStart: () => {
          floatingTweens[i] = gsap.to(image, {
            y: gsap.utils.random(-15, -25),
            duration: gsap.utils.random(1.5, 2.5),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: gsap.utils.random(0, 0.5),
          });
        },
      },
      i === 0 ? "-=0.55" : "<0.075",
    );
  });

  tl.to(
    ".preloader-logo",
    { scale: 1, opacity: 1, duration: 1, ease: "power3.out" },
    "<",
  );

  tl.set(".preloader-backdrop", { display: "none" });

  tl.to({}, { duration: 1 });

  tl.add(() => floatingTweens.forEach((tween) => tween.kill()));

  items.forEach((item, i) => {
    const exit = itemExits[i];

    tl.to(
      item,
      {
        x: exit.x,
        y: exit.y,
        scale: 2.5,
        rotation: exit.rotation,
        duration: 0.75,
        ease: "power2.in",
      },
      i === 0 ? ">" : "<0.075",
    );
  });

  tl.to(
    ".preloader-logo",
    { y: "-120vh", scale: 2.5, duration: 0.75, ease: "power2.in" },
    "<",
  );

  tl.to(
    ".nav-logo img",
    { scale: 1, duration: 0.75, ease: "power3.out" },
    "-=0.4",
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
