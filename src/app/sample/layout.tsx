import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Rangat Boutique — Live Sample Store" },
  description:
    "A live sample store built by DM to Store — a mobile-first ethnic-wear boutique with WhatsApp ordering, a collection carousel, and quick view. This is a demo template, not a real shop.",
  alternates: { canonical: "/sample" },
  // Demo/portfolio page — keep the fictional boutique out of search results.
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: "/sample",
    title: "Rangat Boutique — Live Sample Store",
    description:
      "A mobile-first boutique storefront with WhatsApp ordering, built by DM to Store. Demo template.",
  },
};

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
