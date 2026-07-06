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
      const s = payload.data;

      // Polar SDK converts snake_case JSON -> camelCase objects
      // e.g. customer_id -> customerId, product_id -> productId, etc.
      const userId: string | null = s.customer?.externalId ?? s.customer?.external_id ?? null;
      const customerEmail: string | null = s.customer?.email ?? null;
      const polarCustomerId: string | null = s.customerId ?? s.customer_id ?? null;
      const planId: string | null = s.productId ?? s.product_id ?? null;
      const periodEnd: string | null = s.currentPeriodEnd ?? s.current_period_end ?? null;

      console.log("onSubscriptionCreated →", { id: s.id, userId, planId, polarCustomerId, status: s.status });

      const { error } = await supabase.from('subscriptions').upsert({
        id: s.id,
        user_id: userId,
        email: customerEmail,
        polar_customer_id: polarCustomerId,
        status: s.status,
        plan_id: planId,
        current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
      }, { onConflict: 'id' });

      if (error) {
        console.error("Supabase upsert error in onSubscriptionCreated:", JSON.stringify(error));
      } else {
        console.log("✅ Subscription inserted:", s.id);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionCreated:", e);
    }
  },
  onSubscriptionUpdated: async (payload: any) => {
    try {
      const supabase = createAdminClient();
      const s = payload.data;

      const userId: string | null = s.customer?.externalId ?? s.customer?.external_id ?? null;
      const customerEmail: string | null = s.customer?.email ?? null;
      const polarCustomerId: string | null = s.customerId ?? s.customer_id ?? null;
      const planId: string | null = s.productId ?? s.product_id ?? null;
      const periodEnd: string | null = s.currentPeriodEnd ?? s.current_period_end ?? null;

      console.log("onSubscriptionUpdated →", { id: s.id, userId, planId, status: s.status });

      const { error } = await supabase.from('subscriptions').upsert({
        id: s.id,
        user_id: userId,
        email: customerEmail,
        polar_customer_id: polarCustomerId,
        status: s.status,
        plan_id: planId,
        current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
      }, { onConflict: 'id' });

      if (error) {
        console.error("Supabase upsert error in onSubscriptionUpdated:", JSON.stringify(error));
      } else {
        console.log("✅ Subscription updated:", s.id);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionUpdated:", e);
    }
  },
  onSubscriptionRevoked: async (payload: any) => {
    try {
      const supabase = createAdminClient();
      const s = payload.data;
      const periodEnd: string | null = s.currentPeriodEnd ?? s.current_period_end ?? null;

      console.log("onSubscriptionRevoked →", { id: s.id, status: s.status });

      const { error } = await supabase.from('subscriptions').update({
        status: s.status,
        current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
      }).eq('id', s.id);

      if (error) {
        console.error("Supabase update error in onSubscriptionRevoked:", JSON.stringify(error));
      } else {
        console.log("✅ Subscription revoked:", s.id);
      }
    } catch (e) {
      console.error("Exception in onSubscriptionRevoked:", e);
    }
  }
});
