// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
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
