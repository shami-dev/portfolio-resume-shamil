import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const cases = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cases" }),
  schema: z.object({
    seo: z.object({
      title: z.string(),
      description: z.string(),
    }),
    rail: z.object({
      record: z.string(),
      role: z.string(),
      span: z.string(),
      year: z.string(),
      navWorkSuffix: z.string(),
      tools: z.array(z.string()),
      link: z.object({ href: z.string(), label: z.string() }),
    }),
    kicker: z.string(),
    headline: z.string(),
    ledeMetrics: z.string(),
    hero: z.object({ slug: z.string(), kind: z.string() }),
    problem: z.string(),
    constraint: z.string(),
    decision: z.string(),
    evidence: z.object({
      figures: z.array(z.object({ slug: z.string(), kind: z.string() })),
      caption: z.string(),
    }),
    result: z.object({
      metrics: z.string(),
      body: z.string(),
    }),
    lesson: z.string(),
    footerNav: z.object({
      prev: z.object({ href: z.string(), label: z.string() }),
      next: z.object({ href: z.string(), label: z.string() }),
    }),
  }),
});

export const collections = { cases };
