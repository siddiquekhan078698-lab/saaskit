import { Checkout } from "@polar-sh/supabase";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  successUrl: process.env.POLAR_SUCCESS_URL as string,
  returnUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // An optional URL which renders a back-button in the Checkout
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox", 
  theme: "dark", 
});
