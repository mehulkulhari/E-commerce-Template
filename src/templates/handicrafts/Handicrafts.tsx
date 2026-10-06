"use client";

import { useMemo, useRef, useState } from "react";
import { categoriesOf, inr, instagramUrl, mainImage, modelImage, priceText, type SpecProduct, type StoreSpec } from "@/lib/store-spec";
import DemoBanner from "../DemoBanner";
import { cormorant } from "../fonts";
import { Ico, orderHref, orderLabel, Photo, useDialog } from "../shared";
import styles from "./handicrafts.module.css";

/* Handicrafts & home decor template — warm, earthy and hand-made in feel.
   Layout follows the classic Indian craft-store pattern: announcement bar,
   centred logo, round category icons, a full-bleed hero, a bestseller rail,
   category tiles, the full collection, the maker's story, Instagram and FAQs. */

const CARD = "(min-width: 1100px) 22vw, (min-width: 720px) 30vw, 46vw";
const HALF = "(min-width: 900px) 50vw, 100vw";

const FAQS = [
  { q: "Is every piece made by hand?", a: "Yes. Each piece is made by hand, so small differences in weave, colour and finish are part of its character — no two are exactly alike." },
  { q: "Can I ask for a custom size or colour?", a: "Often, yes. Message us with what you have in mind and we will tell you what is possible and how long it will take." },
  { q: "How do I care for handmade pieces?", a: "Keep natural-fibre pieces dry and out of harsh direct sun. Dust with a soft dry cloth; avoid soaking unless the piece says it is washable." },
  { q: "How do I place an order?", a: "Tap Order on any piece and send us a message. We will confirm availability, delivery to your city and payment options." },
  { q: "Do you take gifting or bulk orders?", a: "Ask us. For festive gifting and events we can usually put together sets — the earlier you write, the more we can do." },
];

function Card({ p, i, onOpen }: { p: SpecProduct; i: number; onOpen: (p: SpecProduct) => void }) {
  const img = mainImage(p);
  const alt = modelImage(p) ?? p.images.find((x) => x !== img);
  const sale = Boolean(p.price && p.mrp && p.mrp > p.price);
  return (
    <article className={styles.card}>
      <button className={styles.cardMedia} onClick={() => onOpen(p)} aria-label={`View ${p.name}`}>
        <Photo img={img} sizes={CARD} tint={i} className={styles.ph} alt={p.name} />
        {alt && <span className={styles.cardAlt}><Photo img={alt} sizes={CARD} className={styles.ph} /></span>}
        {(sale || p.tag) && <span className={styles.badge}>{sale ? "Sale" : p.tag}</span>}
      </button>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{p.name}</h3>
        <p className={styles.price}>
          {sale && <s>{inr(p.mrp!)}</s>}
          <span>{priceText(p)}</span>
        </p>
      </div>
    </article>
  );
}

