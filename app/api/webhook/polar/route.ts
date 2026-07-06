import { Webhooks } from '@polar-sh/supabase';

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET as string,
  onPayload: async (payload) => {
    // Catch-all handler for incoming Webhook events
    console.log("Polar webhook payload received:", payload);
  },
  // You can also add granular handlers here like:
  // onCheckoutCreated: async (payload) => { ... },
  // onOrderCreated: async (payload) => { ... },
  // onSubscriptionCreated: async (payload) => { ... },
});
