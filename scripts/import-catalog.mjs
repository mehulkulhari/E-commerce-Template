#!/usr/bin/env node
/**
 * Catalogue importer for the Rangat storefront (/sample).
 *
 * Put product photos and one CSV in catalog/, then run `npm run catalog`.
 * Plain-language guide: catalog/README.md
 *
 *   npm run catalog                import catalog/ into the site
 *   npm run catalog -- --check     check everything, change nothing
 *   npm run catalog -- --clear     remove the imported catalogue (demo products return)
 *   npm run catalog -- --dir PATH  read from another folder
 *   --soft                         report problems but never fail (used by `npm run dev`)
 *
 * Nothing on the site changes unless the whole catalogue is valid.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const option = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : undefined;
};

const SOFT = has("--soft");
const CHECK = has("--check");
const CLEAR = has("--clear");
const CAT_DIR = path.resolve(ROOT, option("--dir") ?? "catalog");
const OUT_DIR = path.join(ROOT, "public", "catalog");
const DATA_FILE = path.join(ROOT, "src", "data", "catalog.json");
const CACHE_FILE = path.join(ROOT, "node_modules", ".cache", "catalog-import.json");

// Bump PIPELINE whenever the image settings change so every photo is redone.
const PIPELINE = "webp-q82-v1";
const PRODUCT_EDGE = 1600; // longest side of product photos, px
const BANNER_EDGE = 2400; // hero, story and lookbook images
const BLUR_EDGE = 16; // tiny preview shown while a photo loads
const MAX_ANGLES = 6;
const CONCURRENCY = 4;

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|tiff?|gif|heic|heif)$/i;
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
const SIZE_ALIAS = { XXXL: "3XL", XXXXL: "4XL", SMALL: "S", MEDIUM: "M", LARGE: "L" };
const EMPTY = { version: 1, generatedAt: null, products: [], site: { hero: null, story: null, looks: [] } };

/* Column names people actually type, mapped to our fields. Matching ignores
   case, spaces and punctuation, so "Photo No.", "photo_no" and "PHOTO" all work. */
const ALIASES = {
  photo: ["photo", "photono", "photonumber", "photoid", "image", "imageno", "imagenumber", "pic", "picture", "no", "number", "sno", "srno", "serial", "serialno"],
  name: ["name", "productname", "product", "title", "itemname", "item"],
  price: ["price", "sellingprice", "saleprice", "ourprice", "rate", "amount"],
  mrp: ["mrp", "originalprice", "compareatprice", "compareat", "regularprice", "listprice", "oldprice"],
  category: ["category", "categories", "type", "producttype", "cat"],
  collection: ["collection", "edit", "range", "series"],
  colour: ["colour", "color", "shade"],
  fabric: ["fabric", "material", "fabrication"],
  care: ["care", "careinstructions", "washcare", "wash"],
  description: ["description", "desc", "details", "about", "productdescription"],
  sizes: ["sizes", "size", "sizesavailable", "availablesizes"],
  tag: ["tag", "badge", "label", "ribbon"],
  instock: ["instock", "stock", "available", "availability", "status"],
  featured: ["featured", "feature", "hero", "highlight"],
};
const FIELD_BY_ALIAS = new Map(Object.entries(ALIASES).flatMap(([field, names]) => names.map((n) => [n, field])));
const YES = new Set(["yes", "y", "true", "1", "instock", "available", "in", "ok"]);
const NO = new Set(["no", "n", "false", "0", "soldout", "outofstock", "unavailable", "out", "sold"]);

