// First line of defence only. Every protected page and server action also
// calls requireRole() — RBAC is never middleware-only.
//
// Host split: glintapp.co.za is the marketing site; app.glintapp.co.za is
// the product. Portal/auth/pay paths on the apex bounce to the app
// subdomain, and the app subdomain's root bounces into the product.
// Localhost and *.vercel.app previews are exempt so dev keeps working.
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROUTE_ACCESS, type Role } from "@/lib/roles";

const APP_HOST = "app.glintapp.co.za";
const APP_PATH_PREFIXES = [
  "/app",
  "/tech",
  "/ops",
  "/partner",
  "/pay",
  "/sign-in",
  "/sign-up",
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const isGlintDomain = host.endsWith("glintapp.co.za");
  const isAppHost = host === APP_HOST;

  // Marketing (apex/www) never serves the product: send portal paths across.
  if (isGlintDomain && !isAppHost) {
    if (APP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.redirect(
        `https://${APP_HOST}${pathname}${search}`,
        308
      );
    }
    return NextResponse.next();
  }

  // The app subdomain never shows marketing: its root goes into the product.
  if (isAppHost && pathname === "/") {
    return NextResponse.redirect(`https://${APP_HOST}/app`, 307);
  }

  const prefix = Object.keys(ROUTE_ACCESS).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!prefix) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (!ROUTE_ACCESS[prefix].includes(token.role as Role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/app/:path*",
    "/tech/:path*",
    "/ops/:path*",
    "/partner/:path*",
    "/pay/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
