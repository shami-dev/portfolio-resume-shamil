// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Canonical origin. Required by @astrojs/sitemap and used by BaseLayout
  // to build absolute canonical/OG URLs (Phase 7 C1 + F-11).
  // `output` stays at its default ("static"): every page is prerendered.
  site: "https://shamil.dev",

  // Dev-only UI, off project-wide (docs: astro.build/en/guides/dev-toolbar
  // /#disabling-the-dev-toolbar) — it never ships to the built site, but
  // its fixed-position overlay was getting in the way of mobile-viewport
  // QA in the browser preview.
  devToolbar: {
    enabled: false,
  },

  // Clean URLs (no trailing slash) is the canonical form: every existing
  // internal href already omits it. Only affects dev-server route matching
  // and Astro.url — prerendered output trailing-slash behavior is actually
  // enforced by Cloudflare's `assets.html_handling` in wrangler.jsonc.
  trailingSlash: "never",

  // Every page's CSS chunk (5-22kb) sits above the 4kb 'auto' inline
  // threshold, so it ships as a blocking <link rel="stylesheet"> —
  // Lighthouse flags it on the homepage (~150ms). 11 static pages means
  // the per-navigation duplication cost is small next to the render-block
  // it removes.
  build: {
    inlineStylesheets: "always",
  },

  // `imageService: 'compile'` (the adapter's pre-Astro-6 default) transforms
  // <Image>/<Picture> at build time for prerendered routes instead of the
  // new default `cloudflare-binding`, which needs a live Images binding at
  // request time — unnecessary here since nothing is server-rendered yet.
  adapter: cloudflare({
    imageService: "compile",
  }),

  // Typed, server-only access to the Resend key from the contact action
  // (src/actions/index.ts) via `astro:env/server`. `validateSecrets` stays
  // at its default (false) so a build without the secret still succeeds.
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },

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
      filter: (page) => page !== "https://shamil.dev/404",
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
      // 'swap's fallback->webfont swap was reflowing .hero (Arial vs
      // Archivo glyph widths differ enough to change the intro
      // paragraph's line count) for a 0.322 CLS hit — fallback metric
      // overrides only fix vertical metrics, not that. 'optional' commits
      // to whichever font is ready within ~100ms and never swaps mid-view;
      // paired with the preload below, the above-the-fold weight lands
      // in time almost always.
      display: "optional",
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
      display: "optional",
    },
  ],
});