/* ── Output helpers ─────────────────────────────────────────────── */
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (color ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = paint(1);
const dim = paint(2);
const red = paint(31);
const green = paint(32);
const yellow = paint(33);
const problems = { errors: [], warnings: [] };
const error = (where, msg) => problems.errors.push({ where, msg });
const warn = (where, msg) => problems.warnings.push({ where, msg });
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/") || ".";
// "Rs" rather than the rupee sign: older Windows terminals can't display it.
const rs = (n) => `Rs ${n.toLocaleString("en-IN")}`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const megabytes = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/* ── Entry ──────────────────────────────────────────────────────── */
async function main() {
  if (CLEAR) return clearCatalogue();

  if (!existsSync(CAT_DIR)) {
    if (SOFT) return 0;
    console.log(`${red("No catalogue folder")} at ${rel(CAT_DIR)}/. Create it with a CSV and a photos folder (see catalog/README.md).`);
    return 1;
  }

  const top = await readdir(CAT_DIR, { withFileTypes: true });
  const csvFiles = top.filter((e) => e.isFile() && /\.csv$/i.test(e.name) && !/^[~.]/.test(e.name));
  if (csvFiles.length === 0) {
    if (SOFT) return 0;
    console.log(`${red("No CSV file")} in ${rel(CAT_DIR)}/. Copy catalog/_template/products.csv into ${rel(CAT_DIR)}/ and fill it in.`);
    return 1;
  }
  if (csvFiles.length > 1) {
    error(rel(CAT_DIR), `Found ${csvFiles.length} CSV files (${csvFiles.map((f) => f.name).join(", ")}). Keep only one.`);
    return finish();
  }

  const csvPath = path.join(CAT_DIR, csvFiles[0].name);
  const photosDir = existsSync(path.join(CAT_DIR, "photos")) ? path.join(CAT_DIR, "photos") : CAT_DIR;
  const photos = await scanPhotos(photosDir);

  if (photos.count === 0) {
    if (SOFT) {
      console.log(dim(`catalog: no photos in ${rel(photosDir)}/ yet, so the store keeps its current products.`));
      return 0;
    }
    error(rel(photosDir), "No photos found. Add images named 1.jpg, 2.jpg and so on.");
    return finish();
  }

  const { products, rowOrder } = await readProducts(csvPath, photos);
  if (problems.errors.length) return finish();

  const sharp = await loadSharp();
  if (!sharp) return finish();

  /* One job per image. Product photos first, then the optional banner images. */
  const jobs = [];
  for (const p of products) {
    p.files.forEach((f, i) => jobs.push({ kind: "product", edge: PRODUCT_EDGE, file: f.file, where: f.where, base: `${p.code}-${slug(p.name)}-${i + 1}`, product: p, index: i }));
  }
  const { hero, story, looks } = photos.brand;
  if (hero) jobs.push({ kind: "hero", edge: BANNER_EDGE, file: hero.file, where: hero.where, base: "site-hero" });
  if (story) jobs.push({ kind: "story", edge: BANNER_EDGE, file: story.file, where: story.where, base: "site-story" });
  for (const [n, look] of [...looks.entries()].sort((a, b) => a[0] - b[0])) {
    jobs.push({ kind: "look", edge: BANNER_EDGE, file: look.file, where: look.where, base: `site-look-${n}`, order: n });
  }

  const cache = CHECK ? {} : await readCache();
  if (!CHECK) await mkdir(OUT_DIR, { recursive: true });

  let done = 0;
  const progress = () => {
    if (color && !SOFT) process.stdout.write(`\r${dim(`Processing photos ${++done}/${jobs.length}`)}   `);
  };
  const results = await pool(jobs, CONCURRENCY, async (job) => {
    const r = await processImage(job, sharp, cache);
    progress();
    return r && { ...r, job };
  });
  if (color && !SOFT) process.stdout.write("\r\x1b[K");
  if (problems.errors.length) return finish();

  const totals = results.reduce(
    (t, r) => ({ in: t.in + r.inBytes, out: t.out + (r.outBytes ?? 0), fresh: t.fresh + (r.reused ? 0 : 1) }),
    { in: 0, out: 0, fresh: 0 },
  );
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const collections = [...new Set(products.map((p) => p.collection).filter(Boolean))];
  const bannerNote = [hero && "hero", story && "story", looks.size && plural(looks.size, "lookbook image")].filter(Boolean).join(", ");

  if (CHECK) {
    return finish(
      [
        `${green(bold("Check passed."))} ${plural(products.length, "product")} and ${plural(jobs.length, "photo")} are ready.`,
        rowOrder ? dim("  No photo column, so row order is used: the first product is 1.jpg, the second 2.jpg.") : "",
        `Run ${bold("npm run catalog")} to put them on the site.`,
      ].filter(Boolean).join("\n"),
    );
  }

  /* Build the data file the storefront reads. */
  const image = (r) => ({ src: `/catalog/${r.name}`, width: r.width, height: r.height, blur: r.blur });
  const productsOut = products.map((p) => ({
    id: `p${p.code}`,
    code: p.code,
    slug: slug(p.name),
    name: p.name,
    price: p.price,
    mrp: p.mrp ?? undefined,
    category: p.category || undefined,
    collection: p.collection || undefined,
    colour: p.colour || undefined,
    fabric: p.fabric || undefined,
    care: p.care || undefined,
    description: p.description || undefined,
    sizes: p.sizes,
    tag: p.tag || undefined,
    inStock: p.inStock,
    featured: p.featured,
    images: results.filter((r) => r.job.product === p).sort((a, b) => a.job.index - b.job.index).map(image),
  }));
  const site = {
    hero: (() => { const r = results.find((x) => x.job.kind === "hero"); return r ? image(r) : null; })(),
    story: (() => { const r = results.find((x) => x.job.kind === "story"); return r ? image(r) : null; })(),
    looks: results.filter((r) => r.job.kind === "look").sort((a, b) => a.job.order - b.job.order).map(image),
  };

  const previous = existsSync(DATA_FILE) ? await readFile(DATA_FILE, "utf8").then(JSON.parse).catch(() => EMPTY) : EMPTY;
  const changed = JSON.stringify({ p: previous.products, s: previous.site }) !== JSON.stringify({ p: JSON.parse(JSON.stringify(productsOut)), s: site });
  if (changed) await writeJson({ version: 1, generatedAt: new Date().toISOString(), products: productsOut, site });

  /* Remove photos from earlier imports that are no longer used. */
  const keep = new Set(results.map((r) => r.name));
  for (const f of await readdir(OUT_DIR)) {
    if (!f.startsWith(".") && !keep.has(f)) await rm(path.join(OUT_DIR, f), { force: true });
  }
  for (const key of Object.keys(cache)) if (!keep.has(key)) delete cache[key];
  await writeCache(cache);

  if (SOFT) {
    return finish(dim(`catalog: ${plural(products.length, "product")}, ${plural(jobs.length, "photo")}${changed ? " imported" : " (up to date)"}`));
  }
  return finish(
    [
      changed
        ? `${green(bold("Catalogue imported:"))} ${plural(products.length, "product")}, ${plural(jobs.length, "photo")}`
        : `${green(bold("Already up to date:"))} ${plural(products.length, "product")}, ${plural(jobs.length, "photo")}`,
      categories.length ? `  Categories   ${categories.join(", ")}` : null,
      collections.length ? `  Collections  ${collections.join(", ")}` : null,
      `  Photos       ${megabytes(totals.in)} in, ${megabytes(totals.out)} on the site (${totals.fresh} processed, ${results.length - totals.fresh} unchanged)`,
      `  Banners      ${bannerNote || "none, so product photos are used"}`,
      rowOrder ? dim("  No photo column, so row order is used: the first product is 1.jpg, the second 2.jpg.") : null,
      `  Saved to     ${rel(OUT_DIR)}/ and ${rel(DATA_FILE)}`,
      "",
      `Next: open ${bold("http://localhost:3000/sample")} (refresh it if it's already open).`,
    ].filter((l) => l !== null).join("\n"),
  );
}

/* ── Photos ─────────────────────────────────────────────────────── */
async function scanPhotos(dir) {
  const byCode = new Map();
  const brand = { hero: null, story: null, looks: new Map() };
  let count = 0;

  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (!e.isFile() || e.name.startsWith(".") || !IMAGE_EXT.test(e.name)) continue;
    count++;
    const file = path.join(dir, e.name);
    const where = path.relative(CAT_DIR, file).split(path.sep).join("/"); // e.g. photos/7.jpg
    const base = e.name.replace(IMAGE_EXT, "").trim();

    const banner = /^(hero|story|look\s*[-_ ]?\s*([1-9]))$/i.exec(base);
    if (banner) {
      if (banner[2]) {
        const n = Number(banner[2]);
        if (brand.looks.has(n)) error(where, `Two files for lookbook image ${n}. Keep one.`);
        else brand.looks.set(n, { file, where });
      } else {
        const key = banner[1].toLowerCase();
        if (brand[key]) error(where, `Two files named "${key}". Keep one.`);
        else brand[key] = { file, where };
      }
      continue;
    }

    // 7.jpg, 07.jpg, 7-2.jpg, 7_2.jpg, "7 2.jpg", 7.2.jpg and "7 (2).jpg" are all understood.
    const m = /^0*(\d{1,5})(?:\s*[-_.\s]\s*0*(\d{1,2})|\s*\(\s*0*(\d{1,2})\s*\))?$/.exec(base);
    if (!m) {
      warn(where, 'Skipped. Name photos with the product number, like "7.jpg", or "7-2.jpg" for a second angle.');
      continue;
    }
    const code = Number(m[1]);
    const angle = Number(m[2] ?? m[3] ?? 1);
    if (code === 0) {
      warn(where, "Skipped. Product numbers start at 1.");
      continue;
    }
    const list = byCode.get(code) ?? [];
    const clash = list.find((p) => p.angle === angle);
    if (clash) {
      error(where, `Clashes with ${path.basename(clash.file)}: both are photo ${code}${angle > 1 ? `, angle ${angle}` : ""}. Keep one.`);
      continue;
    }
    list.push({ angle, file, where });
    byCode.set(code, list);
  }
  for (const list of byCode.values()) list.sort((a, b) => a.angle - b.angle);
  return { byCode, brand, count };
}

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    error("setup", 'The image tool "sharp" is missing. Run: npm install');
    return null;
  }
}

