import type { Catalog } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/store-data";
import { instagramUrl, type StoreSpec } from "@/lib/store-spec";
import type { ApparelCopy } from "@/app/sample/Storefront";

/* Turns a StoreSpec into the props the apparel storefront (the Impact Store
   design) expects, with copy written for a clothing boutique rather than
   Impact's streetwear voice. */
export function toApparel(spec: StoreSpec): { catalog: Catalog; settings: StoreSettings; copy: ApparelCopy } {
  const catalog: Catalog = {
    version: 1,
    generatedAt: null,
    site: { hero: null, story: null, looks: [] },
    products: spec.products.map((p, i) => ({
      id: p.id,
      code: p.n,
      slug: p.id,
      name: p.name,
      price: p.price ?? 0,
      mrp: p.mrp,
      category: p.category,
      fabric: p.material,
      description: p.desc,
      sizes: p.sizes ?? [],
      tag: p.tag,
      inStock: true,
      featured: i === 0,
      images: p.images,
    })),
  };

  const at = spec.handle ? `@${spec.handle}` : spec.brand;
  const settings: StoreSettings = {
    brand: spec.brand,
    whatsappPhone: spec.whatsapp ?? "",
    upiVpa: null,
    upiName: null,
    instagram: instagramUrl(spec.handle),
    announcements: [`New at ${spec.brand}`, "Tap any piece for more photos", `Follow ${at} for new arrivals`],
    freeShipOver: 0,
    shipFee: 0,
  };

  const copy: ApparelCopy = {
    brandSub: spec.city || "Boutique",
    heroKicker: "New collection",
    heroTitle: spec.tagline || <>Dressed for <em>every</em> occasion.</>,
    heroSub: `Explore the latest pieces from ${spec.brand}, then order in a few taps.`,
    trust: ["Handpicked styles", "Help with sizing", "Order in a few taps", "Made for every occasion"],
    storyTitle: `About ${spec.brand}`,
    story: [spec.about || `${spec.brand} brings together pieces we love to wear ourselves — chosen for fabric, fit and the way they make you feel.`],
    igNote: "See our newest pieces first on Instagram.",
    footBlurb: `${spec.brand}${spec.city ? `, ${spec.city}` : ""}. Clothing for every occasion.`,
  };

  return { catalog, settings, copy };
}
