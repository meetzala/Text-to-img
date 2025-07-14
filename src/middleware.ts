import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware is a placeholder since we're using client-side authentication
// In a production app, you would implement server-side authentication checks here
export function middleware(request: NextRequest) {
  // The actual auth checks are done in the client components
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