async function processImage(job, sharp, cache) {
  const bytes = await readFile(job.file);
  const hash = createHash("sha1").update(`${PIPELINE}:${job.edge}:`).update(bytes).digest("hex").slice(0, 10);
  const name = `${job.base}-${hash}.webp`;
  const out = path.join(OUT_DIR, name);

  const cached = cache[name];
  if (cached && existsSync(out)) {
    for (const note of cached.notes ?? []) warn(job.where, note);
    return { name, ...cached, inBytes: bytes.length, reused: true };
  }

  let meta;
  try {
    meta = await sharp(bytes).metadata();
  } catch {
    error(
      job.where,
      /\.hei[cf]$/i.test(job.file)
        ? "iPhone HEIC photos can't be read. Export it as JPG, or set iPhone Settings > Camera > Formats > Most Compatible."
        : "This file couldn't be opened as an image. It may be damaged; save or export it again as JPG.",
    );
    return null;
  }

  // Phones store portrait shots sideways with a rotation flag; account for it.
  const sideways = (meta.orientation ?? 1) >= 5;
  const w = sideways ? meta.height : meta.width;
  const h = sideways ? meta.width : meta.height;
  const notes = [];
  if (job.kind === "product") {
    if (Math.min(w, h) < 900) notes.push(`Only ${w}x${h}px, so it may look soft. 1200px wide or more is best.`);
    if (w > h * 1.05) notes.push("Landscape photo. Product cards are portrait, so the sides get cropped. Portrait (3:4) works best.");
  } else if (job.kind === "hero" && h > w) {
    notes.push("The hero image is portrait. A wide (landscape) photo fills the banner better.");
  }
  for (const note of notes) warn(job.where, note);

  if (CHECK) return { name, width: w, height: h, blur: "", inBytes: bytes.length, reused: false };

  try {
    // .rotate() applies the phone's orientation. Output carries no EXIF,
    // so GPS location and camera details never reach the website.
    const base = sharp(bytes, { failOn: "truncated" }).rotate();
    const { data, info } = await base
      .clone()
      .resize({ width: job.edge, height: job.edge, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    const tiny = await base.clone().resize({ width: BLUR_EDGE, height: BLUR_EDGE, fit: "inside" }).webp({ quality: 40 }).toBuffer();
    await writeFile(out, data);
    const entry = { width: info.width, height: info.height, blur: `data:image/webp;base64,${tiny.toString("base64")}`, outBytes: data.length, notes };
    cache[name] = entry;
    return { name, ...entry, inBytes: bytes.length, reused: false };
  } catch {
    error(job.where, "This photo couldn't be processed. It may be incomplete; save or export it again as JPG.");
    return null;
  }
}

/* ── CSV ────────────────────────────────────────────────────────── */
async function readProducts(csvPath, photos) {
  const where = rel(csvPath);
  const buf = await readFile(csvPath);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    text = new TextDecoder("windows-1252").decode(buf);
    warn(where, 'Saved in an older Excel format, so special characters may come out wrong. In Excel use File > Save As > "CSV UTF-8".');
  }
  text = text.replace(/^﻿/, "");

  // Excel uses ";" in some regions and Sheets can export tabs; pick whichever the header uses.
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const { rows, open } = parseCsv(text, delimiter);
  if (open) {
    error(where, 'A quotation mark (") is opened but never closed. Check any cell that contains quotes.');
    return { products: [], rowOrder: false };
  }

  // Row numbers match what Excel or Google Sheets shows (header = row 1).
  const filled = rows.map((cells, i) => ({ cells, row: i + 1 })).filter((r) => r.cells.some((c) => c.trim() !== ""));
  if (filled.length < 2) {
    error(where, "The CSV has no products. Row 1 holds the column names; products start on row 2.");
    return { products: [], rowOrder: false };
  }
  const [head, ...data] = filled;

  const cols = {};
  head.cells.forEach((raw, idx) => {
    const label = raw.trim();
    if (!label) return;
    const key = label === "#" ? "photo" : lookupField(label);
    if (!key) {
      warn(where, `Column "${label}" isn't one we use, so it was ignored.`);
      return;
    }
    if (cols[key] !== undefined) {
      error(where, `Two columns mean the same thing: "${head.cells[cols[key]].trim()}" and "${label}". Keep one.`);
      return;
    }
    cols[key] = idx;
  });
  for (const need of ["name", "price"]) {
    if (cols[need] === undefined) error(where, `There's no "${need}" column. Row 1 must hold column names; see catalog/_template/products.csv.`);
  }
  if (problems.errors.length) return { products: [], rowOrder: false };

  const rowOrder = cols.photo === undefined;
  const products = [];
  const codeRow = new Map();

  data.forEach(({ cells, row }, i) => {
    const get = (k) => (cols[k] === undefined ? "" : (cells[cols[k]] ?? "").trim());
    const before = problems.errors.length;
    const name = get("name").replace(/\s+/g, " ");
    const at = `Row ${row}${name ? ` (${name})` : ""}`;

    const photoRaw = get("photo").replace(/^#/, "").replace(IMAGE_EXT, "").trim();
    const code = rowOrder ? i + 1 : Number(photoRaw);
    if (!name) error(at, "Name is empty.");
    if (!rowOrder && (!photoRaw || !Number.isInteger(code) || code < 1)) {
      error(at, `Photo number "${get("photo")}" should be a whole number like 7, to match 7.jpg.`);
    } else if (codeRow.has(code)) {
      error(at, `Uses photo ${code}, which row ${codeRow.get(code)} already uses. Each product needs its own number.`);
    } else {
      codeRow.set(code, row);
    }

    const price = money(get("price"));
    if (price === null) error(at, "Price is empty.");
    else if (Number.isNaN(price) || price <= 0) error(at, `Price "${get("price")}" isn't a number. Write it like 2199.`);

    let mrp = money(get("mrp"));
    if (mrp !== null && (Number.isNaN(mrp) || mrp <= 0)) {
      warn(at, `MRP "${get("mrp")}" isn't a number, so it was left out.`);
      mrp = null;
    } else if (mrp !== null && typeof price === "number" && mrp <= price) {
      if (mrp < price) warn(at, `MRP (${rs(mrp)}) is lower than the price (${rs(price)}), so no crossed-out price is shown.`);
      mrp = null;
    }

    let inStock = yesNo(get("instock"), true);
    if (inStock === undefined) {
      warn(at, `In-stock value "${get("instock")}" wasn't understood (use yes or no). Treated as in stock.`);
      inStock = true;
    }
    let featured = yesNo(get("featured"), false);
    if (featured === undefined) {
      warn(at, `Featured value "${get("featured")}" wasn't understood (use yes or no). Treated as no.`);
      featured = false;
    }

    const tag = get("tag");
    if (tag.length > 18) warn(at, `Tag "${tag}" is long and may be cut off on small screens.`);
    if (name.length > 70) warn(at, "Name is long; it will wrap onto several lines on the product card.");

    const files = Number.isInteger(code) ? photos.byCode.get(code) : undefined;
    if (Number.isInteger(code) && code > 0 && name && (!files || files.length === 0)) {
      error(at, `No photo found. Expected ${code}.jpg (or .png / .webp) in the photos folder.`);
    } else if (files && files.length > MAX_ANGLES) {
      warn(at, `Has ${files.length} photos; only the first ${MAX_ANGLES} are used.`);
    }

    if (problems.errors.length > before) return;
    products.push({
      code,
      row,
      name,
      price,
      mrp,
      category: tidy(get("category")),
      collection: tidy(get("collection")),
      colour: get("colour"),
      fabric: get("fabric"),
      care: get("care"),
      description: get("description").replace(/\s*\n\s*/g, " "),
      sizes: parseSizes(get("sizes")),
      tag,
      inStock,
      featured,
      files: files.slice(0, MAX_ANGLES),
    });
  });

  unifyCase(products, "category");
  unifyCase(products, "collection");

  for (const [code, list] of photos.byCode) {
    if (!codeRow.has(code)) warn(list[0].where, `No product in the CSV uses photo ${code}, so it was skipped.`);
  }
  return { products, rowOrder };
}

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and line breaks inside quotes. */
function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field.trim() === "") {
      quoted = true;
      field = "";
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return { rows, open: quoted };
}

function lookupField(label) {
  const key = label.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
  return FIELD_BY_ALIAS.get(key) ?? FIELD_BY_ALIAS.get(key.replace(/(rs|inr|rupees)$/, ""));
}

/** "2199", "2,199", "Rs. 2,199/-" and "₹2199" all read as 2199. */
function money(value) {
  const s = value.replace(/₹|rs\.?|inr|\/-|\s|,/gi, "");
  if (!s) return null;
  return /^\d+(\.\d+)?$/.test(s) ? Math.round(Number(s)) : Number.NaN;
}

function yesNo(value, fallback) {
  const s = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!s) return fallback;
  if (YES.has(s)) return true;
  if (NO.has(s)) return false;
  return undefined;
}

