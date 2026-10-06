#!/usr/bin/env node
/* Prospect pipeline: find Instagram shops without a website, build each a
   concept preview site, and export outreach links.

     npm run prospects -- discover --search "jodhpur boutique, jodhpur kurtis" --city Jodhpur
     npm run prospects -- list
     npm run prospects -- build --top 10          (or: build handle1 handle2)
     npm run prospects -- export                  → prospects/outreach.csv
     npm run prospects -- status <handle> sent|replied|won|lost
     npm run prospects -- remove <handle>         (takes the preview link down)
     npm run prospects -- recheck [--apply]       (re-apply fit rules; --apply removes misfits)
     npm run prospects -- add <handle...>         (add shops you found yourself)
     npm run prospects -- test                    (check extraction, no network)

   Needs in .env.local: APIFY_TOKEN, NEXT_PUBLIC_SUPABASE_URL,
   SUPABASE_SERVICE_ROLE_KEY. Scraped data stays in prospects/ (git-ignored). */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { args, die, download, hash, need, optimise, readJson, ROOT, say, supabase, uploadImage, writeJson } from "./lib/common.mjs";
import { aboutFrom, brandFrom, cityFrom, classify, clean, hasOwnWebsite, linksOf, productsFrom, sellerProblems } from "./lib/extract.mjs";

const DIR = path.join(ROOT, "prospects");
const DB_FILE = path.join(DIR, "candidates.json");
const BASE_URL = (process.env.DEMO_BASE_URL || "https://e-commerce-template-tawny.vercel.app").replace(/\/+$/, "");
const SIGNATURE = process.env.AGENCY_SIGNATURE || "Mehul, DM to Store";
const BUCKET = "demo-images";
const STALE_MS = 2 * 24 * 3600e3; // Instagram image links expire; refetch older profiles

// Northwest India + Delhi. Override with --cities "A,B" and --terms "x,y".
const NW_CITIES = ["Delhi", "Jaipur", "Jodhpur", "Udaipur", "Ajmer", "Bikaner", "Kota", "Ahmedabad", "Surat", "Vadodara",
  "Rajkot", "Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Gurgaon", "Gurugram", "Noida", "Faridabad"];
const TERMS = ["boutique", "kurtis online", "artificial jewellery", "imitation jewellery", "handicrafts", "handmade decor"];

const a = args();
const cmd = a._[0];
const load = () => readJson(DB_FILE, {});
const save = (db) => writeJson(DB_FILE, db);
const linkOf = (slug) => `${BASE_URL}/demo/${slug}`;

/* ── Apify ─────────────────────────────────────────────────────────── */
async function apify(actor, input) {
  const token = need("APIFY_TOKEN", "Create one at console.apify.com → Settings → API & Integrations, then add APIFY_TOKEN=... to .env.local.");
  const r = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=300`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  if (r.status === 401) die("Apify rejected the token. Check APIFY_TOKEN in .env.local.");
  if (r.status === 402) die("Apify says the account is out of credit. Top up or wait for the monthly free credit.");
  if (!r.ok) die(`Apify ${actor} failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
  const items = await r.json();
  fs.mkdirSync(path.join(DIR, "raw"), { recursive: true });
  writeJson(path.join(DIR, "raw", `${actor.replace(/\W+/g, "_")}-${Date.now()}.json`), items);
  return Array.isArray(items) ? items : [];
}

const profilesFor = (usernames) =>
  apify("apify~instagram-profile-scraper", { usernames: usernames.map((u) => u.replace(/^@/, "")) });

/* ── Qualify ───────────────────────────────────────────────────────── */
function qualify(profile, opts) {
  const min = Number(opts.min ?? 300), max = Number(opts.max ?? 100000);
  const posts = (profile.latestPosts ?? []).filter((p) => p.displayUrl || p.images?.length);
  const cls = classify(profile);
  const genre = opts.genre ?? cls.genre;
  const why = [];
  if (profile.private) why.push("private account");
  // Verified is NOT a reason to skip: many small sellers pay for Meta Verified.
  if (hasOwnWebsite(profile)) why.push(`already has a website (${linksOf(profile)[0]})`);
  if ((profile.followersCount ?? 0) < min) why.push(`only ${profile.followersCount ?? 0} followers`);
  if ((profile.followersCount ?? 0) > max) why.push(`${profile.followersCount} followers (too big)`);
  if (!genre) why.push("couldn't tell apparel / jewellery / handicrafts");
  if (posts.length < 4) why.push(`only ${posts.length} posts with photos`);
  if (genre) why.push(...sellerProblems(profile, genre));
  return { ok: why.length === 0, why, genre, score: cls.score };
}

