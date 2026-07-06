import { Checkout } from "@polar-sh/supabase";
import { createClient } from "@/utils/supabase/server";

const polarCheckout = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  successUrl: process.env.POLAR_SUCCESS_URL as string,
  returnUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox", 
  theme: "dark", 
});

export const GET = async (req: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const url = new URL(req.url);
    url.searchParams.set("customerExternalId", user.id);
    if (user.email) url.searchParams.set("customerEmail", user.email);
    req = new Request(url.toString(), req);
  }

  return polarCheckout(req);
};