const sizeKey = (s) => {
  const u = s.toUpperCase().replace(/\s+/g, "");
  return SIZE_ALIAS[u] ?? u;
};

/** "S, M, L", "S-XL", "XS to XXL", "Free size" and "32/34/36" are all understood. */
function parseSizes(value) {
  const out = [];
  for (const raw of value.split(/[,/|;]+/)) {
    const part = raw.trim();
    if (!part) continue;
    if (/^(free\s*-?\s*size|one\s*size)$/i.test(part)) {
      out.push("Free size");
      continue;
    }
    const range = /^([a-z0-9]+)\s*(?:-|–|to)\s*([a-z0-9]+)$/i.exec(part);
    if (range) {
      const a = SIZE_ORDER.indexOf(sizeKey(range[1]));
      const b = SIZE_ORDER.indexOf(sizeKey(range[2]));
      if (a >= 0 && b >= a) {
        out.push(...SIZE_ORDER.slice(a, b + 1));
        continue;
      }
    }
    const k = sizeKey(part);
    out.push(SIZE_ORDER.includes(k) ? k : part);
  }
  return [...new Set(out)];
}

const tidy = (value) => value.replace(/\s+/g, " ").trim();
const titleCase = (s) => s.replace(/(^|\s)(\p{Ll})/gu, (_, gap, ch) => gap + ch.toUpperCase());