function remember(db, profile, opts) {
  const u = String(profile.username ?? "").toLowerCase();
  if (!u) return null;
  const q = qualify(profile, opts);
  const prev = db[u] ?? {};
  db[u] = {
    ...prev,
    username: u,
    brand: brandFrom(profile),
    genre: prev.genreLocked ? prev.genre : q.genre,
    followers: profile.followersCount ?? null,
    links: linksOf(profile),
    city: cityFrom(opts.cities ?? NW_CITIES, profile.searchTerm) ?? opts.city ?? prev.city
      ?? cityFrom(opts.cities ?? NW_CITIES, profile.biography, profile.fullName) ?? null,
    qualified: q.ok,
    reason: q.why.join("; ") || null,
    status: prev.status ?? (q.ok ? "new" : "skipped"),
    fetchedAt: new Date().toISOString(),
    profile: {
      username: profile.username, fullName: profile.fullName, biography: profile.biography,
      profilePicUrlHD: profile.profilePicUrlHD ?? profile.profilePicUrl, businessCategoryName: profile.businessCategoryName,
      latestPosts: (profile.latestPosts ?? []).map((p) => ({
        type: p.type, caption: p.caption, hashtags: p.hashtags, url: p.url, displayUrl: p.displayUrl,
        images: p.images, childPosts: (p.childPosts ?? []).map((c) => ({ type: c.type, displayUrl: c.displayUrl })),
      })),
    },
  };
  return db[u];
}

/* ── Commands ──────────────────────────────────────────────────────── */
async function discover() {
  const cities = typeof a.cities === "string" ? a.cities.split(",").map((x) => x.trim()).filter(Boolean) : NW_CITIES;
  const terms = typeof a.terms === "string" ? a.terms.split(",").map((x) => x.trim()).filter(Boolean) : TERMS;
  const search = typeof a.search === "string" ? a.search : cities.flatMap((c) => terms.map((t) => `${c} ${t}`)).join(", ");
  const limit = Math.min(Number(a.limit ?? 40), 250);
  say.bold(`Searching Instagram: ${search.split(",").length} keywords, up to ${limit} accounts each…`);
  // Search in batches so each Apify call finishes inside its 5-minute sync window.
  const keywords = search.split(",").map((x) => x.trim()).filter(Boolean);
  const seen = new Set();
  let found = [];
  for (let i = 0; i < keywords.length; i += 10) {
    const batch = keywords.slice(i, i + 10);
    say.dim(`  batch ${i / 10 + 1}/${Math.ceil(keywords.length / 10)}: ${batch.join(", ")}`);
    const got = await apify("apify~instagram-search-scraper", { search: batch.join(", "), searchType: "user", searchLimit: limit });
    for (const p of got) {
      const u = String(p.username ?? "").toLowerCase();
      if (u && !seen.has(u)) { seen.add(u); found.push(p); }
    }
  }
  // Search results sometimes lack posts; fetch full profiles for those.
  const thin = found.filter((p) => !p.latestPosts?.length && !p.private).map((p) => p.username);
  if (thin.length) {
    say.dim(`Fetching full profiles for ${thin.length} accounts…`);
    const full = await profilesFor(thin);
    const byName = new Map(full.map((p) => [String(p.username).toLowerCase(), p]));
    found = found.map((p) => byName.get(String(p.username).toLowerCase()) ?? p);
  }
  const db = load();
  let fresh = 0, good = 0;
  for (const p of found) {
    const had = Boolean(db[String(p.username).toLowerCase()]);
    const rec = remember(db, p, { city: a.city, cities, min: a.min, max: a.max, genre: a.genre });
    if (!rec) continue;
    if (!had) fresh++;
    if (rec.qualified) good++;
  }
  save(db);
  say.ok(`${found.length} accounts checked, ${fresh} new, ${good} qualify (no website, right size, right genre).`);
  list({ onlyNew: true });
}

