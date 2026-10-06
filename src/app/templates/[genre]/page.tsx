import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SAMPLES } from "@/data/samples";
import { GENRES, type Genre } from "@/lib/store-spec";
import StoreView from "@/templates/StoreView";

/* Template showcase: /templates/apparel, /templates/handicrafts,
   /templates/jewellery — each genre rendered with a sample shop. */

export const dynamicParams = false;
export const generateStaticParams = () => GENRES.map((genre) => ({ genre }));

const TITLES: Record<Genre, string> = {
  apparel: "Apparel store template",
  handicrafts: "Handicrafts store template",
  jewellery: "Jewellery store template",
};

type Props = { params: Promise<{ genre: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { genre } = await params;
  return {
    title: TITLES[genre as Genre] ?? "Template",
    robots: { index: false, follow: true },
  };
}

export default async function TemplatePage({ params }: Props) {
  const { genre } = await params;
  const spec = SAMPLES[genre as Genre];
  if (!spec) notFound();
  return <StoreView spec={spec} />;
}
