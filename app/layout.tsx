import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { NavTracker } from "@/components/NavTracker";
import {
  ServiceWorkerRegistration,
  SplashHide,
} from "@/components/ServiceWorkerRegistration";

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
  metadataBase: new URL("https://www.platzda.app"),
  title: "PlatzDa, wo es sich jetzt lohnt, rauszugehen",
  description:
    "Findet Spielplätze, Parks und Wäldchen in deiner Nähe und rechnet aus, wie viel Schatten dort in dieser Stunde wirklich liegt.",
  applicationName: "PlatzDa",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PlatzDa",
    statusBarStyle: "default",
  },
  /* Der wichtigste Verbreitungsweg der Seite ist der Link im
     Eltern-Gruppenchat – ohne diese Angaben zeigt die Vorschau dort
     nur nackten Text. Das Bild liegt als app/opengraph-image.png bei. */
  openGraph: {
    title: "PlatzDa – wo es mit Kind jetzt schön draußen ist",
    description:
      "Findet Spielplätze, Parks und Wäldchen in deiner Nähe und rechnet aus, wie viel Schatten dort in dieser Stunde wirklich liegt.",
    url: "https://www.platzda.app",
    siteName: "PlatzDa",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
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
        <SplashHide />
      </body>
    </html>
  );
}
