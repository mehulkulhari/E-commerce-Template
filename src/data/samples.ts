import { catalog } from "@/lib/catalog";
import type { Genre, SpecImage, SpecProduct, StoreSpec } from "@/lib/store-spec";
import photos from "./sample-images.json";

/* Sample shops for the /templates showcase. Apparel uses the Impact Store
   catalogue; handicrafts and jewellery use invented pieces with licensed
   Unsplash photos (see public/samples/CREDITS.md). No prospect data lives here. */

const item = (n: number, name: string, category: string, price: number, mrp?: number, extra: Partial<SpecProduct> = {}): SpecProduct =>
  ({ id: `s${n}`, n, name, category, price, mrp, images: [], ...extra });

/** Attach the downloaded stock photos (scripts/fetch-samples.mjs) by product number. */
const withPhotos = (genre: "handicrafts" | "jewellery", list: SpecProduct[]) =>
  list.map((p) => ({ ...p, images: ((photos[genre] as Record<string, SpecImage[]>)[String(p.n)] ?? []) }));

const apparel: StoreSpec = {
  slug: "apparel",
  genre: "apparel",
  brand: "Impact Store",
  handle: "impact.store",
  products: catalog.products.slice(0, 24).map((p, i) => ({
    id: p.id, n: p.code ?? i + 1, name: p.name, price: p.price, mrp: p.mrp, category: p.category ?? "Collection",
    images: p.images, sizes: p.sizes, tag: p.tag, desc: p.description,
  })),
};

const handicrafts: StoreSpec = {
  slug: "handicrafts",
  genre: "handicrafts",
  brand: "Kaarigar Home",
  handle: "kaarigar.home",
  city: "Jaipur",
  tagline: "Handwoven decor for naturally beautiful homes",
  about: "Kaarigar Home works with weaving families across Rajasthan and the North-East. Every lamp, basket and placemat is made by hand from cane, bamboo, seagrass and jute — slow-made pieces that bring warmth and texture into everyday rooms.",
  products: withPhotos("handicrafts", [
    item(1, "Woven Cane Cylinder Pendant Lamp", "Lampshades", 2299, 3299, { material: "Cane", tag: "Bestseller", desc: "A tall, airy cylinder of hand-woven cane that throws soft patterned light across the room. Fits a standard B22 holder." }),
    item(2, "Wicker Dome Pendant Lamp", "Lampshades", 1899, 2799, { material: "Wicker", desc: "A rounded wicker dome with an open-weave band, made for dining tables and reading corners." }),
    item(3, "Handwoven Wicker Carry Basket", "Baskets", 899, 1299, { material: "Wicker", desc: "A deep, sturdy basket with a looped handle — for fruit, picnics or a stack of throws." }),
    item(4, "Wall Basket Set of 9", "Baskets", 3499, 4999, { material: "Seagrass & cane", tag: "New", desc: "Nine flat woven baskets in mixed weaves and sizes, ready to arrange as a statement wall." }),
    item(5, "Half-moon Straw Handbag", "Handbags", 1499, 2199, { material: "Straw", desc: "A crescent-shaped straw bag with a round cane handle. Light enough for every day, pretty enough for weddings." }),
    item(6, "Woven Palm Leaf Tote", "Handbags", 1299, 1799, { material: "Palm leaf", desc: "A roomy, structured tote woven from palm leaf with leather handles." }),
    item(7, "Seagrass Placemats, Set of 2", "Placemats", 699, 999, { material: "Seagrass", desc: "Tightly coiled seagrass mats that protect the table and add an earthy layer to every meal." }),
    item(8, "Round Seagrass Trivet", "Placemats", 449, 649, { material: "Seagrass", desc: "A heat-safe round trivet for hot pots and serving dishes." }),
    item(9, "Striped Basket Planter", "Planters", 999, 1399, { material: "Jute & cotton rope", desc: "A soft woven planter cover in natural and indigo stripes. Slip your nursery pot straight in." }),
    item(10, "Terracotta Planter Collection", "Planters", 1599, undefined, { material: "Terracotta", tag: "Festive", desc: "Hand-thrown terracotta and glazed planters in mixed sizes, fired in Rajasthan kilns." }),
    item(11, "Round Woven Serving Tray", "Baskets", 1199, 1699, { material: "Rattan", desc: "A wide rattan tray with side handles — for chai, breakfast in bed or styling a coffee table." }),
    item(12, "Block-printed Cushion Covers", "Textiles", 649, 899, { material: "Cotton", desc: "Hand block-printed cotton covers in warm Rajasthani colours. 16 x 16 inches, sold individually." }),
  ]),
};

const jewellery: StoreSpec = {
  slug: "jewellery",
  genre: "jewellery",
  brand: "Noor Jewels",
  handle: "noor.jewels",
  city: "Delhi",
  about: "Everyday sparkle and festive statement pieces — plated, skin-friendly and made to be worn and loved.",
  products: withPhotos("jewellery", [
    item(1, "Kundan Pearl Necklace Set", "Necklaces", 1899, 2999, { material: "Gold plated", tag: "Bestseller", desc: "A kundan and pearl necklace with matching earrings, set with pastel stones. Comes in a gift box." }),
    item(2, "Oxidised Jhumka Earrings", "Earrings", 449, 699, { material: "Oxidised silver", desc: "Two-tone jhumkas with a fine pearl fringe. Lightweight enough to wear all day." }),
    item(3, "American Diamond Ring Trio", "Rings", 799, 1199, { material: "Gold plated", desc: "Three stackable AD rings — wear them together or apart." }),
    item(4, "Halo Solitaire Ring", "Rings", 699, 999, { material: "Rose gold plated", desc: "A halo of AD stones around a centre solitaire, on a split band." }),
    item(5, "Layered Coin Pendant Chain", "Necklaces", 599, 899, { material: "Gold plated", tag: "New", desc: "Two fine chains with a vintage coin pendant. Anti-tarnish coated." }),
    item(6, "Crystal Link Bracelet", "Bangles & Bracelets", 899, 1299, { material: "Rhodium plated", desc: "Open links set with crystal stones — party-ready on its own." }),
    item(7, "Gold-plated Bangle Pair", "Bangles & Bracelets", 549, 799, { material: "Gold plated", desc: "Textured bangles in a classic finish. Available in sizes 2.4, 2.6 and 2.8." }),
    item(8, "Stone Kada Pair", "Bangles & Bracelets", 1299, 1899, { material: "Gold plated", desc: "Broad kadas set with rows of white stones — made for weddings and festive evenings." }),
    item(9, "Silver-plated Payal Pair", "Anklets", 649, 949, { material: "Silver plated", desc: "Traditional payal with delicate drops that chime softly as you walk." }),
    item(10, "Temple Polki Necklace Set", "Necklaces", 4999, 7499, { material: "Kundan & polki", tag: "Bridal", desc: "A statement temple necklace with polki-style stones and matching earrings, for brides and bridesmaids." }),
    item(11, "Stackable Rings, Set of 12", "Rings", 699, undefined, { material: "Mixed plating", desc: "Twelve slim rings in gold, rose and silver tones to mix and stack." }),
  ]),
};

export const SAMPLES: Record<Genre, StoreSpec> = { apparel, handicrafts, jewellery };