async function add() {
  const handles = a._.slice(1);
  if (!handles.length) die("Usage: add <handle> [handle…]");
  const profiles = await profilesFor(handles);
  const db = load();
  for (const p of profiles) {
    const rec = remember(db, p, { city: a.city, genre: a.genre, min: 0, max: Infinity });
    if (rec) {
      rec.qualified = true; // you picked it, so it's in
      if (rec.status === "skipped") rec.status = "new";
      if (a.genre) rec.genreLocked = true;
      say.ok(`@${rec.username}: ${rec.brand} — ${rec.genre ?? "genre unclear, use --genre"}${rec.reason ? ` (note: ${rec.reason})` : ""}`);
    }
  }
  save(db);
}

function list({ onlyNew = false } = {}) {
  const db = load();
  const rows = Object.values(db)
    .filter((r) => (onlyNew ? r.qualified && r.status === "new" : a.all ? true : r.qualified || r.slug))
    .sort((x, y) => (y.followers ?? 0) - (x.followers ?? 0));
  if (!rows.length) { say.dim(onlyNew ? "No new qualifying shops." : "Nothing yet. Run: discover --search \"…\""); return; }
  for (const r of rows) {
    const tag = r.slug ? linkOf(r.slug) : r.qualified ? "ready to build" : `skipped: ${r.reason}`;
    console.log(`  ${String(r.status).padEnd(8)} @${r.username.padEnd(26)} ${String(r.genre ?? "?").padEnd(11)} ${String(r.followers ?? "").padStart(7)}  ${tag}`);
  }
}

const slugFor = (u) => `${u.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "shop"}-${crypto.randomBytes(3).toString("hex")}`;

async function buildOne(sb, rec) {
  const genre = a.genre ?? rec.genre;
  if (!genre) { say.warn(`@${rec.username}: genre unknown — rerun with --genre apparel|jewellery|handicrafts`); return; }
  const slug = rec.slug ?? slugFor(rec.username);
  rec.brand = brandFrom(rec.profile);
  if (rec.slug) { // rebuild: clear the previous photos first
    const { data: old } = await sb.storage.from(BUCKET).list(slug, { limit: 200 });
    if (old?.length) await sb.storage.from(BUCKET).remove(old.map((f) => `${slug}/${f.name}`));
  }
  const products = productsFrom(rec.profile.latestPosts, genre, Number(a.products ?? 12), rec.brand);
  if (products.length < 3) { say.warn(`@${rec.username}: only ${products.length} usable posts, skipped.`); return; }

  say.dim(`  @${rec.username}: ${products.length} products, uploading photos…`);
  let logo;
  if (rec.profile.profilePicUrlHD) {
    try {
      const img = await optimise(await download(rec.profile.profilePicUrlHD), 320);
      logo = await uploadImage(sb, BUCKET, `${slug}/logo-${hash(img.data)}.webp`, img);
    } catch (e) { say.dim(`    logo skipped (${e.message})`); }
  }
  const specProducts = [];
  for (const p of products) {
    const images = [];
    for (const [k, url] of p.imageUrls.entries()) {
      try {
        const img = await optimise(await download(url), 1200);
        images.push(await uploadImage(sb, BUCKET, `${slug}/p${p.n}-${k + 1}-${hash(img.data)}.webp`, img));
      } catch (e) { say.dim(`    photo ${p.n}.${k + 1} skipped (${e.message})`); }
    }
    if (!images.length) continue;
    specProducts.push({
      id: `p${p.n}`, n: specProducts.length + 1, name: p.name, category: p.category,
      ...(p.price ? { price: p.price } : {}), ...(p.mrp ? { mrp: p.mrp } : {}), images,
    });
  }
  if (specProducts.length < 3) { say.warn(`@${rec.username}: photos couldn't be downloaded (links may have expired — rerun to refetch).`); return; }

  const spec = {
    slug, genre, brand: rec.brand, handle: rec.username,
    ...(rec.city ? { city: rec.city } : {}),
    ...(aboutFrom(rec.profile.biography) ? { about: aboutFrom(rec.profile.biography) } : {}),
    ...(logo ? { logo } : {}),
    products: specProducts,
    demo: { preparedFor: rec.username, createdAt: new Date().toISOString() },
  };
  const { error } = await sb.from("demos").upsert({
    slug, genre, handle: rec.username, brand: rec.brand, spec, followers: rec.followers,
    status: rec.status === "new" || rec.status === "skipped" ? "draft" : rec.status,
  }, { onConflict: "slug" });
  if (error) throw new Error(`save demo: ${error.message}`);

  Object.assign(rec, { slug, genre, status: rec.status === "new" || rec.status === "skipped" ? "draft" : rec.status, builtAt: new Date().toISOString() });
  say.ok(`@${rec.username} → ${linkOf(slug)}  (${specProducts.length} products${specProducts.some((p) => p.price) ? "" : ", no prices found"})`);
}

