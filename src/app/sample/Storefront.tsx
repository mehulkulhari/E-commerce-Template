"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Catalog, CatalogImage } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/store-data";
import { useCart } from "@/lib/cart";
import Cart from "./Cart";
import styles from "./sample.module.css";

/* ── SWAP for a real client ───────────────────────────────────────
   PHONE / instagram : the client's WhatsApp number and profile
   IS_DEMO_BRAND     : set to false once the brand on the page is theirs
   Products & photos : don't edit them here. Put them in catalog/ and run
                       `npm run catalog`. See catalog/README.md.
   ─────────────────────────────────────────────────────────────── */
const IS_DEMO_BRAND = false;
const STORE_KEY = "impact:saved";

/* Saved pieces live in localStorage, read through useSyncExternalStore so the
   server render and first client render agree and other open tabs stay in sync. */
const savedListeners = new Set<() => void>();
let memorySaved = "[]"; // used when storage is blocked (private mode, some in-app browsers)
const savedStore = {
  read: (): string => {
    try { return window.localStorage.getItem(STORE_KEY) ?? "[]"; } catch { return memorySaved; }
  },
  write: (ids: string[]) => {
    memorySaved = JSON.stringify(ids);
    try { window.localStorage.setItem(STORE_KEY, memorySaved); } catch { /* storage blocked: memory only */ }
    savedListeners.forEach((notify) => notify());
  },
  subscribe: (onChange: () => void) => {
    savedListeners.add(onChange);
    const onStorage = (e: StorageEvent) => { if (e.key === STORE_KEY) onChange(); };
    window.addEventListener("storage", onStorage);
    return () => { savedListeners.delete(onChange); window.removeEventListener("storage", onStorage); };
  },
};
const parseSaved = (raw: string): string[] => {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

type Item = {
  id: string; code?: number; name: string; category: string; collection?: string;
  price: number; mrp?: number; colour?: string; fabric?: string; care?: string; desc?: string;
  sizes: string[]; tag?: string; inStock: boolean; featured?: boolean;
  images: CatalogImage[];
  /** Placeholder fabric tone, used only when there is no photo. */
  tone: string; motif?: string;
};

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const TONES = ["tOchre", "tIndigo", "tRose", "tSage", "tClay", "tPlum", "tSlate", "tEcru"];
const CARD_SIZES = "(min-width: 1100px) 25vw, (min-width: 760px) 33vw, 50vw";
const EDIT_SIZES = "(min-width: 1100px) 30vw, (min-width: 760px) 44vw, 78vw";
const LOOK_SIZES = "(min-width: 760px) 40vw, 100vw";
const HALF_SIZES = "(min-width: 900px) 50vw, 100vw";
const IG_SIZES = "(min-width: 980px) 17vw, (min-width: 620px) 33vw, 50vw";

/* ── Demo catalogue, shown until a real one is imported ─────────── */
type DemoInput = Omit<Item, "images" | "inStock" | "sizes"> & { sizes?: string[] };
const demo = (d: DemoInput): Item => ({ ...d, images: [], inStock: true, sizes: d.sizes ?? LETTER_SIZES });

const DEMO_ITEMS: Item[] = [
  demo({ id: "p1", name: "Marigold Anarkali Set", category: "Suit Sets", collection: "The Festive Edit", price: 2199, mrp: 3299, tone: "tOchre", tag: "New", featured: true, colour: "Marigold", fabric: "Georgette with gota detail", care: "Dry clean only", desc: "A floor-length anarkali cut for movement, finished with fine gota work at the hem. Comes with a matching dupatta and inner." }),
  demo({ id: "p2", name: "Indigo Block-print Kurta", category: "Kurtas", collection: "Everyday Kurtas", price: 1149, mrp: 1599, tone: "tIndigo", colour: "Indigo", fabric: "Hand block-printed cotton", care: "Machine wash cold, separately", desc: "Printed by hand in natural indigo, block by block. Breathable cotton that softens with every wash." }),
  demo({ id: "p3", name: "Rani Georgette Lehenga", category: "Lehengas", collection: "The Festive Edit", price: 4899, mrp: 6500, tone: "tRose", tag: "Few left", colour: "Rani pink", fabric: "Georgette, lightly embroidered", care: "Dry clean only", desc: "A fluid georgette lehenga with a lightly embroidered blouse and a cancan lining that holds its shape all evening." }),
  demo({ id: "p4", name: "Emerald Cotton Suit Set", category: "Suit Sets", collection: "Cotton Comfort", price: 1799, mrp: 2399, tone: "tSage", colour: "Emerald", fabric: "Handloom cotton", care: "Machine wash cold", desc: "Three pieces in handloom cotton with a printed dupatta. Made for the long days between functions." }),
  demo({ id: "p5", name: "Bandhani Silk Dupatta", category: "Dupattas", collection: "The Tie-Dye Edit", price: 799, mrp: 1199, tone: "tOchre", motif: "mBandhani", sizes: ["Free size"], colour: "Haldi", fabric: "Art silk, hand-tied bandhani", care: "Dry clean recommended", desc: "Tied and dyed by hand in the old Rajasthani way, each knot slightly its own. No two pieces are identical." }),
  demo({ id: "p6", name: "Plum Chikankari Kurta", category: "Kurtas", collection: "Everyday Kurtas", price: 1349, mrp: 1899, tone: "tPlum", colour: "Plum", fabric: "Viscose with chikankari", care: "Hand wash cold", desc: "Fine chikankari worked over soft viscose. Quiet detail that shows itself up close." }),
  demo({ id: "p7", name: "Midnight Sequin Lehenga", category: "Lehengas", collection: "The Festive Edit", price: 5499, mrp: 7999, tone: "tSlate", motif: "mStripe", tag: "Festive", colour: "Midnight", fabric: "Sequin on net", care: "Dry clean only", desc: "Hand-set sequins across a net base, cut full so it catches light with every turn." }),
  demo({ id: "p8", name: "Cobalt Palazzo Set", category: "Suit Sets", collection: "Cotton Comfort", price: 1999, mrp: 2799, tone: "tIndigo", colour: "Cobalt", fabric: "Rayon blend", care: "Machine wash cold", desc: "A relaxed kurta and palazzo co-ord with a subtle all-over print. Easy to wear, easy to pack." }),
  demo({ id: "p9", name: "Ecru Chanderi Kurta", category: "Kurtas", collection: "Everyday Kurtas", price: 1599, mrp: 2199, tone: "tEcru", colour: "Ecru", fabric: "Chanderi silk cotton", care: "Dry clean recommended", desc: "Chanderi with its characteristic sheer finish and a faint gold shimmer in the weave." }),
  demo({ id: "p10", name: "Clay Leheriya Dupatta", category: "Dupattas", collection: "The Tie-Dye Edit", price: 899, mrp: 1299, tone: "tClay", motif: "mLeheriya", sizes: ["Free size"], colour: "Clay", fabric: "Chiffon, leheriya dyed", care: "Hand wash separately", desc: "The diagonal leheriya wave, rolled and dyed by hand. Light enough to carry through summer." }),
  demo({ id: "p11", name: "Sage Linen Co-ord", category: "Suit Sets", collection: "Cotton Comfort", price: 2499, mrp: 3299, tone: "tSage", tag: "New", colour: "Sage", fabric: "Pure linen", care: "Dry clean or gentle hand wash", desc: "Pure linen in a muted sage, tailored loose. Creases are part of the fabric’s character." }),
  demo({ id: "p12", name: "Rosewood Silk Lehenga", category: "Lehengas", collection: "The Festive Edit", price: 6299, mrp: 8500, tone: "tPlum", colour: "Rosewood", fabric: "Raw silk", care: "Dry clean only", desc: "Raw silk with a deep, dry lustre and a heavier fall. Built for the evening that matters most." }),
];
const DEMO_CATEGORY_ORDER = ["Kurtas", "Suit Sets", "Lehengas", "Dupattas"];
const DEMO_LOOKS = [
  { title: "Courtyard light", sub: "Festive, 01", tone: "tClay" },
  { title: "Indigo everyday", sub: "Everyday, 02", tone: "tIndigo", motif: "mLeheriya" },
  { title: "Heirloom reds", sub: "Bridal, 03", tone: "tRose" },
];

function fromCatalog(c: Catalog): Item[] {
  return c.products.map((p, i) => ({
    id: p.id, code: p.code, name: p.name, category: p.category ?? "", collection: p.collection,
    price: p.price, mrp: p.mrp, colour: p.colour, fabric: p.fabric, care: p.care, desc: p.description,
    sizes: p.sizes, tag: p.tag, inStock: p.inStock, featured: p.featured, images: p.images,
    tone: TONES[i % TONES.length],
  }));
}

// Men's apparel, body measurements in inches.
const SIZE_CHART = [
  { size: "S", chest: 36, waist: 30 },
  { size: "M", chest: 38, waist: 32 },
  { size: "L", chest: 40, waist: 34 },
  { size: "XL", chest: 42, waist: 36 },
  { size: "XXL", chest: 44, waist: 38 },
];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const pieces = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`;
const short = (s: string, n = 16) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const unique = (xs: (string | undefined)[]) => {
  const seen = new Map<string, string>();
  for (const x of xs) {
    const v = x?.trim();
    if (v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
  }
  return [...seen.values()];
};
const usesLetterSizes = (sizes: string[]) => sizes.some((s) => /^(XXS|XS|S|M|L|XL|XXL|\dXL)$/.test(s));

/* ── Icons (no emoji anywhere) ─────────────────────────────────── */
const S = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconHeart = () => <svg {...S}><path d="M12 20.5S3.8 15.4 3.8 9.9A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 8.2 2.3c0 5.5-8.2 10.6-8.2 10.6z" /></svg>;
const IconMenu = () => <svg {...S}><path d="M3 7h18M3 12h18M3 17h18" /></svg>;
const IconClose = () => <svg {...S}><path d="M6 6l12 12M18 6L6 18" /></svg>;
const IconLeft = () => <svg {...S}><path d="M15 5l-7 7 7 7" /></svg>;
const IconRight = () => <svg {...S}><path d="M9 5l7 7-7 7" /></svg>;
const IconHome = () => <svg {...S}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
const IconGrid = () => <svg {...S}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
const IconBag = () => <svg {...S}><path d="M6 7h12l1 14H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
const IconTruck = () => <svg {...S}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>;
const IconReturn = () => <svg {...S}><path d="M21 12a9 9 0 0 1-15.5 6.2" /><path d="M3 12A9 9 0 0 1 18.5 5.8" /><path d="M18.5 2v4h-4" /><path d="M5.5 22v-4h4" /></svg>;
const IconWallet = () => <svg {...S}><path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2" /><rect x="3" y="7" width="18" height="12" rx="2" /><circle cx="16.5" cy="13" r="1.2" fill="currentColor" stroke="none" /></svg>;
const IconThread = () => <svg {...S}><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M7 8h10M7 12h10M7 16h10" /></svg>;
const IconInfo = () => <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" /></svg>;
const IconInstagram = () => <svg {...S}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" /></svg>;
const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.06 24l1.68-6.16A11.9 11.9 0 0 1 .16 11.9C.16 5.33 5.5 0 12.06 0a11.8 11.8 0 0 1 8.4 3.49 11.8 11.8 0 0 1 3.48 8.42c0 6.57-5.34 11.9-11.9 11.9a11.9 11.9 0 0 1-5.7-1.45L.06 24zM6.6 20.13c1.67.99 3.27 1.58 5.44 1.58 5.45 0 9.9-4.43 9.9-9.88a9.86 9.86 0 0 0-9.88-9.9C6.6 1.93 2.16 6.36 2.16 11.8c0 2.28.67 3.99 1.79 5.79l-1 3.63 3.65-.99zM18 14.6c-.07-.12-.27-.2-.56-.35-.3-.15-1.76-.87-2.03-.96-.27-.1-.47-.15-.66.15-.2.3-.76.95-.93 1.15-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41z" />
  </svg>
);

/** Fabric placeholder used when there's no photo. */
function Swatch({ tone, motif }: { tone: string; motif?: string }) {
  const t = styles[tone as keyof typeof styles] as string;
  const m = motif ? (styles[motif as keyof typeof styles] as string) : "";
  return <span className={`${styles.ph} ${t} ${m}`} aria-hidden="true" />;
}

/** A real photo when one exists, otherwise the fabric placeholder. */
function Media({ img, tone, motif, alt = "", sizes, preload }: {
  img?: CatalogImage; tone?: string; motif?: string; alt?: string; sizes: string; preload?: boolean;
}) {
  if (!img) return <Swatch tone={tone ?? "tEcru"} motif={motif} />;
  return (
    <Image
      src={img.src} alt={alt} fill sizes={sizes} preload={preload}
      placeholder={img.blur ? "blur" : "empty"} blurDataURL={img.blur}
      className={`${styles.ph} ${styles.photo}`}
    />
  );
}

type Look = { key: string; title: string; sub: string; img?: CatalogImage; tone: string; motif?: string; href?: string; shop?: string; item?: Item };

export default function Storefront({ catalog, settings }: { catalog: Catalog; settings: StoreSettings }) {
  const { brand, whatsappPhone, instagram, upiVpa, upiName, announcements } = settings;
  const wa = useCallback((msg: string) => `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`, [whatsappPhone]);
  const live = catalog.products.length > 0;
  const items = useMemo<Item[]>(() => (live ? fromCatalog(catalog) : DEMO_ITEMS), [live, catalog]);
  const categories = useMemo(() => {
    const found = unique(items.map((i) => i.category));
    return live ? found : DEMO_CATEGORY_ORDER.filter((c) => found.includes(c));
  }, [items, live]);
  /* Carousel edits: named collections if the CSV has two or more, else categories. */
  const edits = useMemo(() => {
    const named = unique(items.map((i) => i.collection));
    const groups = named.length >= 2
      ? named.map((n) => ({ key: `k:${n}`, name: n, members: items.filter((i) => i.collection === n) }))
      : categories.map((c) => ({ key: `c:${c}`, name: c, members: items.filter((i) => i.category === c) }));
    return groups.filter((g) => g.members.length > 0);
  }, [items, categories]);

  const [year] = useState(() => new Date().getFullYear());
  const [filter, setFilter] = useState<string>("all"); // "all" | "saved" | "c:<category>" | "k:<collection>"
  const [sort, setSort] = useState("featured");
  const savedRaw = useSyncExternalStore(savedStore.subscribe, savedStore.read, () => "[]");
  // Drop saved ids for pieces that are no longer in the catalogue.
  const saved = useMemo(() => parseSaved(savedRaw).filter((id) => items.some((i) => i.id === id)), [savedRaw, items]);
  const [quick, setQuick] = useState<Item | null>(null);
  const [shot, setShot] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [sizeHint, setSizeHint] = useState(false);
  const bag = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [info, setInfo] = useState<"shipping" | "contact" | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const anyModal = Boolean(quick) || guideOpen || Boolean(info);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Reveal static sections on first view (product cards animate on mount instead) */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        (e.target as HTMLElement).style.transitionDelay = `${Math.min(i, 6) * 80}ms`;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -5% 0px" });
    els.forEach((el) => io.observe(el));
    const failsafe = setTimeout(() => els.forEach((el) => el.classList.add("in")), 2600);
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, []);

  /* Carousel: highlight the centred edit */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(`.${styles.collect}`));
    const mark = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best: HTMLElement | null = null, bestD = Infinity;
      cards.forEach((c) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) { bestD = d; best = c; }
      });
      cards.forEach((c) => c.classList.toggle(styles.collectOn, c === best));
    };
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); };
    track.addEventListener("scroll", onScroll, { passive: true });
    mark();
    return () => { track.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [edits]);

  /* Modals and menu: Esc closes, background stops scrolling, focus moves to close */
  const closeAll = useCallback(() => { setQuick(null); setGuideOpen(false); setInfo(null); }, []);
  useEffect(() => {
    if (!anyModal && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { closeAll(); setMenuOpen(false); } };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 40);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; clearTimeout(t); };
  }, [anyModal, menuOpen, closeAll]);

  const toggleSave = (id: string) =>
    savedStore.write(saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id]);

  const goShop = (f: string) => {
    setFilter(f);
    setMenuOpen(false);
    requestAnimationFrame(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }));
  };
  const openQuick = (i: Item) => { setSize(null); setSizeHint(false); setShot(0); setQuick(i); };
  const addToBag = (i: Item) => {
    if (i.sizes.length > 0 && !size) { setSizeHint(true); return; }
    bag.add(i.id, size ?? "One size", 1);
    setQuick(null); // add() opens the bag drawer
  };

  const visible = useMemo(() => {
    let base = items;
    if (filter === "saved") base = items.filter((i) => saved.includes(i.id));
    else if (filter.startsWith("c:")) base = items.filter((i) => i.category === filter.slice(2));
    else if (filter.startsWith("k:")) base = items.filter((i) => i.collection === filter.slice(2));
    const out = [...base];
    if (sort === "priceLow") out.sort((a, b) => a.price - b.price);
    else if (sort === "priceHigh") out.sort((a, b) => b.price - a.price);
    else out.sort((a, b) => Number(!a.inStock) - Number(!b.inStock)); // CSV order, sold-out last
    return out;
  }, [items, filter, sort, saved]);

  const heading = filter === "all" ? "All pieces" : filter === "saved" ? "Saved pieces" : filter.slice(2);
  const cover = (members: Item[]) => members[0];

  /* Page imagery: dedicated banner photos first, then product photos, then placeholders */
  const heroImg = catalog.site.hero ?? undefined;
  const heroItem = live && !heroImg ? items.find((i) => i.featured) ?? items[0] : null;
  const storyImg = catalog.site.story ?? (live ? (items[1] ?? items[0]).images[0] : undefined);

  const looks = useMemo<Look[]>(() => {
    if (catalog.site.looks.length >= 3) {
      return catalog.site.looks.slice(0, 3).map((img, n) => ({
        key: img.src, title: `Look ${String(n + 1).padStart(2, "0")}`, sub: "The lookbook", img, tone: TONES[n],
        href: wa(`Hello Impact Store, I would like to know more about look ${n + 1} from your lookbook.`),
      }));
    }
    if (!live) {
      return DEMO_LOOKS.map((l) => ({ key: l.title, ...l, href: wa(`Hello Impact Store, I would like to see the ${l.title} looks.`) }));
    }
    if (edits.length >= 3) {
      return edits.slice(0, 3).map((e) => {
        const pick = e.members[1] ?? e.members[0];
        return { key: e.key, title: e.name, sub: pieces(e.members.length), img: pick.images[1] ?? pick.images[0], tone: pick.tone, shop: e.key };
      });
    }
    return items.length >= 3
      ? items.slice(0, 3).map((i) => ({ key: i.id, title: i.name, sub: i.category || inr(i.price), img: i.images[1] ?? i.images[0], tone: i.tone, item: i }))
      : [];
  }, [catalog.site.looks, live, edits, items, wa]);

  const igTiles = live
    ? items.slice(0, 6).map((i) => ({ key: i.id, img: i.images[1] ?? i.images[0], tone: i.tone, motif: undefined as string | undefined }))
    : ["tOchre", "tRose", "tIndigo", "tSage", "tClay", "tPlum"].map((t, n) => ({ key: `${t}${n}`, img: undefined, tone: t, motif: n % 3 === 0 ? "mBandhani" : undefined }));

  const navItems = [{ key: "all", label: "Shop All" }, ...categories.slice(0, 3).map((c) => ({ key: `c:${c}`, label: c }))];
  const chips = [{ key: "all", label: "All" }, ...categories.map((c) => ({ key: `c:${c}`, label: c }))];

  const heroCopy = (
    <>
      <span className={`${styles.label} reveal`}>New season, 2026</span>
      <h1 className={`${styles.heroTitle} reveal`}>Wear the <em>impact.</em></h1>
      <p className={`${styles.heroSub} reveal`}>
        Jerseys, sneakers, tees and denim from the brands you actually want. Browse the drop,
        then order on WhatsApp in two taps.
      </p>
      <div className={`${styles.heroActions} reveal`}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => goShop("all")}>Shop all</button>
        {edits.length >= 2 && <a className={`${styles.btn} ${styles.btnLine}`} href="#collections">Shop by category</a>}
      </div>
    </>
  );

  return (
    <div className={styles.boutique}>
      {IS_DEMO_BRAND && <p className={styles.demoNote}>Demonstration template</p>}

      <div className={styles.announce} aria-label="Store announcements">
        <div className={styles.announceTrack}>
          {[...announcements, ...announcements].map((t, i) => (
            <span key={i} aria-hidden={i >= announcements.length}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
        <div className={styles.wrap}>
          <div className={styles.nav}>
            <button className={`${styles.iconBtn} ${styles.burger}`} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <IconMenu />
            </button>
            <nav className={styles.navLinks} aria-label="Primary">
              {navItems.map((n) => (
                <button key={n.key} title={n.label.length > 16 ? n.label : undefined}
                  className={`${styles.navLink} ${filter === n.key && n.key !== "all" ? styles.navLinkOn : ""}`}
                  onClick={() => goShop(n.key)}>
                  {short(n.label)}
                </button>
              ))}
              <a className={styles.navLink} href="#story">Our Story</a>
            </nav>
            <a className={styles.brand} href="#top" aria-label="Impact Store, home">
              <span className={styles.brandMark}>{brand}</span>
              <span className={styles.brandSub}>Sport · Street</span>
            </a>
            <div className={styles.navUtils}>
              <button className={`${styles.iconBtn} ${saved.length ? styles.wishOn : ""}`} onClick={() => goShop("saved")}
                aria-label={`Saved pieces, ${saved.length} item${saved.length === 1 ? "" : "s"}`}>
                <IconHeart />
                {saved.length > 0 && <span className={styles.count}>{saved.length}</span>}
              </button>
              <button className={styles.iconBtn} onClick={bag.openCart}
                aria-label={`Bag, ${bag.count} item${bag.count === 1 ? "" : "s"}`}>
                <IconBag />
                {bag.count > 0 && <span className={styles.cartCount}>{bag.count}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className={styles.menuOverlay} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={styles.menuTop}>
            <span className={styles.brandMark}>{brand}</span>
            <button ref={closeRef} className={styles.iconBtn} onClick={() => setMenuOpen(false)} aria-label="Close menu"><IconClose /></button>
          </div>
          <nav className={styles.menuLinks} aria-label="Mobile">
            <button className={styles.menuLink} onClick={() => goShop("all")}>Shop All</button>
            {categories.map((c) => (
              <button key={c} className={styles.menuLink} onClick={() => goShop(`c:${c}`)}>{c}</button>
            ))}
            <a className={styles.menuLink} href="#story" onClick={() => setMenuOpen(false)}>Our Story</a>
            <button className={styles.menuLink} onClick={() => goShop("saved")}>Saved{saved.length ? ` (${saved.length})` : ""}</button>
          </nav>
          <div className={styles.menuFoot}>
            <a className={`${styles.btn} ${styles.btnPrimary}`} href={wa("Hello Impact Store, I would like to know more about your collection.")} target="_blank" rel="noopener noreferrer">
              <IconWhatsApp /> Order on WhatsApp
            </a>
            <a className={styles.linkRule} href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>
      )}

      <main id="top">
        {/* ── Hero: wide banner photo, or a split layout around a featured product ── */}
        {heroItem ? (
          <section className={styles.heroSplit} aria-label="Featured piece">
            <div className={styles.heroSplitBody}>{heroCopy}</div>
            <button className={styles.heroSplitMedia} onClick={() => openQuick(heroItem)} aria-label={`View ${heroItem.name}`}>
              <Media img={heroItem.images[0]} tone={heroItem.tone} sizes={HALF_SIZES} preload />
              <span className={styles.heroCaption}>
                <span>Featured</span>
                <b>{heroItem.name}</b>
                <span>{inr(heroItem.price)}</span>
              </span>
            </button>
          </section>
        ) : (
          <section className={styles.hero} aria-label="The collection">
            <div className={styles.heroMedia}>
              <Media img={heroImg} tone="tOchre" sizes="100vw" preload />
              <div className={styles.heroScrim} />
              <div className={styles.heroInner}><div className={styles.wrap}>{heroCopy}</div></div>
            </div>
          </section>
        )}

        {/* ── Trust row ── */}
        <div className={styles.trustRow}>
          <div className={styles.trustInner}>
            <div className={styles.trustItem}><IconTruck />Shipping above ₹1,999</div>
            <div className={styles.trustItem}><IconReturn />7-day exchange</div>
            <div className={styles.trustItem}><IconWallet />Cash on delivery</div>
            <div className={styles.trustItem}><IconThread />100% authentic</div>
          </div>
        </div>

        {/* ── Categories ── */}
        {categories.length >= 2 && (
          <section className={styles.sectionTight}>
            <div className={styles.wrap}>
              <div className={`${styles.secHead} ${styles.secHeadCenter} reveal`}>
                <span className={styles.label}>Shop by category</span>
                <h2 className={styles.secTitle}>Find your fit</h2>
              </div>
              <div className={`${styles.cats} reveal`}>
                {[{ key: "all", label: "Shop All", item: items[0] }, ...categories.map((c) => ({ key: `c:${c}`, label: c, item: cover(items.filter((i) => i.category === c)) }))].map((c) => (
                  <button key={c.key} className={styles.cat} onClick={() => goShop(c.key)}>
                    <span className={styles.catCircle}><Media img={c.item?.images[0]} tone={c.item?.tone} motif={c.item?.motif} sizes="88px" /></span>
                    <span className={styles.catName}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Edits carousel ── */}
        {edits.length >= 2 && (
          <section id="collections" className={styles.section}>
            <div className={styles.wrap}>
              <div className={`${styles.secHead} reveal`}>
                <div>
                  <span className={styles.label}>The edits</span>
                  <h2 className={styles.secTitle}>Collections</h2>
                </div>
                <p className={styles.secNote}>Tap an edit to see every piece in it.</p>
              </div>
            </div>
            <div className={`${styles.carousel} reveal`}>
              <button className={`${styles.arw} ${styles.prev}`} aria-label="Previous edits"
                onClick={() => trackRef.current?.scrollBy({ left: -(trackRef.current.clientWidth * 0.6), behavior: "smooth" })}>
                <IconLeft />
              </button>
              <div className={styles.track} ref={trackRef}>
                {edits.map((e) => {
                  const c = cover(e.members);
                  return (
                    <button key={e.key} className={styles.collect} onClick={() => goShop(e.key)}>
                      <span className={styles.collectMedia}><Media img={c.images[0]} tone={c.tone} motif={c.motif} sizes={EDIT_SIZES} /></span>
                      <span className={styles.collectCap}>
                        <span className={styles.collectCount}>{pieces(e.members.length)}</span>
                        <span className={styles.collectName}>{e.name}</span>
                        <span className={styles.collectGo}>View the edit →</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button className={`${styles.arw} ${styles.next}`} aria-label="Next edits"
                onClick={() => trackRef.current?.scrollBy({ left: trackRef.current.clientWidth * 0.6, behavior: "smooth" })}>
                <IconRight />
              </button>
            </div>
          </section>
        )}

        {/* ── Product grid ── */}
        <section id="shop" className={styles.section}>
          <div className={styles.wrap}>
            <div className={`${styles.secHead} reveal`}>
              <div>
                <span className={styles.label}>The collection</span>
                <h2 className={styles.secTitle}>{heading}</h2>
              </div>
            </div>

            <div className={styles.shopBar}>
              <div className={styles.chips} role="group" aria-label="Filter by category">
                {chips.map((f) => (
                  <button key={f.key} className={`${styles.chip} ${filter === f.key ? styles.chipOn : ""}`} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
                {filter.startsWith("k:") && (
                  <button className={`${styles.chip} ${styles.chipOn}`} aria-pressed="true" onClick={() => setFilter("all")} aria-label={`Clear ${filter.slice(2)} filter`}>
                    {filter.slice(2)} ×
                  </button>
                )}
                {saved.length > 0 && (
                  <button className={`${styles.chip} ${filter === "saved" ? styles.chipOn : ""}`} aria-pressed={filter === "saved"} onClick={() => setFilter("saved")}>
                    Saved ({saved.length})
                  </button>
                )}
              </div>
              <div className={styles.sortWrap}>
                <span className={styles.resultCount}>{pieces(visible.length)}</span>
                <label className={styles.sortLabel} htmlFor="sort">Sort</label>
                <select id="sort" className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="priceLow">Price, low to high</option>
                  <option value="priceHigh">Price, high to low</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              {visible.map((p) => (
                <article className={`${styles.card} ${p.inStock ? "" : styles.soldOut}`} key={p.id}>
                  <div className={styles.cardMedia}>
                    <Media img={p.images[0]} tone={p.tone} motif={p.motif} sizes={CARD_SIZES} alt={p.colour ? `${p.name}, ${p.colour}` : p.name} />
                    {p.images[1] && (
                      <Image src={p.images[1].src} alt="" fill sizes={CARD_SIZES} className={`${styles.ph} ${styles.photo} ${styles.altImg}`} />
                    )}
                    {(!p.inStock || p.tag) && <span className={styles.cardTag}>{p.inStock ? p.tag : "Sold out"}</span>}
                    <button className={`${styles.wishBtn} ${saved.includes(p.id) ? styles.wishOn : ""}`} onClick={() => toggleSave(p.id)}
                      aria-pressed={saved.includes(p.id)} aria-label={`${saved.includes(p.id) ? "Remove" : "Save"} ${p.name}`}>
                      <IconHeart />
                    </button>
                    <button className={styles.quickBar} onClick={() => openQuick(p)}>Quick view</button>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardName}>{p.name}</h3>
                    {(p.colour || p.category) && <span className={styles.cardMeta}>{p.colour || p.category}</span>}
                    <span className={styles.cardPrice}>
                      {inr(p.price)}{p.mrp && p.mrp > p.price ? <span className={styles.mrp}>{inr(p.mrp)}</span> : null}
                    </span>
                  </div>
                </article>
              ))}
              {visible.length === 0 && (
                <p className={styles.empty}>Nothing saved yet. Tap the heart on a piece to keep it here.</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Lookbook ── */}
        {looks.length === 3 && (
          <section className={styles.sectionTight}>
            <div className={styles.wrap}>
              <div className={`${styles.secHead} ${styles.secHeadCenter} reveal`}>
                <span className={styles.label}>Campaign</span>
                <h2 className={styles.secTitle}>The lookbook</h2>
              </div>
            </div>
            <div className={`${styles.lookGrid} reveal`}>
              {looks.map((l) => {
                const inner = (
                  <>
                    <Media img={l.img} tone={l.tone} motif={l.motif} sizes={LOOK_SIZES} />
                    <span className={styles.lookCap}><span>{l.sub}</span><b>{l.title}</b></span>
                  </>
                );
                return l.href ? (
                  <a key={l.key} className={styles.lookTile} href={l.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                ) : (
                  <button key={l.key} className={styles.lookTile} onClick={() => (l.item ? openQuick(l.item) : goShop(l.shop ?? "all"))}>{inner}</button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Craft story ── */}
        <section id="story" className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.split}>
              <div className={`${styles.splitMedia} reveal`}>
                <Media img={storyImg} tone="tEcru" sizes={HALF_SIZES} alt={catalog.site.story ? "Impact Store" : ""} />
              </div>
              <div className={`${styles.splitBody} reveal`}>
                <span className={styles.label}>Our story</span>
                <h2>Only the gear worth wearing.</h2>
                <p>
                  Impact Store started as a way to get authentic sportswear and streetwear to people who
                  care how they look, without the markup and the endless wait. Jerseys, sneakers, tees,
                  shirts and denim from the brands you actually want.
                </p>
                <p>
                  Every piece is checked before it ships. If it is not right, we would rather hold it
                  back than send it out.
                </p>
                <p className={styles.quote}>“We stock what we would wear ourselves, and nothing we would not.”</p>
                <div style={{ marginTop: "1.8rem" }}>
                  <a className={`${styles.btn} ${styles.btnLine}`} href={wa("Hello Impact Store, I have a question about sizing and fabric.")} target="_blank" rel="noopener noreferrer">
                    Talk to us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Instagram ──
            Honest social proof: the shop's own feed. No invented customer reviews
            (Consumer Protection Act 2019 / ASCI). */}
        <section className={`${styles.sectionTight} ${styles.band}`}>
          <div className={styles.wrap}>
            <div className={`${styles.secHead} ${styles.secHeadCenter} reveal`}>
              <span className={styles.label}>@impact.store</span>
              <h2 className={styles.secTitle}>Follow along</h2>
              <p className={styles.secNote}>New drops land on Instagram first. Tag us when your order arrives.</p>
            </div>
            <div className={`${styles.igGrid} reveal`}>
              {igTiles.map((t) => (
                <a key={t.key} className={styles.igTile} href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Open our Instagram">
                  <Media img={t.img} tone={t.tone} motif={t.motif} sizes={IG_SIZES} />
                  <span className={styles.igMark}><IconInstagram /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className={styles.section}>
          <div className={styles.wrap}>
            <div className={`${styles.newsInner} reveal`}>
              <div>
                <span className={styles.label}>The list</span>
                <h2 className={styles.secTitle}>First look at every drop.</h2>
              </div>
              <div>
                {subscribed ? (
                  <p className={styles.nlMsg} role="status">Thank you. We will be in touch before the next drop.</p>
                ) : (
                  /* ACTION REQUIRED before launch: connect this to a real provider
                     (Brevo, Mailchimp). It does not store anything today. */
                  <form className={styles.nlForm} onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}>
                    <input type="email" required placeholder="Email address" aria-label="Email address" autoComplete="email" />
                    <button className={styles.nlBtn} type="submit">Subscribe</button>
                  </form>
                )}
                <p className={styles.nlNote}>No more than two emails a month. Unsubscribe any time.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footTop}>
            <div>
              <span className={styles.brandMark}>{brand}</span>
              <p className={styles.footBrandBlurb}>Authentic sportswear and streetwear. Shipped across India.</p>
              <div className={styles.payRow}><span>UPI</span><span>Cards</span><span>Net banking</span><span>COD</span></div>
            </div>
            <div className={styles.footCol}>
              <h4>Shop</h4>
              <ul>
                <li><button onClick={() => goShop("all")}>Shop all</button></li>
                {categories.slice(0, 6).map((c) => (
                  <li key={c}><button onClick={() => goShop(`c:${c}`)}>{c}</button></li>
                ))}
              </ul>
            </div>
            <div className={styles.footCol}>
              <h4>Help</h4>
              <ul>
                <li><button onClick={() => setGuideOpen(true)}>Size guide</button></li>
                <li><button onClick={() => setInfo("shipping")}>Shipping and returns</button></li>
                <li><button onClick={() => setInfo("contact")}>Contact us</button></li>
                <li><a href={wa("Hello Impact Store, I need help with an order.")} target="_blank" rel="noopener noreferrer">WhatsApp us</a></li>
              </ul>
            </div>
            <div className={styles.footCol}>
              <h4>About</h4>
              <ul>
                <li><a href="#story">Our story</a></li>
                <li><a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="/legal/privacy-policy">Privacy policy</a></li>
                <li><a href="/legal/terms">Terms of service</a></li>
                <li><a href="/legal/refund">Refund policy</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footBottom}>
            <span>© {year} Impact Store.{IS_DEMO_BRAND ? " Demonstration template." : ""}</span>
            <span>Built by DM to Store</span>
          </div>
        </div>
      </footer>

      {/* ── Mobile dock ── */}
      <nav className={styles.dock} aria-label="Quick navigation">
        <a href="#top" className={styles.dockOn} aria-label="Top"><IconHome /></a>
        <a href={edits.length >= 2 ? "#collections" : "#shop"} aria-label="Collections"><IconGrid /></a>
        <button onClick={bag.openCart} aria-label={`Bag, ${bag.count} item${bag.count === 1 ? "" : "s"}`}>
          <IconBag />
          {bag.count > 0 && <span className={styles.cartCount}>{bag.count}</span>}
        </button>
        <button onClick={() => goShop("saved")} aria-label={`Saved, ${saved.length} items`}>
          <IconHeart />
          {saved.length > 0 && <span className={styles.count}>{saved.length}</span>}
        </button>
        <a className={styles.dockWa} href={wa("Hello Impact Store!")} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><IconWhatsApp /></a>
      </nav>

      {/* ── Quick view ── */}
      {quick && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={quick.name}
          onClick={(e) => { if (e.target === e.currentTarget) setQuick(null); }}>
          <div className={styles.modal}>
            <div className={styles.modalMedia}>
              <Media key={shot} img={quick.images[shot]} tone={quick.tone} motif={quick.motif} sizes="(min-width: 700px) 440px, 100vw"
                alt={`${quick.name}${quick.images.length > 1 ? `, photo ${shot + 1} of ${quick.images.length}` : ""}`} />
              {quick.images.length > 1 && (
                <div className={styles.thumbs} role="group" aria-label="Photos">
                  {quick.images.map((im, n) => (
                    <button key={im.src} className={`${styles.thumb} ${n === shot ? styles.thumbOn : ""}`} onClick={() => setShot(n)}
                      aria-pressed={n === shot} aria-label={`Show photo ${n + 1}`}>
                      <Image src={im.src} alt="" fill sizes="48px" className={styles.photo} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button ref={closeRef} className={styles.closeBtn} onClick={() => setQuick(null)} aria-label="Close quick view"><IconClose /></button>
            <div className={styles.modalBody}>
              <span className={styles.label}>{quick.inStock ? (quick.colour || quick.category) : "Sold out"}</span>
              <h3 className={styles.modalName}>{quick.name}</h3>
              <p className={styles.modalPrice}>
                {inr(quick.price)}{quick.mrp && quick.mrp > quick.price ? <span className={styles.mrp}>{inr(quick.mrp)}</span> : null}
              </p>
              {quick.desc && <p className={styles.modalDesc}>{quick.desc}</p>}

              {(quick.fabric || quick.care || quick.code) && (
                <dl className={styles.specs}>
                  {quick.fabric && <div className={styles.specRow}><dt>Fabric</dt><dd>{quick.fabric}</dd></div>}
                  {quick.care && <div className={styles.specRow}><dt>Care</dt><dd>{quick.care}</dd></div>}
                  {quick.code && <div className={styles.specRow}><dt>Code</dt><dd>#{quick.code}</dd></div>}
                </dl>
              )}

              {quick.inStock && quick.sizes.length > 0 && (
                <>
                  <div className={styles.sizeHead}>
                    <span className={styles.label}>Size</span>
                    {usesLetterSizes(quick.sizes) && <button className={styles.sizeLink} onClick={() => setGuideOpen(true)}>Size guide</button>}
                  </div>
                  <div className={styles.sizes}>
                    {quick.sizes.map((s) => (
                      <button key={s} className={`${styles.size} ${size === s ? styles.sizeOn : ""}`} aria-pressed={size === s} onClick={() => setSize(s)}>{s}</button>
                    ))}
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                {quick.inStock ? (
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => addToBag(quick)}>
                    <IconBag /> Add to bag
                  </button>
                ) : (
                  <a className={`${styles.btn} ${styles.btnLine}`} target="_blank" rel="noopener noreferrer"
                    href={wa(`Hello Impact Store, will the ${quick.name}${quick.code ? ` (code #${quick.code})` : ""} be back in stock?`)}>
                    Ask about restock
                  </a>
                )}
                <button className={`${styles.btn} ${styles.btnSoft}`} onClick={() => toggleSave(quick.id)} aria-pressed={saved.includes(quick.id)}>
                  {saved.includes(quick.id) ? "Saved" : "Save"}
                </button>
              </div>
              {quick.inStock && sizeHint && !size && <p className={styles.cartError}>Please choose a size first.</p>}
              <p className={styles.modalNote}><IconInfo /> Dispatched in 2 to 3 working days.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Size guide ── */}
      {guideOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Size guide"
          onClick={(e) => { if (e.target === e.currentTarget) setGuideOpen(false); }}>
          <div className={styles.guide}>
            <button ref={quick ? undefined : closeRef} className={styles.closeBtn} onClick={() => setGuideOpen(false)} aria-label="Close size guide"><IconClose /></button>
            <span className={styles.label}>Measurements</span>
            <h3 className={styles.modalName} style={{ marginTop: ".5rem" }}>Size guide</h3>
            <div className={styles.tableScroll}>
              <table className={styles.guideTable}>
                <caption className="sr-only">Body measurements in inches</caption>
                <thead><tr><th scope="col">Size</th><th scope="col">Chest</th><th scope="col">Waist</th></tr></thead>
                <tbody>
                  {SIZE_CHART.map((r) => (
                    <tr key={r.size}><th scope="row">{r.size}</th><td>{r.chest}&quot;</td><td>{r.waist}&quot;</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.guideNote}>
              Body measurements in inches, not the garment, and approximate. Fits vary by brand. If you
              are between two sizes, take the larger one. Shoes are in UK sizes. Unsure? Send us the
              product and your size on WhatsApp and we will help you get it right.
            </p>
          </div>
        </div>
      )}

      {/* ── Shipping / contact ── */}
      {info && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={info === "shipping" ? "Shipping and returns" : "Contact us"}
          onClick={(e) => { if (e.target === e.currentTarget) setInfo(null); }}>
          <div className={styles.guide}>
            <button ref={closeRef} className={styles.closeBtn} onClick={() => setInfo(null)} aria-label="Close"><IconClose /></button>
            {info === "shipping" ? (
              <>
                <span className={styles.label}>Good to know</span>
                <h3 className={styles.modalName} style={{ marginTop: ".5rem" }}>Shipping and returns</h3>
                <div className={styles.infoBody}>
                  <div><h4>Dispatch</h4><p>Orders are dispatched within 2 to 3 working days.</p></div>
                  <div><h4>Delivery</h4><p>Typically 3 to 7 working days across India. Shipping is free on orders above ₹1,999.</p></div>
                  <div><h4>Cash on delivery</h4><p>Available on most pin codes. We will confirm on WhatsApp when you order.</p></div>
                  <div><h4>Returns</h4><p>Seven days from delivery for an unworn piece with tags intact. Message us on WhatsApp and we will arrange it.</p></div>
                  <div><h4>Authenticity</h4><p>We stock authentic pieces only. If anything arrives not as described, we will make it right.</p></div>
                </div>
              </>
            ) : (
              <>
                <span className={styles.label}>Say hello</span>
                <h3 className={styles.modalName} style={{ marginTop: ".5rem" }}>Contact us</h3>
                <div className={styles.infoBody}>
                  <div><h4>WhatsApp</h4><p>The fastest way to reach us. A real person replies, usually within the hour.</p></div>
                  <div><h4>Where</h4><p>Online store, shipping across India.</p></div>
                  <div><h4>Hours</h4><p>Monday to Saturday, 10am to 8pm IST.</p></div>
                </div>
                <div style={{ marginTop: "1.6rem", display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <a className={`${styles.btn} ${styles.btnPrimary}`} href={wa("Hello Impact Store!")} target="_blank" rel="noopener noreferrer"><IconWhatsApp /> Message us</a>
                  <a className={`${styles.btn} ${styles.btnSoft}`} href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Shopping bag + checkout ── */}
      <Cart items={items} config={{ brand, phone: whatsappPhone, upiVpa, upiName, wa }} />
    </div>
  );
}