/** Treat "kurtas" and "Kurtas" as one group, shown with a capitalised
    spelling: the first one typed with a capital, else title case. */
function unifyCase(products, field) {
  const spellings = new Map();
  for (const p of products) {
    if (!p[field]) continue;
    const key = p[field].toLowerCase();
    spellings.set(key, [...(spellings.get(key) ?? []), p[field]]);
  }
  for (const p of products) {
    if (!p[field]) continue;
    const all = spellings.get(p[field].toLowerCase());
    p[field] = all.find((s) => /^\p{Lu}/u.test(s)) ?? titleCase(all[0]);
  }
}

function slug(s) {
  return (
    s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "item"
  );
}

/* ── Files ──────────────────────────────────────────────────────── */
async function writeJson(obj) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await writeFile(tmp, `${JSON.stringify(obj, null, 2)}\n`);
  await rename(tmp, DATA_FILE); // atomic: the dev server never sees a half-written file
}

async function readCache() {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeCache(cache) {
  try {
    await mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(cache));
  } catch {
    /* cache is only a speed-up */
  }
}

async function clearCatalogue() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await writeJson(EMPTY);
  console.log(`${green(bold("Catalogue cleared."))} /sample shows the demo products again. Your catalog/ folder was not touched.`);
  return 0;
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out.filter(Boolean);
}

