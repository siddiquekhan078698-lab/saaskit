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
      
      const userId = subscription.customer?.external_id ?? null;
      const customerEmail = subscription.customer?.email ?? null;

      // Upsert user into public.users first to avoid FK violation.
      // This handles cases where the user exists in auth.users but not public.users
      // (e.g. signed up before the trigger was created, or via a different flow).
      if (userId) {
        const { error: userError } = await supabase.from('users').upsert({
          id: userId,
          email: customerEmail,
        }, { onConflict: 'id', ignoreDuplicates: true });

        if (userError) {
          console.error("Supabase upsert error for user in onSubscriptionCreated:", userError);
        }
      }

      const { error } = await supabase.from('subscriptions').upsert({
        id: subscription.id,
        user_id: userId,
        polar_customer_id: subscription.customer_id,
        status: subscription.status,
        plan_id: subscription.product_id,
        created_at: new Date(subscription.created_at).toISOString(),
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
      });

      if (error) {
        console.error("Supabase insert error in onSubscriptionCreated:", error);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionCreated:", e);
    }
  },
  onSubscriptionUpdated: async (payload: any) => {
    try {
      const supabase = createAdminClient();
      const subscription = payload.data;
      
      const { error } = await supabase.from('subscriptions').update({
        status: subscription.status,
        plan_id: subscription.product_id,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
      }).eq('id', subscription.id);

      if (error) {
        console.error("Supabase update error in onSubscriptionUpdated:", error);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionUpdated:", e);
    }
  },
  onSubscriptionRevoked: async (payload: any) => {
    try {
      const supabase = createAdminClient();
      const subscription = payload.data;
      
      const { error } = await supabase.from('subscriptions').update({
        status: subscription.status,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
      }).eq('id', subscription.id);

      if (error) {
        console.error("Supabase update error in onSubscriptionRevoked:", error);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionRevoked:", e);
    }
  }
});
