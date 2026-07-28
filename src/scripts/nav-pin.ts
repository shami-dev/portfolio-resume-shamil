// iOS 26 Safari mispaints `position: fixed` elements while its own
// collapsible bottom toolbar is mid-animation (open WebKit regression as
// of iOS 26 — hits LinkedIn, nytimes.com, and Mastodon's own web client
// too, not something wrong in this CSS). The native `bottom: 0` position
// lags/misaligns for a frame or two during that animation, which is what
// puts the tab bar over card content mid-scroll.
//
// Re-deriving the offset from the live visualViewport on every viewport
// event and setting it explicitly forces a repaint at the correct spot
// instead of trusting WebKit's own (currently buggy) fixed-position paint.
const navEl = document.querySelector<HTMLElement>(".nav");
const vv = window.visualViewport;

if (navEl && vv) {
  const isFixedBar = () => window.matchMedia("(width < 64rem)").matches;

  const pin = () => {
    if (!isFixedBar()) {
      navEl.style.transform = "";
      return;
    }
    const hiddenBelowFold =
      document.documentElement.clientHeight - (vv.height + vv.offsetTop);
    navEl.style.transform = `translate3d(0, ${-Math.max(0, hiddenBelowFold)}px, 0)`;
  };

  vv.addEventListener("resize", pin);
  vv.addEventListener("scroll", pin);
  pin();
}
