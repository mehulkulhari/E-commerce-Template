#!/usr/bin/env node
/* Adds "on model" photos (a person wearing the piece) to products.

   Put photos in model-shots/<shop>/, named by product number:
     model-shots/impact-store/12.jpg       → Impact Store product code 12
     model-shots/impact-store/12-2.jpg     → a second model photo for 12
     model-shots/<instagram-handle>/3.jpg  → product 3 on that shop's preview

   Then: npm run model-shots            (all shops)
         npm run model-shots -- riya.boutique   (one shop)

   Safe to rerun: a photo that was already added is skipped. Needs
   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local. */
import fs from "node:fs";
import path from "node:path";
import { args, hash, optimise, ROOT, say, supabase, uploadImage } from "./lib/common.mjs";

const DIR = path.join(ROOT, "model-shots");
const IMG = /\.(jpe?g|png|webp|avif|heic|heif)$/i;
const NAME = /^(\d+)(?:[-_ .(]+(\d+)\)?)?\.[a-z]+$/i;
const a = args();

function filesIn(shop) {
  const dir = path.join(DIR, shop);
  return fs.readdirSync(dir).filter((f) => IMG.test(f)).map((f) => {
    const m = f.match(NAME);
    return m ? { file: path.join(dir, f), name: f, n: Number(m[1]), k: Number(m[2] ?? 1) } : { name: f, bad: true };
  });
}

async function forImpact(sb, files) {
  for (const f of files) {
    const { data: rows, error } = await sb.from("products").select("id,name,images").eq("code", f.n).limit(1);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) { say.warn(`impact-store/${f.name}: no product with code ${f.n}`); continue; }
    const img = await optimise(fs.readFileSync(f.file), 1600);
    const tag = hash(img.data);
    const images = Array.isArray(row.images) ? row.images : [];
    if (images.some((i) => String(i.src).includes(tag))) { say.dim(`  ${f.name}: already added`); continue; }
    const shot = await uploadImage(sb, "product-images", `model/${f.n}-${f.k}-${tag}.webp`, img, { model: true });
    const { error: upErr } = await sb.from("products").update({ images: [...images, shot] }).eq("id", row.id);
    if (upErr) throw new Error(upErr.message);
    say.ok(`${f.name} → ${row.name}`);
  }
}

async function forDemo(sb, shop, files) {
  const key = shop.toLowerCase().replace(/^@/, "");
  let { data: row } = await sb.from("demos").select("slug,spec").eq("slug", key).maybeSingle();
  if (!row) ({ data: row } = await sb.from("demos").select("slug,spec").ilike("handle", key).maybeSingle());
  if (!row) { say.warn(`${shop}/: no preview found for this handle or slug — build it first.`); return; }
  const spec = row.spec;
  let changed = false;
  for (const f of files) {
    const prod = spec.products.find((p) => p.n === f.n);
    if (!prod) { say.warn(`${shop}/${f.name}: the preview has no product ${f.n}`); continue; }
    const img = await optimise(fs.readFileSync(f.file), 1200);
    const tag = hash(img.data);
    if (prod.images.some((i) => String(i.src).includes(tag))) { say.dim(`  ${f.name}: already added`); continue; }
    prod.images.push(await uploadImage(sb, "demo-images", `${row.slug}/m${f.n}-${f.k}-${tag}.webp`, img, { model: true }));
    changed = true;
    say.ok(`${shop}/${f.name} → ${prod.name}`);
  }
  if (changed) {
    const { error } = await sb.from("demos").update({ spec }).eq("slug", row.slug);
    if (error) throw new Error(error.message);
  }
}

if (!fs.existsSync(DIR)) { say.err("No model-shots/ folder."); process.exit(1); }
const shops = (a._.length ? a._ : fs.readdirSync(DIR)).filter((d) => fs.existsSync(path.join(DIR, d)) && fs.statSync(path.join(DIR, d)).isDirectory());
const sb = supabase();
let total = 0;
for (const shop of shops) {
  const files = filesIn(shop);
  for (const f of files.filter((x) => x.bad)) say.warn(`${shop}/${f.name}: name it by product number, e.g. 7.jpg or 7-2.jpg`);
  const good = files.filter((x) => !x.bad);
  if (!good.length) continue;
  total += good.length;
  say.bold(`${shop}: ${good.length} photo(s)`);
  try {
    if (shop === "impact-store") await forImpact(sb, good);
    else await forDemo(sb, shop, good);
  } catch (e) { say.err(`${shop}: ${e.message}`); }
}
if (!total) say.dim("No photos found. Drop them into model-shots/<shop>/ named 1.jpg, 2.jpg …");
else say.ok("Done. The live store updates within a minute; previews within five.");
