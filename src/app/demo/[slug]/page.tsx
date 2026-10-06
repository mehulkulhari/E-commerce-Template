import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDemo } from "@/lib/demos";
import StoreView from "@/templates/StoreView";

/* A prospect's concept preview: /demo/<unguessable-slug>. Read from the
   private demos table, rendered with the template for the shop's genre,
   always in preview mode, and kept out of search engines. */

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const spec = await getDemo(slug);
  return {
    title: { absolute: spec ? `${spec.brand} — website preview` : "Preview not found" },
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    alternates: { canonical: null },
    openGraph: spec ? { title: `${spec.brand} — website preview`, description: `A concept website made for ${spec.brand}.` } : undefined,
  };
}

export default async function DemoPage({ params }: Props) {
  const { slug } = await params;
  const spec = await getDemo(slug);
  if (!spec) notFound();
  return <StoreView spec={spec} />;
}