async function build() {
  const db = load();
  let picks = a._.slice(1).map((h) => h.replace(/^@/, "").toLowerCase());
  if (!picks.length) {
    const top = Number(a.top ?? 5);
    picks = Object.values(db).filter((r) => r.qualified && r.status === "new").sort((x, y) => (y.followers ?? 0) - (x.followers ?? 0)).slice(0, top).map((r) => r.username);
    if (!picks.length) die("Nothing to build. Run discover first, or pass handles: build <handle>.");
  }
  const missing = picks.filter((h) => !db[h]);
  const stale = picks.filter((h) => db[h] && Date.now() - new Date(db[h].fetchedAt).getTime() > STALE_MS);
  const fetchList = [...new Set([...missing, ...stale])];
  if (fetchList.length) {
    say.dim(`Fetching fresh profiles for ${fetchList.length} account(s)…`);
    for (const p of await profilesFor(fetchList)) {
      const rec = remember(db, p, { genre: a.genre, min: 0, max: Infinity });
      if (rec && missing.includes(rec.username)) rec.qualified = true;
    }
    save(db);
  }
  const sb = supabase();
  say.bold(`Building ${picks.length} preview site(s)…`);
  for (const h of picks) {
    const rec = db[h];
    if (!rec) { say.warn(`@${h}: not found on Instagram.`); continue; }
    try { await buildOne(sb, rec); } catch (e) { say.err(`@${h}: ${e.message}`); }
    save(db);
  }
  console.log("\nNext: npm run prospects -- export   (writes prospects/outreach.csv)");
}

const WHAT = { apparel: "collection", jewellery: "jewellery designs", handicrafts: "handmade pieces" };
function exportCsv() {
  const db = load();
  const rows = Object.values(db).filter((r) => r.slug && r.status !== "removed");
  if (!rows.length) die("No preview sites built yet. Run build first.");
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["status", "handle", "instagram", "brand", "genre", "followers", "preview_link", "suggested_message"].join(",")];
  for (const r of rows.sort((x, y) => (y.followers ?? 0) - (x.followers ?? 0))) {
    const msg = `Hi ${r.brand}! I came across your page and really liked your ${WHAT[r.genre] ?? "work"}. ` +
      `I made a free sample website for you, built around your own photos: ${linkOf(r.slug)} — ` +
      `customers could browse everything in one place and order in a couple of taps. ` +
      `If you like it, I'd be happy to set it up properly for you. — ${SIGNATURE}`;
    lines.push([r.status, `@${r.username}`, `https://www.instagram.com/${r.username}/`, r.brand, r.genre, r.followers, linkOf(r.slug), msg].map(esc).join(","));
  }
  const out = path.join(DIR, "outreach.csv");
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(out, "﻿" + lines.join("\n")); // BOM so Excel reads ₹ and names correctly
  say.ok(`${rows.length} previews → ${path.relative(ROOT, out)} (open it in Excel or Google Sheets)`);
}

async function setStatus() {
  const [h, status] = a._.slice(1);
  const ok = ["draft", "sent", "replied", "won", "lost"];
  if (!h || !ok.includes(status)) die(`Usage: status <handle> ${ok.join("|")}`);
  const db = load();
  const rec = db[h.replace(/^@/, "").toLowerCase()];
  if (!rec?.slug) die(`No preview built for @${h}.`);
  const { error } = await supabase().from("demos").update({ status }).eq("slug", rec.slug);
  if (error) die(error.message);
  rec.status = status;
  save(db);
  say.ok(`@${rec.username} → ${status}`);
}

