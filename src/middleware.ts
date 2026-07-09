// First line of defence only. Every protected page and server action also
// calls requireRole() — RBAC is never middleware-only.
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROUTE_ACCESS, type Role } from "@/lib/roles";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const { pathname } = req.nextUrl;

  const prefix = Object.keys(ROUTE_ACCESS).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!prefix) return NextResponse.next();

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
  matcher: ["/app/:path*", "/tech/:path*", "/ops/:path*", "/partner/:path*"],
};
