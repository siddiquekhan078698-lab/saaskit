import { CustomerPortal } from "@polar-sh/supabase";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  getCustomerId: async (event) => {
    // TODO: Resolve the Polar Customer ID using Supabase auth data from the event/request
    return "";
  },
  returnUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});
