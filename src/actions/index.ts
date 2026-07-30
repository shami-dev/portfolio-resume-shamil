import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { RESEND_API_KEY } from "astro:env/server";
import { env } from "cloudflare:workers";

// `accept: "form"` converts empty inputs to `null` (not `undefined`), so the
// honeypot must be `.nullish()` — a real visitor never sees or fills this
// field; anything in it means a bot did.
const contactInput = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  email: z.email("Enter a valid email address."),
  message: z.string().trim().min(1, "Enter a message.").max(5000),
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

      // `env` (from `cloudflare:workers`) is only populated in the real
      // workerd runtime — optional-chained so a missing binding fails open
      // rather than throwing, e.g. if it's ever unavailable locally.
      const rateLimitResult = await env.CONTACT_RATE_LIMIT?.limit({
        key: context.clientAddress,
      });
      if (rateLimitResult && !rateLimitResult.success) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many messages sent — please try again in a minute.",
        });
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
