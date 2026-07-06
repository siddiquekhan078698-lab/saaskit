import { Webhooks } from '@polar-sh/supabase';
import { validateEvent } from '@polar-sh/sdk/webhooks';

type WebhookPayload = ReturnType<typeof validateEvent>;

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET as string,
  onPayload: async (payload: WebhookPayload) => {
    // Catch-all handler for incoming Webhook events
    console.log("Polar webhook payload received:", payload);
  },
  // You can also add granular handlers here like:
  // onCheckoutCreated: async (payload) => { ... },
  // onOrderCreated: async (payload) => { ... },
  // onSubscriptionCreated: async (payload) => { ... },
});
