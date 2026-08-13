import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { NavTracker } from "@/components/NavTracker";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlatzDa, wo es sich jetzt lohnt, rauszugehen",
  description:
    "Zeigt in Echtzeit, welche Spielplätze und Parks in deiner Nähe gerade angenehm sind: Schatten, Toilette, Zaun, Entfernung.",
  applicationName: "PlatzDa",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PlatzDa",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2A9D8F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh bg-background text-body antialiased">
        {children}
        <NavTracker />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
