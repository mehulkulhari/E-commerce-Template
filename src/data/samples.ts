import { catalog } from "@/lib/catalog";
import type { Genre, SpecProduct, StoreSpec } from "@/lib/store-spec";

/* Sample shops for the /templates showcase. Apparel uses the Impact Store
   catalogue; handicrafts and jewellery use invented pieces with placeholder
   visuals until real sample photos are added. No prospect data lives here. */

const item = (n: number, name: string, category: string, price: number, mrp?: number, extra: Partial<SpecProduct> = {}): SpecProduct =>
  ({ id: `s${n}`, n, name, category, price, mrp, images: [], ...extra });

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
  city: "Jodhpur",
  tagline: "Handwoven decor for naturally beautiful homes",
  products: [
    item(1, "Ripple Bamboo Pendant Lamp", "Lampshades", 1699, 3499, { material: "Bamboo", tag: "Bestseller" }),
    item(2, "Vanya Round Willow Basket", "Baskets", 499, 799, { material: "Willow" }),
    item(3, "Leher Wave Basket, Set of 3", "Baskets", 2499, 3299, { material: "Willow" }),
    item(4, "Sabai Grass Butterfly Handbag", "Handbags", 2499, 3299, { material: "Sabai grass" }),
    item(5, "Moonj Grass Coaster Set", "Coasters", 399, 599, { material: "Moonj grass" }),
    item(6, "Cane Planter Stand", "Planters", 1299, 1799, { material: "Cane" }),
    item(7, "Blue Pottery Table Planter", "Planters", 899, undefined, { material: "Blue pottery", tag: "New" }),
    item(8, "Handwoven Jute Placemats, Set of 4", "Placemats", 799, 1099, { material: "Jute" }),
    item(9, "Petal Weave Pendant Lamp", "Lampshades", 2699, 4499, { material: "Bamboo" }),
    item(10, "Kashmir Willow Hamper Tray", "Baskets", 1299, 1799, { material: "Willow" }),
    item(11, "Block-printed Cushion Cover", "Textiles", 649, 899, { material: "Cotton" }),
    item(12, "Terracotta Diya Set", "Gifting", 349, undefined, { material: "Terracotta", tag: "Festive" }),
  ],
};

const jewellery: StoreSpec = {
  slug: "jewellery",
  genre: "jewellery",
  brand: "Noor Jewels",
  handle: "noor.jewels",
  city: "Jaipur",
  products: [
    item(1, "Kundan Pearl Choker Set", "Necklaces", 1899, 2999, { material: "Gold plated", tag: "Bestseller" }),
    item(2, "Oxidised Jhumka Earrings", "Earrings", 449, 699, { material: "Oxidised silver" }),
    item(3, "American Diamond Solitaire Ring", "Rings", 699, 999, { material: "Rhodium plated" }),
    item(4, "Temple Coin Long Necklace", "Necklaces", 2499, 3499, { material: "Gold plated" }),
    item(5, "Pearl Drop Chandbali", "Earrings", 899, 1299, { material: "Gold plated", tag: "New" }),
    item(6, "Minimal Chain Anklet Pair", "Anklets", 399, 599, { material: "Silver plated" }),
    item(7, "Meenakari Bangle Set of 4", "Bangles", 1199, 1699, { material: "Gold plated" }),
    item(8, "Floral Maang Tikka", "Maang Tikka", 549, 799, { material: "Kundan" }),
    item(9, "Stackable Stone Rings, Set of 3", "Rings", 599, undefined, { material: "Rhodium plated" }),
    item(10, "Ghungroo Oxidised Anklets", "Anklets", 549, 799, { material: "Oxidised silver" }),
    item(11, "Polki Bridal Necklace Set", "Necklaces", 4999, 7499, { material: "Kundan", tag: "Bridal" }),
    item(12, "Everyday Hoop Earrings", "Earrings", 349, 499, { material: "Gold plated" }),
  ],
};

export const SAMPLES: Record<Genre, StoreSpec> = { apparel, handicrafts, jewellery };