function finish(summary) {
  // Spreadsheet rows first (in row order), then files in natural order (5.jpg before 10.jpg).
  const byPlace = (a, b) =>
    Number(!a.where.startsWith("Row ")) - Number(!b.where.startsWith("Row ")) ||
    a.where.localeCompare(b.where, undefined, { numeric: true });
  const errors = [...problems.errors].sort(byPlace);
  const warnings = [...problems.warnings].sort(byPlace);
  if (errors.length) {
    for (const w of warnings) console.log(`  ${yellow("warn")}  ${dim(w.where)}  ${w.msg}`);
    console.log(`\n${red(bold(`${plural(errors.length, "problem")} to fix:`))}`);
    for (const e of errors) console.log(`  ${red("fix")}   ${dim(e.where)}  ${e.msg}`);
    console.log(
      `\n${SOFT ? "The store is still showing its previous products." : "Nothing on the site was changed."} Fix the above, then run ${bold("npm run catalog")}.`,
    );
    return SOFT ? 0 : 1;
  }
  if (summary) console.log(summary);
  if (warnings.length && !SOFT) {
    console.log(`\n${yellow(bold(plural(warnings.length, "thing") + " to look at"))} ${dim("(imported anyway):")}`);
    for (const w of warnings) console.log(`  ${yellow("warn")}  ${dim(w.where)}  ${w.msg}`);
  } else if (warnings.length) {
    console.log(dim(`catalog: ${plural(warnings.length, "warning")}; run "npm run catalog" to see them.`));
  }
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((e) => {
    console.error(`${red("Catalogue import failed:")} ${e?.message ?? e}`);
    process.exitCode = SOFT ? 0 : 1;
  });
