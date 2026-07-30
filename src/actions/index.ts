import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { RESEND_API_KEY } from "astro:env/server";
import { env } from "cloudflare:workers";

// `accept: "form"` converts empty inputs to `null` (not `undefined`). For
// the honeypot that's why it's `.nullish()` — a real visitor never sees or
// fills this field; anything in it means a bot did. For name/message, a
// bare `z.string()` would reject that `null` at the type level before
// `.min(1)` ever runs, surfacing zod's generic "Invalid input" instead of
// the message below — preprocessing null/undefined to "" first routes an
// empty required field through `.min(1)` like any other too-short string.
const requiredText = (max: number, message: string) =>
  z.preprocess(
    (value) => value ?? "",
    z.string().trim().min(1, message).max(max),
  );

const contactInput = z.object({
  name: requiredText(200, "Enter your name."),
  email: z.email("Enter a valid email address."),
  message: requiredText(5000, "Enter a message."),
  company: z.string().nullish(),
});

export const server = {
  contact: defineAction({
    accept: "form",
    input: contactInput,
    handler: async (input, context) => {
      if (input.company) {
        // Bot filled the decoy field. Return the same shape as a real send
        // without ever revealing the trap or hitting Resend.
        return { ok: true };
      }

      // A missing binding must not look the same in dev and prod: locally
      // it's a plausible (if now rare — Astro 6's dev server runs the real
      // workerd runtime, so wrangler.jsonc's binding is normally present
      // even in `astro dev`) tooling gap, worth logging but not worth
      // blocking on. In production it means a misconfigured/failed deploy,
      // and failing open there would be silent, unthrottled sends against
      // the Resend quota and domain reputation — so only DEV is allowed to
      // proceed; every other case is logged and blocked either way.
      const rateLimiter = env.CONTACT_RATE_LIMIT;
      if (!rateLimiter) {
        context.logger.warn(
          "CONTACT_RATE_LIMIT binding is missing — sends are unthrottled.",
        );
        if (!import.meta.env.DEV) {
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Couldn't send your message — please email hello@shamil.dev directly.",
          });
        }
      } else {
        const rateLimitResult = await rateLimiter.limit({
          key: context.clientAddress,
        });
        if (!rateLimitResult.success) {
          throw new ActionError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many messages sent — please try again in a minute.",
          });
        }
      }

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Must be on the domain verified in Resend for shamil.dev.
          from: "Portfolio contact form <noreply@shamil.dev>",
          to: "hello@shamil.dev",
          subject: `New message from ${input.name}`,
          text: input.message,
          reply_to: input.email,
        }),
      });

      if (!resendResponse.ok) {
        const body = await resendResponse.text();
        context.logger.error(
          `Resend send failed (${resendResponse.status}): ${body}`,
        );
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Couldn't send your message — please email hello@shamil.dev directly.",
        });
      }

      return { ok: true };
    },
  }),
};
