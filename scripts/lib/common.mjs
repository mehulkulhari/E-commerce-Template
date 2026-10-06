/* Shared helpers for the prospect and model-shot scripts: env loading, the
   service-role Supabase client, photo optimisation and storage upload. */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// .env.local is read here because these scripts run outside Next.js.
for (const f of [".env.local", ".env"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) { try { process.loadEnvFile(p); } catch { /* ignore malformed */ } }
}

const c = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m" };
export const say = {
  ok: (m) => console.log(`${c.green}✓${c.reset} ${m}`),
  warn: (m) => console.log(`${c.yellow}!${c.reset} ${m}`),
  err: (m) => console.error(`${c.red}✗${c.reset} ${m}`),
  dim: (m) => console.log(`${c.dim}${m}${c.reset}`),
  bold: (m) => console.log(`${c.bold}${m}${c.reset}`),
};

export function die(msg) { say.err(msg); process.exit(1); }

export function need(name, help) {
  const v = process.env[name];
  if (!v) die(`${name} is not set. ${help}`);
  return v;
}

/** Service-role client. Bypasses RLS: only ever used by these local scripts. */
export function supabase() {
  const url = need("NEXT_PUBLIC_SUPABASE_URL", "Add it to .env.local.");
  const key = need("SUPABASE_SERVICE_ROLE_KEY",
    "Copy the service_role key from Supabase → Settings → API into .env.local (never commit it).");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

let sharpMod;
async function sharp() {
  if (!sharpMod) {
    try { sharpMod = (await import("sharp")).default; }
    catch { die('The image tool "sharp" is missing. Run: npm install'); }
  }
  return sharpMod;
}

/** Right-side-up, EXIF-stripped WebP plus a tiny blurred preview. */
export async function optimise(buf, edge = 1200) {
  const s = await sharp();
  const base = s(buf, { failOn: "truncated" }).rotate();
  const { data, info } = await base.clone()
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  const tiny = await base.clone().resize({ width: 16, height: 16, fit: "inside" }).webp({ quality: 40 }).toBuffer();
  return { data, width: info.width, height: info.height, blur: `data:image/webp;base64,${tiny.toString("base64")}` };
}

export const hash = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10);

/** Upload an optimised image and return its SpecImage. */
export async function uploadImage(sb, bucket, objectPath, img, extra = {}) {
  const { error } = await sb.storage.from(bucket).upload(objectPath, img.data, { contentType: "image/webp", upsert: true });
  if (error) throw new Error(`upload ${objectPath}: ${error.message}`);
  const { data } = sb.storage.from(bucket).getPublicUrl(objectPath);
  return { src: data.publicUrl, width: img.width, height: img.height, blur: img.blur, ...extra };
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
export async function download(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/*,*/*" } });
  if (!r.ok) throw new Error(`download ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
export function writeJson(p, v) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2));
}

export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { out[k] = next; i++; } else out[k] = true;
    } else out._.push(a);
  }
  return out;
}
