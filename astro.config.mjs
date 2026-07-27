// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Canonical origin. Required by @astrojs/sitemap and used by BaseLayout
  // to build absolute canonical/OG URLs (Phase 7 C1 + F-11).
  // `output` stays at its default ("static"): every page is prerendered.
  site: "https://shamil.dev",

  // Standalone prefetch — no <ClientRouter /> involved. 11 small pages, so
  // prefetch every internal link on hover rather than opting in per-link.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  integrations: [
    // 404 is excluded: Phase 7 F-11 requires it to return a real 404 and
    // carry noindex, so it must not be advertised in the sitemap.
    sitemap({
      filter: (page) => page !== "https://shamil.dev/404/",
    }),
  ],

  // Self-hosted via Astro's built-in Font API (Phase 7 F-08): downloads
  // and caches fonts so they're served from this site, handles preload
  // + optimized fallback metrics automatically.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Archivo",
      cssVariable: "--font-archivo",
      weights: [400, 500, 600, 700],
      styles: ["normal", "italic"],
      subsets: ["latin"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "IBM Plex Mono",
      cssVariable: "--font-ibm-plex-mono",
      weights: [400, 500, 600],
      styles: ["normal"],
      // cyrillic (not just latin): Archivo has no glyph for "№" (U+2116)
      // in any subset, so it's rendered in mono everywhere instead —
      // Plex Mono's cyrillic subset is confirmed to cover it.
      subsets: ["latin", "cyrillic"],
    },
  ],
});
