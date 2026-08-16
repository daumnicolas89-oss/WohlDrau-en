import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS-Freigabe der Daten-Schnittstellen für die App-Hülle (Capacitor lädt
 * die Oberfläche von capacitor://localhost bzw. https://localhost und holt
 * die Daten von platzda.app). Browser-Besucher derselben Domain brauchen kein
 * CORS; fremde Websites bekommen weiterhin keine Freigabe.
 */
const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "https://localhost",
]);

function isAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Lokale Entwicklung und der lokale Test der App-Hülle.
  return /^http:\/\/localhost(:\d+)?$/.test(origin);
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  if (!isAllowed(origin)) return NextResponse.next();

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  // Preflight (z. B. vor dem Melden-POST) direkt beantworten.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
