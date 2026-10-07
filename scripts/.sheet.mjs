import sharp from "sharp"; import { download } from "./lib/common.mjs"; import { createClient } from "@supabase/supabase-js";
const [slug, out] = process.argv.slice(2);
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("demos").select("spec").eq("slug", slug).single();
const S = 220, cols = 6, ps = data.spec.products.slice(0, 12);
const tiles = await Promise.all(ps.map(async (p, i) => {
  const img = await sharp(await download(p.images[0].src)).resize(S, S, { fit: "cover" }).toBuffer();
  const label = Buffer.from(`<svg width="${S}" height="28"><rect width="${S}" height="28" fill="yellow"/><text x="6" y="20" font-size="18" font-family="sans-serif" font-weight="bold">${p.n}</text></svg>`);
  return { input: await sharp(img).composite([{ input: label, top: 0, left: 0 }]).toBuffer(), left: (i % cols) * S, top: Math.floor(i / cols) * S };
}));
await sharp({ create: { width: cols * S, height: Math.ceil(ps.length / cols) * S, channels: 3, background: "#fff" } }).composite(tiles).png().toFile(out);
console.log(out);
