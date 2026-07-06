import { Webhooks } from '@polar-sh/supabase';
import { validateEvent } from '@polar-sh/sdk/webhooks';
import { createAdminClient } from '@/utils/supabase/admin';

type WebhookPayload = ReturnType<typeof validateEvent>;

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET as string,
  onPayload: async (payload: WebhookPayload) => {
    console.log("Polar webhook payload received:", payload.type);
  },
  onSubscriptionCreated: async (payload: any) => {
    try {
      const supabase = createAdminClient();
      const subscription = payload.data;

      // Extract user_id from customer.external_id (set during checkout)
      const userId: string | null = subscription.customer?.external_id ?? null;
      const customerEmail: string | null = subscription.customer?.email ?? null;

      console.log("onSubscriptionCreated - userId:", userId, "email:", customerEmail);

      // Upsert into subscriptions table
      // No FK constraint on user_id, so this always succeeds
      const { error } = await supabase.from('subscriptions').upsert({
        id: subscription.id,                           // text (PK - Polar subscription ID)
        user_id: userId,                               // uuid (nullable, no FK)
        email: customerEmail,                          // text (for lookup by email)
        polar_customer_id: subscription.customer_id,  // text
        status: subscription.status,                  // text
        plan_id: subscription.product_id,             // text
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end).toISOString()
          : null,                                      // timestamptz
        // created_at has a DB default, skip it to avoid conflict
      }, { onConflict: 'id' });

      if (error) {
        console.error("Supabase upsert error in onSubscriptionCreated:", JSON.stringify(error));
      } else {
        console.log("Subscription inserted successfully:", subscription.id);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionCreated:", e);
    }
  },
  onSubscriptionUpdated: async (payload: any) => {
    try {
      const supabase = createAdminClient();
      const subscription = payload.data;

      console.log("onSubscriptionUpdated - id:", subscription.id, "status:", subscription.status);

      const { error } = await supabase.from('subscriptions').upsert({
        id: subscription.id,
        user_id: subscription.customer?.external_id ?? null,
        email: subscription.customer?.email ?? null,
        polar_customer_id: subscription.customer_id,
        status: subscription.status,
        plan_id: subscription.product_id,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end).toISOString()
          : null,
      }, { onConflict: 'id' });

      if (error) {
        console.error("Supabase upsert error in onSubscriptionUpdated:", JSON.stringify(error));
      } else {
        console.log("Subscription updated successfully:", subscription.id);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionUpdated:", e);
    }
  },
  onSubscriptionRevoked: async (payload: any) => {
    try {
      const supabase = createAdminClient();
      const subscription = payload.data;

      console.log("onSubscriptionRevoked - id:", subscription.id);

      const { error } = await supabase.from('subscriptions').update({
        status: subscription.status,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end).toISOString()
          : null,
      }).eq('id', subscription.id);

      if (error) {
        console.error("Supabase update error in onSubscriptionRevoked:", JSON.stringify(error));
      } else {
        console.log("Subscription revoked successfully:", subscription.id);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionRevoked:", e);
    }
  }
});
