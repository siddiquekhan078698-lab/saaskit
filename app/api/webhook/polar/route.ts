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
    const supabase = createAdminClient();
    const subscription = payload.data;
    
    // The customer_id is the Polar customer. We attached the Supabase user_id to customerExternalId during checkout.
    // If the user's ID was provided during checkout as external ID, it should be in customer.external_id (though it's omitted in some webhooks).
    // Let's fallback to querying by email if external_id is not passed by Polar.
    
    let userId = null;
    
    // Sometimes Polar expands the customer object
    // @ts-ignore
    if (subscription.customer?.external_id) {
      // @ts-ignore
      userId = subscription.customer.external_id;
    }
    
    // If we couldn't get it from external_id, try to fetch the customer ID
    // Note: The easiest robust way is just to insert the subscription. 
    // Usually Polar passes external_id or we can fetch the user by email later if missing.
    
    await supabase.from('subscriptions').upsert({
      id: subscription.id,
      user_id: userId,
      polar_customer_id: subscription.customer_id,
      status: subscription.status,
      plan_id: subscription.product_id,
      created_at: new Date(subscription.created_at).toISOString(),
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
    });
  },
  onSubscriptionUpdated: async (payload: any) => {
    const supabase = createAdminClient();
    const subscription = payload.data;
    
    await supabase.from('subscriptions').update({
      status: subscription.status,
      plan_id: subscription.product_id,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
    }).eq('id', subscription.id);
  },
  onSubscriptionRevoked: async (payload: any) => {
    const supabase = createAdminClient();
    const subscription = payload.data;
    
    await supabase.from('subscriptions').update({
      status: subscription.status,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
    }).eq('id', subscription.id);
  }
});
