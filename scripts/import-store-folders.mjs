#!/usr/bin/env node
/**
 * Folder-per-category importer.
 *
 * Some people organise a store as one folder per category, each holding photos
 * numbered from 1, plus a single spreadsheet with a small table per category:
 *
 *   Impact Store/
 *     Impact Store - Sheet1.csv
 *     Jerseys/   1.png 2.png ...
 *     Shoes/     1.png 2.png ...
 *
 * The spreadsheet stacks the tables vertically, each headed by the category name:
 *
 *   Trousers,,Price
 *   1,Adidas Triple Stripe Black Track Pants,"₹1,799"
 *   ...
 *   ,Shirts,Price
 *   1,Deer Graphic Beige,"₹1,799"
 *
 * This script flattens that into the standard catalog/ layout (photos/1.png…N.png
 * plus products.csv) so the tested importer (scripts/import-catalog.mjs) can take
 * over: WebP conversion, GPS/EXIF stripping, validation and blur previews.
 *
 *   npm run catalog:folders                     read the newest store folder
 *   npm run catalog:folders -- "Impact Store"   read a named folder
 *
 * It does not delete your source folder or touch the live site by itself; it
 * writes catalog/, then hands off to `npm run catalog`.
 */
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "catalog");
const PHOTOS = path.join(CATALOG, "photos");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|heic|heif)$/i;

// Default sizes, since the sheet has none. Shoes use UK numbers; clothing uses letters.
const SHOE_WORDS = /\b(shoes?|sneakers?|trainers?|footwear|boots?)\b/i;
const CLOTHING_SIZES = "S,M,L,XL,XXL";
const SHOE_SIZES = "UK 6,UK 7,UK 8,UK 9,UK 10,UK 11";
// The one product shown large in the home banner (first match wins). Keep it a
// clean studio shot; falls back to the first product if none match.
const HERO_PREF = /air force 1|argentina afa tricolor|nitro elite/i;

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const problems = [];
const fail = (m) => problems.push(m);

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += ch;
    } else if (ch === '"' && field.trim() === "") { quoted = true; field = ""; }
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

async function newestStoreFolder() {
  const skip = new Set(["catalog", "public", "src", "scripts", "node_modules", "reference", ".git", ".next", ".claude", ".agents"]);
  const dirs = (await readdir(ROOT, { withFileTypes: true })).filter((e) => e.isDirectory() && !e.name.startsWith(".") && !skip.has(e.name));
  for (const d of dirs) {
    const files = await readdir(path.join(ROOT, d.name)).catch(() => []);
    const hasCsv = files.some((f) => /\.csv$/i.test(f));
    const hasSub = (await Promise.all(files.map(async (f) => (await readdir(path.join(ROOT, d.name, f)).catch(() => null))?.some((x) => IMAGE_EXT.test(x))))).some(Boolean);
    if (hasCsv && hasSub) return d.name;
  }
  return null;
}

async function main() {
  const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const folderName = arg ?? (await newestStoreFolder());
  if (!folderName) {
    console.log(red("Couldn't find a store folder with category subfolders and a CSV. Pass one by name, e.g.:") + '\n  npm run catalog:folders -- "Impact Store"');
    return 1;
  }
  const SRC = path.resolve(ROOT, folderName);
  if (!existsSync(SRC)) { console.log(red(`Folder not found: ${folderName}`)); return 1; }

  const entries = await readdir(SRC, { withFileTypes: true });
  const csvName = entries.find((e) => e.isFile() && /\.csv$/i.test(e.name) && !e.name.startsWith("~"))?.name;
  if (!csvName) { console.log(red(`No CSV file inside "${folderName}".`)); return 1; }

  // Folder lookup by lowercased name (so "T Shirts" matches the CSV section "T Shirts").
  const folders = new Map(entries.filter((e) => e.isDirectory()).map((e) => [e.name.toLowerCase(), e.name]));

  let text;
  const buf = await readFile(path.join(SRC, csvName));
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(buf); }
  catch { text = new TextDecoder("windows-1252").decode(buf); }
  const rows = parseCsv(text.replace(/^﻿/, ""));

  const products = [];
  let current = null; // { category, folder }
  rows.forEach((cells, i) => {
    const c = cells.map((x) => (x ?? "").trim());
    if (c.every((x) => x === "")) { current = null; return; }

    // Section header: a row whose last non-empty cell reads "Price" and that names a category.
    const isHeader = c.some((x) => x.toLowerCase() === "price") && !/^\d+$/.test(c[0]);
    if (isHeader) {
      const category = c.find((x) => x && x.toLowerCase() !== "price") ?? "";
      const folder = folders.get(category.toLowerCase());
      if (!folder) fail(`Row ${i + 1}: no photo folder named "${category}" inside "${folderName}".`);
      current = { category, folder };
      return;
    }

    const [num, name, price] = c;
    if (!/^\d+$/.test(num)) return; // stray / notes row
    if (!current) { fail(`Row ${i + 1}: product "${name || num}" appears before any category heading.`); return; }
    if (!name) { fail(`Row ${i + 1}: product ${num} in ${current.category} has no name.`); return; }
    if (!current.folder) return; // header already reported

    const src = path.join(SRC, current.folder, `${num}.png`);
    if (!existsSync(src)) { fail(`${current.category} #${num} ("${name}"): missing photo ${current.folder}/${num}.png`); return; }
    products.push({ category: current.category, src, name, price });
  });

  if (problems.length) {
    console.log(red(bold(`\n${problems.length} problem(s) — nothing was written:`)));
    for (const p of problems) console.log("  " + p);
    return 1;
  }
  if (products.length === 0) { console.log(red("No products found in the sheet.")); return 1; }

  // Rebuild catalog/photos and products.csv from scratch.
  await rm(PHOTOS, { recursive: true, force: true });
  await mkdir(PHOTOS, { recursive: true });

  const heroIdx = products.findIndex((p) => HERO_PREF.test(p.name));
  const header = "photo,name,price,category,sizes,featured";
  const lines = [header];
  let n = 0;
  for (const p of products) {
    n++;
    await copyFile(p.src, path.join(PHOTOS, `${n}.png`));
    const sizes = SHOE_WORDS.test(p.category) || SHOE_WORDS.test(p.name) ? SHOE_SIZES : CLOTHING_SIZES;
    const featured = products[heroIdx] === p ? "yes" : (heroIdx === -1 && n === 1 ? "yes" : "");
    lines.push([n, p.name, p.price, p.category, sizes, featured].map((v) => csvCell(String(v))).join(","));
  }
  await writeFile(path.join(CATALOG, "products.csv"), lines.join("\n") + "\n", "utf8");

  const byCat = products.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {});
  console.log(green(bold(`Prepared ${products.length} products from "${folderName}".`)));
  for (const [cat, count] of Object.entries(byCat)) console.log(`  ${cat.padEnd(12)} ${count}`);
  console.log(`\nWrote ${path.relative(ROOT, path.join(CATALOG, "products.csv"))} and ${products.length} photos to catalog/photos/.`);
  console.log(`Now optimising them...\n`);
  return 0;
}

main().then((code) => { process.exitCode = code; }).catch((e) => {
  console.error(red("Folder import failed: ") + (e?.stack ?? e));
  process.exitCode = 1;
});
