/* One shape for every storefront template. A StoreSpec describes a shop —
   brand, genre, contact and products — and any of the three genre templates
   (apparel, handicrafts, jewellery) can render it. Prospect demo sites and the
   template showcase pages are both just StoreSpecs. */

export type Genre = "apparel" | "handicrafts" | "jewellery";
export const GENRES: Genre[] = ["apparel", "handicrafts", "jewellery"];

export type SpecImage = {
  src: string;
  width: number;
  height: number;
  /** Tiny data-URL preview shown blurred while the photo loads. */
  blur?: string;
  /** A photo of a person wearing the piece (apparel / jewellery). */
  model?: boolean;
};

export type SpecProduct = {
  id: string;
  /** 1-based number the owner uses to refer to the piece (e.g. model-shot files). */
  n: number;
  name: string;
  /** Unknown when the shop never posted a price. Templates show "Ask for price". */
  price?: number;
  mrp?: number;
  category: string;
  images: SpecImage[];
  tag?: string;
  desc?: string;
  sizes?: string[];
  /** Fabric (apparel), metal/finish (jewellery), material (handicrafts). */
  material?: string;
};

export type StoreSpec = {
  slug: string;
  genre: Genre;
  brand: string;
  /** Instagram handle, without the @. */
  handle?: string;
  tagline?: string;
  about?: string;
  city?: string;
  /** Digits with country code, e.g. 9198xxxxxxxx. Only set for real clients. */
  whatsapp?: string;
  logo?: SpecImage;
  products: SpecProduct[];
  /** Present on prospect previews: switches the site into preview mode
      (banner, no checkout, orders go to the shop's own Instagram). */
  demo?: { preparedFor: string; createdAt: string };
};

export const instagramUrl = (handle?: string) =>
  handle ? `https://www.instagram.com/${encodeURIComponent(handle)}/` : "https://www.instagram.com/";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Price line for cards: "₹1,299" or "Ask for price". */
export const priceText = (p: Pick<SpecProduct, "price">) => (p.price ? inr(p.price) : "Ask for price");

/** First regular product photo, and the first model photo (if any). */
export const mainImage = (p: SpecProduct) => p.images.find((i) => !i.model) ?? p.images[0];
export const modelImage = (p: SpecProduct) => p.images.find((i) => i.model);

export const categoriesOf = (products: SpecProduct[]) => {
  const seen = new Map<string, string>();
  for (const p of products) {
    const v = p.category?.trim();
    if (v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
  }
  return [...seen.values()];
};

/** The message a visitor sends when they want to order from a demo. */
export const orderNote = (spec: StoreSpec, p?: SpecProduct) =>
  p ? `Hi ${spec.brand}! I'd like to order: ${p.name}${p.price ? ` (${inr(p.price)})` : ""}.` : `Hi ${spec.brand}!`;
