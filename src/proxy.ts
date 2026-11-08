import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: no session cookie, no app. The real check is jarlore-be
 * verifying the token on every request (an expired token also lands on /login).
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("jarlore_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/today/:path*", "/batches/:path*", "/recipes/:path*", "/compare/:path*", "/me/:path*"],
};
