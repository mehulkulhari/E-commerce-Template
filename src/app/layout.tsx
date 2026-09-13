import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, Figtree, Fraunces } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font — no requests sent to Google at runtime (privacy-safe)
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Rangat boutique (/sample) body font — see design.md
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dmtostore.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DM to Store — Websites for Instagram Sellers · Jodhpur",
    template: "%s — DM to Store",
  },
  description:
    "Turn your Instagram DMs into a real store customers can order from. Websites for boutiques, home bakers, jewellery & handmade sellers in Jodhpur and across India.",
  keywords: [
    "website design Jodhpur",
    "Instagram seller website India",
    "WhatsApp order website",
    "small business website Jodhpur",
    "boutique website Rajasthan",
  ],
  authors: [{ name: "DM to Store" }],
  creator: "DM to Store",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "DM to Store",
    title: "DM to Store — Websites for Instagram Sellers · Jodhpur",
    description:
      "Turn your Instagram DMs into a real store customers can order from. Websites for boutiques, home bakers, jewellery & handmade sellers in Jodhpur and across India.",
    // ACTION REQUIRED: add a real OG image at /public/og-image.jpg (1200×630px)
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DM to Store — Websites for Instagram Sellers",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "DM to Store — Websites for Instagram Sellers · Jodhpur",
    description:
      "Turn your Instagram DMs into a real store. Websites for boutiques, home bakers, jewellery & handmade sellers.",
    images: ["/og-image.jpg"],
  },
};

// LocalBusiness structured data (JSON-LD)
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "DM to Store",
  description:
    "Freelance web design service for Instagram sellers. We build mobile-first websites for boutiques, home bakers, jewellery and handmade sellers across India.",
  url: SITE_URL,
  // ACTION REQUIRED: replace placeholders below with real values
  telephone: "[YOUR PHONE NUMBER]",
  email: "[YOUR EMAIL ADDRESS]",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Jodhpur",
    addressRegion: "Rajasthan",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "26.2389",
    longitude: "73.0243",
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Bank Transfer",
  openingHours: "Mo-Sa 09:00-20:00",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={`${bricolage.variable} ${figtree.variable} ${fraunces.variable} ${dmSans.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
