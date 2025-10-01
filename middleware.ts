import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4); // strip "www."
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}