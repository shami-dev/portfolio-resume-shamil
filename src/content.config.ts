import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const cases = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cases" }),
  schema: ({ image }) =>
    z.object({
      seo: z.object({
        title: z.string(),
        description: z.string(),
      }),
      rail: z.object({
        record: z.string(),
        role: z.string(),
        cellPair: z
          .array(
            z.object({
              label: z.string(),
              value: z.string(),
              accent: z.boolean().optional(),
            }),
          )
          .length(2),
        tools: z.array(z.string()),
        link: z.object({ href: z.string(), label: z.string() }).optional(),
      }),
      index: z.object({
        title: z.string(),
        metric: z.string(),
        metricAccent: z.boolean().optional(),
        summary: z.string(),
      }),
      kicker: z.string(),
      headline: z.string(),
      ledeMetrics: z.string(),
      // slug/kind are the pre-image placeholder spec and retire once all five
      // cases carry real figures; src/alt stay optional until then so the
      // un-migrated cases still validate. src is resolved by Astro's image()
      // helper from a path relative to this entry's own file.
      hero: z.object({
        slug: z.string(),
        kind: z.string(),
        src: image().optional(),
        alt: z.string().optional(),
      }),
      problem: z.string(),
      constraint: z.string(),
      decision: z.string(),
      evidence: z.object({
        figures: z.array(
          z.object({
            slug: z.string(),
            kind: z.string(),
            src: image().optional(),
            alt: z.string().optional(),
          }),
        ),
        caption: z.string(),
      }),
      result: z.discriminatedUnion("variant", [
        z.object({
          variant: z.literal("banner"),
          label: z.string(),
          metrics: z.string(),
          body: z.string(),
        }),
        z.object({
          variant: z.literal("status"),
          label: z.string(),
          body: z.string(),
        }),
      ]),
      lesson: z.string().optional(),
      footerNav: z.object({
        prev: z.object({ href: z.string(), label: z.string() }),
        next: z.object({ href: z.string(), label: z.string() }),
      }),
    }),
});

export const collections = { cases };