async function remove() {
  const h = a._[1]?.replace(/^@/, "").toLowerCase();
  if (!h) die("Usage: remove <handle>");
  const db = load();
  const rec = db[h];
  if (!rec?.slug) die(`No preview built for @${h}.`);
  const sb = supabase();
  const { data: files } = await sb.storage.from(BUCKET).list(rec.slug, { limit: 100 });
  if (files?.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${rec.slug}/${f.name}`));
  const { error } = await sb.from("demos").update({ status: "removed", spec: { removed: true } }).eq("slug", rec.slug);
  if (error) die(error.message);
  rec.status = "removed";
  save(db);
  say.ok(`Preview for @${h} taken down and its photos deleted. The link now shows "not found".`);
}

/** Re-apply the current fit rules to every stored account. Lists built
    previews that no longer fit; --apply takes those previews down. */
async function recheck() {
  const db = load();
  const misfits = [];
  let promoted = 0;
  for (const rec of Object.values(db)) {
    if (rec.status === "removed" || !rec.profile) continue;
    if (rec.genreLocked || String(rec.reason ?? "").startsWith("reviewed:")) continue; // your own picks / my manual calls stand
    const q = qualify({ ...rec.profile, followersCount: rec.followers, externalUrls: rec.links.map((url) => ({ url })) }, {});
    if (q.ok) {
      if (!rec.qualified && !rec.slug) { rec.qualified = true; rec.reason = null; rec.status = "new"; promoted++; }
      continue;
    }
    rec.qualified = false;
    rec.reason = q.why.join("; ");
    if (rec.slug) misfits.push(rec);
    else if (rec.status === "new") rec.status = "skipped";
  }
  save(db);
  if (promoted) say.ok(`${promoted} skipped account(s) now fit and are ready to build.`);
  if (!misfits.length) { say.ok("Every built preview still fits."); return; }
  for (const r of misfits) console.log(`  @${r.username.padEnd(30)} ${r.reason}`);
  if (!a.apply) { say.warn(`${misfits.length} built preview(s) no longer fit. Rerun with --apply to take them down.`); return; }
  for (const r of misfits) { a._ = ["remove", r.username]; await remove(); }
}

async function selfTest() {
  const { pricesFrom, nameFrom, categoryOf, brandFrom, hasOwnWebsite: site, classify: cls, sellerProblems: sp } = await import("./lib/extract.mjs");
  const cases = [
    [pricesFrom("New kurti set ✨ Price: ₹1,299 only"), { price: 1299 }],
    [pricesFrom("MRP 1999 offer price Rs. 1499/-"), { price: 1499, mrp: 1999 }],
    [pricesFrom("Order now! Call 9876543210"), {}],
    [nameFrom("✨ GOLDEN KUNDAN CHOKER SET ✨\nPrice 899\n#jewellery", "Necklaces", "jewellery"), "Golden Kundan Choker Set"],
    [nameFrom("Gents Accessories Available at Risala The Boutique Jodhpur . . . #rajputana", "New Arrivals", "apparel", "Risala The Boutique"), "Look"],
    [nameFrom("Ye color pehnte hi sab puchenge – Kahan se liya? #orangeposhak", "Rajputi Poshak", "apparel"), "Rajputi Poshak"],
    [nameFrom("✨ राजस्थानी पोशाक की शान — New Baju & Loom Collection (Part 2)! ✨", "Rajputi Poshak", "apparel"), "Baju & Loom Collection"],
    [nameFrom("Beautiful pink georgette suit with gota work", "Suit Sets", "apparel"), "Beautiful pink georgette suit with gota work"],
    [brandFrom({ fullName: "RISALA THE BOUTIQUE JODHPUR" }), "Risala The Boutique"],
    [categoryOf("Bridal and Mirror loom collection #rajputiposhak", "apparel"), "Rajputi Poshak"],
    [nameFrom("DM to order 💌", "Earrings", "jewellery"), "Earrings"],
    [nameFrom("Oxidized Earrings 90 Rs", "Earrings", "jewellery"), "Oxidized Earrings"],
    [pricesFrom("Oxidized Earrings 90 Rs"), { price: 90 }],
    [nameFrom("Is Navratri apne Mandir ke liye banwaye **Custom Rajputi poshak", "Rajputi Poshak", "apparel"), "Rajputi Poshak"],
    [nameFrom("Three-Gune Rajputi Poshak, crafted with beautiful gota", "Rajputi Poshak", "apparel"), "Three-Gune Rajputi Poshak"],
    [brandFrom({ fullName: "Balotiya_Creation_Tailor_Boutique" }), "Balotiya Creation Tailor Boutique"],
    [brandFrom({ fullName: "शिव", username: "_shiv_shakti_boutique_jodhpur" }), "Shiv Shakti Boutique"],
    [brandFrom({ fullName: "SHAGUN IMITATION Jewellery & Rentals on Hire" }), "Shagun Imitation Jewellery"],
    [categoryOf("Oxidized NeckPiece", "jewellery"), "Necklaces"],
    [categoryOf("beautiful oxidised jhumkas for festive", "jewellery"), "Earrings"],
    [site({ externalUrl: "https://linktr.ee/shop" }), false],
    [site({ externalUrl: "https://mystore.in" }), true],
    [site({ externalUrl: "wa.me/919999999999" }), false],
    [cls({ fullName: "Riya Boutique", biography: "Designer kurtis & sarees | Jodhpur" }).genre, "apparel"],
    [cls({ fullName: "Glam Jewels", biography: "Oxidised & artificial jewellery, earrings" }).genre, "jewellery"],
    [cls({ fullName: "Mitti Crafts", biography: "Handmade terracotta pottery & home decor" }).genre, "handicrafts"],
    [clean("Hello 🌸 #newarrival @shop world"), "Hello world"],
    [sp({ fullName: "BBQ Boutique", biography: "FINE DINING WITH GRILL-ICIOUS CUISINE" }, "apparel").includes("not a product seller (services / food / venue)"), true],
    [sp({ biography: "Casting jewellery job work. B2B only." }, "jewellery").includes("B2B / wholesale only"), true],
    [sp({ biography: "Manufacturer of all type of gold(22ct) and silver ornaments. Whatsapp 97xx" }, "jewellery").includes("fine gold/silver jeweller, not artificial jewellery"), true],
    [sp({ biography: "Oxidised & artificial jewellery | DM to order | COD" }, "jewellery"), []],
    [sp({ biography: "Kurtis & co-ords, all over India delivery" }, "apparel"), []],
    [sp({ biography: "Just my art and life" }, "handicrafts"), ["no sign of selling (no order / price / delivery mentions)"]],
    [cityFrom(["Delhi", "Jaipur"], "jaipur artificial jewellery"), "Jaipur"],
    [sp({ biography: "Qum Kurties | Wholesale Kurtis Trendy, Affordable, minimum order 5000 Pan-India" }, "apparel").includes("B2B / wholesale only"), true],
    [sp({ biography: "WHOLESALE & RETAIL SUITS | LEHENGA | SHARARA. ORDERS via Whatsapp only" }, "apparel"), []],
    [sp({ biography: "A GREAT TOUR INTO DECOR WORLD! Manufacturer/Wholesaler/Retailer. Pan India shipping" }, "handicrafts"), []],
    [sp({ biography: "Rattan Cane Webbing Supplier. Cane, Rope, PVC Wicker" }, "handicrafts").includes("B2B / wholesale only"), true],
    [sp({ biography: "A best in class Home Decor and Furnishing Store" }, "handicrafts"), []],
    [sp({ biography: "Silver / gold jewellery. Shipping all over india. Cod" }, "jewellery").includes("fine gold/silver jeweller, not artificial jewellery"), true],
  ];
  let bad = 0;
  for (const [got, want] of cases) {
    const g = JSON.stringify(got), w = JSON.stringify(want);
    if (g === w) say.ok(g); else { bad++; say.err(`got ${g}, expected ${w}`); }
  }
  if (bad) die(`${bad} check(s) failed`);
  say.ok("All extraction checks passed.");
}

const run = { discover, add, list: () => list(), build, export: exportCsv, status: setStatus, remove, recheck, test: selfTest }[cmd];
if (!run) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 17).join("\n").replace(/^\/\*|\*\/$/gm, ""));
  process.exit(cmd ? 1 : 0);
}
await run();
