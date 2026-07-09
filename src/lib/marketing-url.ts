import { headers } from "next/headers";

// On app.glintapp.co.za the root path redirects into the product, so a
// plain "/" link from the auth pages loops back to sign-in. Send those
// visitors to the marketing site instead; everywhere else "/" is correct.
export async function marketingHomeHref(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  return host === "app.glintapp.co.za" ? "https://www.glintapp.co.za" : "/";
}
