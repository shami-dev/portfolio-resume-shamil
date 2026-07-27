// Detent & Settle — Phase 6B page-load / scroll register
// (design-v2/phase_6/interaction_motion_v3/motion_step_b.html, 6B.0-6B.1).
//
// One IntersectionObserver reveals every [data-register] element, in
// document order: elements already in the viewport fire on the observer's
// first callback (the page-entry-register), and below-the-fold elements
// join the same register as they scroll into view (15% threshold, once,
// never re-animated) — one mechanism for the whole page, per 6B.1.
//
// Entries that cross the threshold together in a single callback are one
// "batch" and get staggered --t-stagger apart, in document order.
// data-register-beat adds the one-per-page --t-beat pre-pause (6B.0) ahead
// of an outcome band's payoff.
const root = document.documentElement;

function revealAt(el: HTMLElement, delayMs: number): void {
  el.style.setProperty("--register-delay", `${delayMs}ms`);
  el.classList.add("is-registered");
}

// getComputedStyle serializes a custom property's <time> value in whatever
// unit the engine normalizes to (Chrome reports "110ms" back as ".11s"),
// so a bare parseFloat silently reads the wrong magnitude. Convert to ms
// explicitly instead of trusting the authored suffix.
function readMs(value: string, fallback: number): number {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  return value.trim().endsWith("ms") ? n : n * 1000;
}

try {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReduced || !("IntersectionObserver" in window)) {
    // Reduced motion is already forced visible by CSS (!important); this
    // just skips the observer. Missing IntersectionObserver is the one
    // fallback that needs the class, so content is never stuck invisible.
    if (!prefersReduced) {
      root.classList.add("no-motion");
    }
  } else {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-register]"),
    );
    const order = new Map(targets.map((el, i) => [el, i]));

    const rootStyle = getComputedStyle(root);
    const stagger = readMs(rootStyle.getPropertyValue("--t-stagger"), 110);
    const beat = readMs(rootStyle.getPropertyValue("--t-beat"), 150);

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              (order.get(a.target as HTMLElement) ?? 0) -
              (order.get(b.target as HTMLElement) ?? 0),
          )
          .forEach((entry, i) => {
            observer.unobserve(entry.target);
            const el = entry.target as HTMLElement;
            const hasBeat = el.hasAttribute("data-register-beat");
            revealAt(el, i * stagger + (hasBeat ? beat : 0));
          });
      },
      { threshold: 0.15 },
    );

    targets.forEach((el) => observer.observe(el));
  }
} catch {
  root.classList.add("no-motion");
}
