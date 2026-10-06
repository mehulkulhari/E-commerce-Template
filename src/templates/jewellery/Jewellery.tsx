"use client";

import { useMemo, useState } from "react";
import { categoriesOf, inr, instagramUrl, mainImage, modelImage, priceText, type SpecProduct, type StoreSpec } from "@/lib/store-spec";
import DemoBanner from "../DemoBanner";
import { bodoni, jost } from "../fonts";
import { Ico, orderHref, orderLabel, Photo, useDialog } from "../shared";
import styles from "./jewellery.module.css";

/* Jewellery template — the big-catalogue pattern Indian jewellery shoppers
   know: a plum category bar, search, quick chips, filters with live counts,
   sort, soft tiles with a wishlist heart, and an "On model" view wherever the
   shop has a photo of the piece being worn. */

const CARD = "(min-width: 1100px) 22vw, (min-width: 720px) 30vw, 46vw";

type Range = { key: string; label: string; min: number; max: number };
const RANGES: Range[] = [
  { key: "u500", label: "Under ₹500", min: 0, max: 499 },
  { key: "u1000", label: "₹500 – ₹999", min: 500, max: 999 },
  { key: "u2000", label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { key: "u5000", label: "₹2,000 – ₹4,999", min: 2000, max: 4999 },
  { key: "o5000", label: "₹5,000 & above", min: 5000, max: Infinity },
];
const QUICK = [
  { key: "all", label: "All" },
  { key: "new", label: "New arrivals" },
  { key: "model", label: "See it worn" },
  { key: "u1000", label: "Under ₹999" },
];

const off = (p: SpecProduct) => (p.price && p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);

function Card({ p, i, saved, onSave, onOpen }: {
  p: SpecProduct; i: number; saved: boolean; onSave: () => void; onOpen: () => void;
}) {
  const img = mainImage(p);
  const worn = modelImage(p);
  return (
    <article className={styles.card}>
      <div className={styles.tile}>
        <button className={styles.tileBtn} onClick={onOpen} aria-label={`View ${p.name}`}>
          <Photo img={img} sizes={CARD} tint={i} className={styles.ph} alt={p.name} />
          {worn && <span className={styles.worn}><Photo img={worn} sizes={CARD} className={styles.ph} alt={`${p.name}, worn`} /></span>}
        </button>
        {worn && <span className={styles.wornTag}>On model</span>}
        {p.tag && !worn && <span className={styles.tag}>{p.tag}</span>}
        <button className={`${styles.heart} ${saved ? styles.heartOn : ""}`} onClick={onSave} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${p.name}`}>
          <Ico.Heart />
        </button>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.price}>
          <b>{priceText(p)}</b>
          {off(p) > 0 && <s>{inr(p.mrp!)}</s>}
        </p>
        <button className={styles.order} onClick={onOpen}>View details</button>
        <h3 className={styles.name}>{p.name}</h3>
        {p.material && <span className={styles.chipTag}>{p.material}</span>}
      </div>
    </article>
  );
}

export default function Jewellery({ spec }: { spec: StoreSpec }) {
  const products = spec.products;
  const cats = useMemo(() => categoriesOf(products), [products]);
  const materials = useMemo(() => categoriesOf(products.map((p) => ({ ...p, category: p.material ?? "" }))), [products]);
  const ig = instagramUrl(spec.handle);

  const [q, setQ] = useState("");
  const [quickKey, setQuickKey] = useState("all");
  const [selCats, setSelCats] = useState<string[]>([]);
  const [selRanges, setSelRanges] = useState<string[]>([]);
  const [selMats, setSelMats] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [saved, setSaved] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<SpecProduct | null>(null);
  const [shot, setShot] = useState(0);
  const [year] = useState(() => new Date().getFullYear());
  const closeRef = useDialog(Boolean(view) || filtersOpen, () => { setView(null); setFiltersOpen(false); });

  const inRange = (p: SpecProduct, key: string) => {
    const r = RANGES.find((x) => x.key === key);
    return Boolean(r && p.price && p.price >= r.min && p.price <= r.max);
  };
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // Everything except one filter group, so each group's counts stay honest.
  const base = (skip?: "cat" | "range" | "mat") => products.filter((p) => {
    const text = q.trim().toLowerCase();
    if (text && !`${p.name} ${p.category} ${p.material ?? ""}`.toLowerCase().includes(text)) return false;
    if (quickKey === "new" && !p.tag) return false;
    if (quickKey === "model" && !modelImage(p)) return false;
    if (quickKey === "u1000" && !(p.price && p.price < 1000)) return false;
    if (skip !== "cat" && selCats.length && !selCats.includes(p.category)) return false;
    if (skip !== "range" && selRanges.length && !selRanges.some((r) => inRange(p, r))) return false;
    if (skip !== "mat" && selMats.length && !selMats.includes(p.material ?? "")) return false;
    return true;
  });

  const visible = (() => {
    const out = base();
    if (sort === "low") out.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "high") out.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === "off") out.sort((a, b) => off(b) - off(a));
    return out;
  })();
  const activeCount = selCats.length + selRanges.length + selMats.length;
  const clearAll = () => { setSelCats([]); setSelRanges([]); setSelMats([]); setQuickKey("all"); setQ(""); };

  const hero = products.find((p) => modelImage(p)) ?? products.find((p) => mainImage(p)) ?? products[0];
  const heroImg = hero && (modelImage(hero) ?? mainImage(hero));
  const jump = (c?: string) => {
    setSelCats(c ? [c] : []);
    requestAnimationFrame(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }));
  };
  const open = (p: SpecProduct) => { setShot(0); setView(p); };

  const Filters = (
    <div className={styles.filters}>
      <div className={styles.filtersHead}>
        <span>Filters{activeCount ? ` (${activeCount})` : ""}</span>
        {activeCount > 0 && <button onClick={clearAll}>Clear all</button>}
      </div>
      {cats.length > 1 && (
        <fieldset className={styles.group}>
          <legend>Category</legend>
          {cats.map((c) => {
            const n = base("cat").filter((p) => p.category === c).length;
            return (
              <label key={c} className={styles.check}>
                <input type="checkbox" checked={selCats.includes(c)} onChange={() => toggle(selCats, setSelCats, c)} />
                {c} <span>({n})</span>
              </label>
            );
          })}
        </fieldset>
      )}
      {products.some((p) => p.price) && (
        <fieldset className={styles.group}>
          <legend>Price</legend>
          {RANGES.map((r) => {
            const n = base("range").filter((p) => inRange(p, r.key)).length;
            if (!n && !selRanges.includes(r.key)) return null;
            return (
              <label key={r.key} className={styles.check}>
                <input type="checkbox" checked={selRanges.includes(r.key)} onChange={() => toggle(selRanges, setSelRanges, r.key)} />
                {r.label} <span>({n})</span>
              </label>
            );
          })}
        </fieldset>
      )}
      {materials.length > 1 && (
        <fieldset className={styles.group}>
          <legend>Finish</legend>
          {materials.map((m) => (
            <label key={m} className={styles.check}>
              <input type="checkbox" checked={selMats.includes(m)} onChange={() => toggle(selMats, setSelMats, m)} />
              {m} <span>({base("mat").filter((p) => p.material === m).length})</span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );

  return (
    <div className={`${styles.root} ${bodoni.variable} ${jost.variable}`}>
      {spec.demo && <DemoBanner spec={spec} />}

      <header className={styles.header}>
        <a className={styles.logo} href="#top" aria-label={`${spec.brand}, home`}>
          {spec.logo && <span className={styles.logoImg}><Photo img={spec.logo} sizes="40px" className={styles.ph} /></span>}
          <span>{spec.brand}</span>
        </a>
        <label className={styles.search}>
          <span className="sr-only">Search</span>
          <input type="search" placeholder="Search earrings, necklaces, rings…" value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value) document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} />
          <span className={styles.searchIco}><Ico.Search /></span>
        </label>
        <div className={styles.utils}>
          <button className={styles.icon} onClick={() => { setQuickKey("all"); jump(); }} aria-label={`Wishlist, ${saved.length} saved`}>
            <Ico.Heart />{saved.length > 0 && <span className={styles.count}>{saved.length}</span>}
          </button>
          <a className={styles.icon} href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Ico.Instagram /></a>
        </div>
      </header>

      <nav className={styles.catBar} aria-label="Categories">
        <button onClick={() => jump()}>All Jewellery</button>
        {cats.map((c) => <button key={c} onClick={() => jump(c)}>{c}</button>)}
      </nav>

      <main id="top">
        <section className={styles.hero}>
          <div className={styles.heroBody}>
            <span className={styles.kicker}>{spec.city ? `From ${spec.city}` : "New collection"}</span>
            <h1>{spec.tagline || <>Jewellery that makes <em>every day</em> an occasion.</>}</h1>
            <p>{products.length} designs, picked by {spec.brand}. Find your next favourite.</p>
            <div className={styles.heroCta}>
              <button className={styles.btn} onClick={() => jump()}>Shop the collection</button>
              {products.some((p) => modelImage(p)) && (
                <button className={styles.btnGhost} onClick={() => { setQuickKey("model"); jump(); }}>See it worn</button>
              )}
            </div>
          </div>
          <button className={styles.heroMedia} onClick={() => hero && open(hero)} aria-label={hero ? `View ${hero.name}` : "Featured"}>
            <Photo img={heroImg} sizes="(min-width: 900px) 45vw, 100vw" priority tint={2} className={styles.ph} />
            {hero && <span className={styles.heroCap}><b>{hero.name}</b>{priceText(hero)}</span>}
          </button>
        </section>

        <div className={styles.trust}>
          <span><Ico.Gem /> Handpicked designs</span>
          <span><Ico.Gift /> Made for gifting</span>
          <span><Ico.Shield /> Safe, simple ordering</span>
          <span><Ico.Chat /> Help on chat</span>
        </div>

        {cats.length >= 2 && (
          <section className={styles.section}>
            <h2 className={styles.h2}>Shop by category</h2>
            <div className={styles.cats}>
              {cats.map((c, i) => {
                const cover = products.find((p) => p.category === c && mainImage(p));
                return (
                  <button key={c} className={styles.catCard} onClick={() => jump(c)}>
                    <span className={styles.catImg}><Photo img={cover && mainImage(cover)} sizes="140px" tint={i} className={styles.ph} /></span>
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section id="shop" className={styles.section}>
          <div className={styles.listHead}>
            <h2 className={styles.h2}>{selCats.length === 1 ? selCats[0] : "Jewellery"} <span>{visible.length} design{visible.length === 1 ? "" : "s"}</span></h2>
          </div>
          <div className={styles.quick} role="group" aria-label="Quick filters">
            {QUICK.filter((x) => x.key !== "model" || products.some((p) => modelImage(p)))
              .filter((x) => x.key !== "new" || products.some((p) => p.tag))
              .map((x) => (
                <button key={x.key} className={`${styles.quickChip} ${quickKey === x.key ? styles.quickOn : ""}`} aria-pressed={quickKey === x.key} onClick={() => setQuickKey(x.key)}>{x.label}</button>
              ))}
          </div>

          <div className={styles.listing}>
            <aside className={styles.side}>{Filters}</aside>
            <div>
              <div className={styles.bar}>
                <button className={styles.filterBtn} onClick={() => setFiltersOpen(true)}><Ico.Filter /> Filters{activeCount ? ` (${activeCount})` : ""}</button>
                <div className={styles.applied}>
                  {[...selCats, ...selMats, ...selRanges.map((r) => RANGES.find((x) => x.key === r)?.label ?? r)].map((t) => (
                    <span key={t} className={styles.pill}>{t}</span>
                  ))}
                </div>
                <label className={styles.sort}>
                  Sort by
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="featured">Featured</option>
                    <option value="low">Price: Low to high</option>
                    <option value="high">Price: High to low</option>
                    <option value="off">Discount</option>
                  </select>
                </label>
              </div>
              <div className={styles.grid}>
                {visible.map((p, i) => (
                  <Card key={p.id} p={p} i={i} saved={saved.includes(p.id)}
                    onSave={() => toggle(saved, setSaved, p.id)} onOpen={() => open(p)} />
                ))}
              </div>
              {visible.length === 0 && (
                <p className={styles.empty}>No designs match these filters. <button onClick={clearAll}>Clear filters</button></p>
              )}
            </div>
          </div>
        </section>

        <section className={styles.story}>
          <div>
            <span className={styles.kicker}>About {spec.brand}</span>
            <p>{spec.about || `${spec.brand} brings together pieces that are easy to wear every day and special enough for the moments that matter.`}</p>
            <a className={styles.btnGhostLight} href={ig} target="_blank" rel="noopener noreferrer"><Ico.Instagram /> {spec.handle ? `@${spec.handle}` : "Instagram"}</a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footTop}>
          <div>
            <span className={styles.footBrand}>{spec.brand}</span>
            <p>Jewellery for every day and every occasion{spec.city ? `, from ${spec.city}` : ""}.</p>
          </div>
          <div className={styles.footCol}>
            <h4>Shop</h4>
            {cats.slice(0, 6).map((c) => <button key={c} onClick={() => jump(c)}>{c}</button>)}
          </div>
          <div className={styles.footCol}>
            <h4>Need help?</h4>
            <a href={ig} target="_blank" rel="noopener noreferrer">Message us</a>
            <a href={ig} target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>
        <div className={styles.footBottom}><span>© {year} {spec.brand}</span><span>Website by DM to Store</span></div>
      </footer>

      {filtersOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Filters" onClick={(e) => { if (e.target === e.currentTarget) setFiltersOpen(false); }}>
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <b>Filters</b>
              <button ref={closeRef} className={styles.icon} onClick={() => setFiltersOpen(false)} aria-label="Close filters"><Ico.Close /></button>
            </div>
            {Filters}
            <button className={styles.btn} onClick={() => setFiltersOpen(false)}>Show {visible.length} design{visible.length === 1 ? "" : "s"}</button>
          </div>
        </div>
      )}

      {view && (() => {
        const worn = view.images.filter((i) => i.model);
        const plain = view.images.filter((i) => !i.model);
        const gallery = [...plain, ...worn];
        const cur = gallery[shot] ?? gallery[0];
        return (
          <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={view.name} onClick={(e) => { if (e.target === e.currentTarget) setView(null); }}>
            <div className={styles.modal}>
              <button ref={closeRef} className={`${styles.icon} ${styles.modalClose}`} onClick={() => setView(null)} aria-label="Close"><Ico.Close /></button>
              <div className={styles.modalMedia}>
                <Photo key={shot} img={cur} sizes="(min-width: 760px) 440px, 100vw" className={styles.ph} alt={view.name} />
                {worn.length > 0 && (
                  <div className={styles.toggle} role="group" aria-label="Photo type">
                    <button className={!cur?.model ? styles.toggleOn : ""} onClick={() => setShot(0)}>Product</button>
                    <button className={cur?.model ? styles.toggleOn : ""} onClick={() => setShot(plain.length)}>On model</button>
                  </div>
                )}
                {gallery.length > 1 && (
                  <div className={styles.thumbs}>
                    {gallery.map((im, n) => (
                      <button key={im.src} className={`${styles.thumb} ${n === shot ? styles.thumbOn : ""}`} onClick={() => setShot(n)} aria-label={`Photo ${n + 1}`} aria-pressed={n === shot}>
                        <Photo img={im} sizes="52px" className={styles.ph} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.modalBody}>
                <span className={styles.kicker}>{view.category}</span>
                <h3>{view.name}</h3>
                <p className={styles.modalPrice}>
                  <b>{priceText(view)}</b>
                  {off(view) > 0 && <><s>{inr(view.mrp!)}</s><em>{off(view)}% off</em></>}
                </p>
                {view.material && <span className={styles.chipTag}>{view.material}</span>}
                {view.desc && <p className={styles.desc}>{view.desc}</p>}
                <div className={styles.modalActions}>
                  <a className={styles.btn} href={orderHref(spec, view)} target="_blank" rel="noopener noreferrer">{orderLabel(spec)}</a>
                  <button className={`${styles.btnGhost} ${saved.includes(view.id) ? styles.savedOn : ""}`} onClick={() => toggle(saved, setSaved, view.id)}>
                    <Ico.Heart /> {saved.includes(view.id) ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
