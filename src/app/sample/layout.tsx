import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Impact Store — Sportswear & Streetwear" },
  description:
    "Impact Store — authentic jerseys, sneakers, tees, shirts and denim from the brands you want. Browse the drop and order on WhatsApp. Shipped across India.",
  alternates: { canonical: "/sample" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/sample",
    title: "Impact Store — Sportswear & Streetwear",
    description:
      "Authentic jerseys, sneakers, tees, shirts and denim. Browse the drop and order on WhatsApp. Shipped across India.",
  },
};

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