export default function Handicrafts({ spec }: { spec: StoreSpec }) {
  const products = spec.products;
  const cats = useMemo(() => categoriesOf(products), [products]);
  const [filter, setFilter] = useState<string>("all");
  const [quick, setQuick] = useState<SpecProduct | null>(null);
  const [shot, setShot] = useState(0);
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [year] = useState(() => new Date().getFullYear());
  const railRef = useRef<HTMLDivElement>(null);
  const closeRef = useDialog(Boolean(quick) || menu, () => { setQuick(null); setMenu(false); });

  const hero = products.find((p) => mainImage(p)) ?? products[0];
  const best = products.slice(0, 8);
  const visible = filter === "all" ? products : products.filter((p) => p.category === filter);
  const coverOf = (c: string) => products.find((p) => p.category === c && mainImage(p)) ?? products.find((p) => p.category === c);
  const ig = instagramUrl(spec.handle);
  const tagline = spec.tagline || "Handcrafted pieces for naturally beautiful homes";
  const about = spec.about || `${spec.brand} makes every piece by hand, with natural materials and techniques passed down through generations of Indian craft.`;

  const go = (f: string) => {
    setFilter(f);
    setMenu(false);
    requestAnimationFrame(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }));
  };
  const open = (p: SpecProduct) => { setShot(0); setQuick(p); };

  return (
    <div className={`${styles.root} ${cormorant.variable}`}>
      {spec.demo && <DemoBanner spec={spec} />}

      <div className={styles.announce}>
        <span>Handcrafted pieces</span><i />
        <span>Made in {spec.city || "India"}</span><i />
        <span>Order in a few taps</span>
      </div>

      <header className={styles.header}>
        <button className={`${styles.icon} ${styles.burger}`} onClick={() => setMenu(true)} aria-label="Open menu"><Ico.Menu /></button>
        <nav className={styles.navLeft} aria-label="Primary">
          <button onClick={() => go("all")}>Shop</button>
          <a href="#story">Our story</a>
          <a href="#faq">FAQs</a>
        </nav>
        <a className={styles.logo} href="#top" aria-label={`${spec.brand}, home`}>
          {spec.logo && <span className={styles.logoImg}><Photo img={spec.logo} sizes="48px" className={styles.ph} /></span>}
          <span className={styles.logoText}>{spec.brand}</span>
        </a>
        <div className={styles.navRight}>
          <a className={styles.icon} href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Ico.Instagram /></a>
        </div>
      </header>

      {cats.length >= 2 && (
        <nav className={styles.catRow} aria-label="Categories">
          {cats.map((c, i) => (
            <button key={c} className={styles.catIcon} onClick={() => go(c)}>
              <span className={styles.catCircle}><Photo img={coverOf(c) && mainImage(coverOf(c)!)} sizes="56px" tint={i} className={styles.ph} /></span>
              <span>{c}</span>
            </button>
          ))}
        </nav>
      )}

      <main id="top">
        <section className={styles.hero}>
          <Photo img={hero && mainImage(hero)} sizes="100vw" priority className={styles.ph} />
          <div className={styles.heroScrim} />
          <div className={styles.heroBody}>
            <h1>{tagline}</h1>
            <p>Made by hand by {spec.brand}{spec.city ? `, ${spec.city}` : ""}</p>
            <a className={styles.btnLight} href="#bestsellers">Shop our bestsellers <Ico.Arrow /></a>
          </div>
        </section>

        <section id="bestsellers" className={styles.section}>
          <div className={styles.head}>
            <h2>Bestsellers</h2>
            <span className={styles.rule} />
          </div>
          <div className={styles.railWrap}>
            <button className={`${styles.railBtn} ${styles.railPrev}`} aria-label="Previous"
              onClick={() => railRef.current?.scrollBy({ left: -railRef.current.clientWidth * 0.8, behavior: "smooth" })}><Ico.Left /></button>
            <div className={styles.rail} ref={railRef}>
              {best.map((p, i) => <Card key={p.id} p={p} i={i} onOpen={open} />)}
            </div>
            <button className={`${styles.railBtn} ${styles.railNext}`} aria-label="Next"
              onClick={() => railRef.current?.scrollBy({ left: railRef.current.clientWidth * 0.8, behavior: "smooth" })}><Ico.Right /></button>
          </div>
          <div className={styles.center}><button className={styles.btn} onClick={() => go("all")}>View all <Ico.Arrow /></button></div>
        </section>

        {cats.length >= 2 && (
          <section className={styles.section}>
            <div className={styles.head}>
              <h2>Shop by category</h2>
              <span className={styles.rule} />
            </div>
            <div className={styles.tiles}>
              {cats.slice(0, 6).map((c, i) => (
                <button key={c} className={styles.tile} onClick={() => go(c)}>
                  <Photo img={coverOf(c) && mainImage(coverOf(c)!)} sizes="(min-width: 900px) 30vw, 50vw" tint={i + 2} className={styles.ph} />
                  <span className={styles.tileLabel}>{c}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section id="shop" className={styles.section}>
          <div className={styles.head}>
            <h2>{filter === "all" ? "The collection" : filter}</h2>
            <span className={styles.rule} />
          </div>
          {cats.length >= 2 && (
            <div className={styles.chips} role="group" aria-label="Filter by category">
              {["all", ...cats].map((c) => (
                <button key={c} className={`${styles.chip} ${filter === c ? styles.chipOn : ""}`} aria-pressed={filter === c} onClick={() => setFilter(c)}>
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          )}
          <div className={styles.grid}>
            {visible.map((p, i) => <Card key={p.id} p={p} i={i} onOpen={open} />)}
          </div>
        </section>

        <section id="story" className={`${styles.section} ${styles.story}`}>
          <div className={styles.storyMedia}>
            <Photo img={products[1] ? mainImage(products[1]) : hero && mainImage(hero)} sizes={HALF} tint={3} className={styles.ph} />
          </div>
          <div className={styles.storyBody}>
            <span className={styles.eyebrow}>About us</span>
            <h2>Rooted in craft, made for everyday living.</h2>
            <p>{about}</p>
            <ul className={styles.values}>
              <li><Ico.Hand /> Made by hand</li>
              <li><Ico.Leaf /> Natural materials</li>
              <li><Ico.Gift /> Made to be gifted</li>
            </ul>
            <a className={styles.btn} href={ig} target="_blank" rel="noopener noreferrer">Discover our story</a>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.head}>
            <h2>Follow us on Instagram</h2>
            <span className={styles.rule} />
            {spec.handle && <a className={styles.handle} href={ig} target="_blank" rel="noopener noreferrer">@{spec.handle}</a>}
          </div>
          <div className={styles.igGrid}>
            {products.slice(0, 6).map((p, i) => (
              <a key={p.id} className={styles.igTile} href={ig} target="_blank" rel="noopener noreferrer" aria-label="Open Instagram">
                <Photo img={mainImage(p)} sizes="(min-width: 900px) 16vw, 33vw" tint={i} className={styles.ph} />
                <span className={styles.igMark}><Ico.Instagram /></span>
              </a>
            ))}
          </div>
        </section>

        <section id="faq" className={`${styles.section} ${styles.faqWrap}`}>
          <div className={styles.head}>
            <h2>Frequently asked questions</h2>
            <span className={styles.rule} />
          </div>
          <div className={styles.faq}>
            {FAQS.map((f, i) => (
              <div key={f.q} className={styles.faqItem}>
                <button className={styles.faqQ} aria-expanded={faq === i} onClick={() => setFaq(faq === i ? null : i)}>
                  {f.q}<span className={`${styles.faqIcon} ${faq === i ? styles.faqIconOn : ""}`}><Ico.Plus /></span>
                </button>
                {faq === i && <p className={styles.faqA}>{f.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footTop}>
          <div>
            <span className={styles.footBrand}>{spec.brand}</span>
            <p>Handmade pieces{spec.city ? ` from ${spec.city}` : ""}, made with care.</p>
          </div>
          <div className={styles.footCol}>
            <h4>Shop</h4>
            <button onClick={() => go("all")}>All products</button>
            {cats.slice(0, 5).map((c) => <button key={c} onClick={() => go(c)}>{c}</button>)}
          </div>
          <div className={styles.footCol}>
            <h4>Help</h4>
            <a href="#faq">FAQs</a>
            <a href={ig} target="_blank" rel="noopener noreferrer">Message us</a>
            <a href="#story">Our story</a>
          </div>
        </div>
        <div className={styles.footBottom}>
          <span>© {year} {spec.brand}</span>
          <span>Website by DM to Store</span>
        </div>
      </footer>

      {menu && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => { if (e.target === e.currentTarget) setMenu(false); }}>
          <div className={styles.drawer}>
            <button ref={closeRef} className={styles.icon} onClick={() => setMenu(false)} aria-label="Close menu"><Ico.Close /></button>
            <button className={styles.drawerLink} onClick={() => go("all")}>Shop all</button>
            {cats.map((c) => <button key={c} className={styles.drawerLink} onClick={() => go(c)}>{c}</button>)}
            <a className={styles.drawerLink} href="#story" onClick={() => setMenu(false)}>Our story</a>
            <a className={styles.drawerLink} href="#faq" onClick={() => setMenu(false)}>FAQs</a>
          </div>
        </div>
      )}

      {quick && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={quick.name} onClick={(e) => { if (e.target === e.currentTarget) setQuick(null); }}>
          <div className={styles.modal}>
            <button ref={closeRef} className={`${styles.icon} ${styles.modalClose}`} onClick={() => setQuick(null)} aria-label="Close"><Ico.Close /></button>
            <div className={styles.modalMedia}>
              <Photo key={shot} img={quick.images[shot]} sizes="(min-width: 760px) 420px, 100vw" className={styles.ph} alt={quick.name} />
              {quick.images[shot]?.model && <span className={styles.badge}>Styled</span>}
              {quick.images.length > 1 && (
                <div className={styles.thumbs}>
                  {quick.images.map((im, n) => (
                    <button key={im.src} className={`${styles.thumb} ${n === shot ? styles.thumbOn : ""}`} onClick={() => setShot(n)} aria-label={`Photo ${n + 1}`} aria-pressed={n === shot}>
                      <Photo img={im} sizes="52px" className={styles.ph} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalBody}>
              <span className={styles.eyebrow}>{quick.category}</span>
              <h3>{quick.name}</h3>
              <p className={styles.modalPrice}>
                {quick.price && quick.mrp && quick.mrp > quick.price && <s>{inr(quick.mrp)}</s>}
                <span>{priceText(quick)}</span>
              </p>
              {quick.desc && <p className={styles.modalDesc}>{quick.desc}</p>}
              {quick.material && <p className={styles.spec}><b>Material</b>{quick.material}</p>}
              <a className={styles.btnSolid} href={orderHref(spec, quick)} target="_blank" rel="noopener noreferrer">{orderLabel(spec)}</a>
              <p className={styles.note}>Handmade, so each piece may vary slightly from the photo.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
