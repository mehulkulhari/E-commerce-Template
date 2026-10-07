/* Photo screening for preview sites. Runs a CLIP model on this computer
   (free, no API key; the ~90 MB model downloads once into the Hugging Face
   cache) to sort each photo into "product", "worn by a model" or junk:
   people talking to camera, sale posters with big text, shop interiors.
   Only used by the local prospect scripts, never by the website. */
import { pipeline, RawImage } from "@huggingface/transformers";
import sharp from "sharp";

/* Text on a photo (sale banners, "Order now 98xxx", captioned reel covers):
   CLIP sees *what* is in a picture but not printed text, so we also read it
   with Tesseract OCR (also local and free). Only confident, real words count. */
let ocr;
export async function readText(buf) {
  if (!ocr) {
    const { createWorker } = await import("tesseract.js");
    ocr = await createWorker("eng");
    await ocr.setParameters({ user_defined_dpi: "300" });
  }
  const png = await sharp(buf).resize(800, 800, { fit: "inside" }).png().toBuffer();
  const { width, height } = await sharp(png).metadata();
  const { data } = await ocr.recognize(png, {}, { blocks: true });
  const words = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)))
    .filter((w) => w.confidence >= 75 && /[A-Za-z0-9₹]{3,}/.test(w.text));
  const area = words.reduce((s, w) => s + (w.bbox.x1 - w.bbox.x0) * (w.bbox.y1 - w.bbox.y0), 0) / (width * height);
  return { words: words.length, area };
}
export async function closeOcr() { if (ocr) { await ocr.terminate(); ocr = undefined; } }

const GOOD = {
  apparel: [
    ["a photo of a dress or ethnic outfit", "product"],
    ["clothes folded or on a hanger", "product"],
    ["a woman modelling an outfit", "model"],
  ],
  jewellery: [
    ["a close-up photo of jewellery", "product"],
    ["jewellery on a display stand or in a box", "product"],
    ["a woman wearing earrings and a necklace", "model"],
  ],
  handicrafts: [
    ["a photo of a handmade home decor product", "product"],
    ["a handicraft item on a table", "product"],
    ["a room decorated with handmade decor", "product"],
  ],
};
const BAD = [
  "a man talking to the camera",
  "a man sitting at a desk in an office",
  "a man in a shirt gesturing with his hands",
  "a person taking a selfie",
  "a poster or advertisement with large text",
  "a sale offer graphic with a price written in big bold letters",
  "a video thumbnail with big text written on top",
  "a screenshot of text",
  "the inside of a crowded shop with shelves",
  "cardboard boxes or parcels packed for shipping",
  "a group of people at an event",
  "food on a plate",
];

const TEXTISH = ["a poster or advertisement with large text", "a sale offer graphic with a price written in big bold letters",
  "a video thumbnail with big text written on top", "a screenshot of text"];
const PERSON = ["a man talking to the camera", "a man sitting at a desk in an office", "a man in a shirt gesturing with his hands", "a person taking a selfie"];

let clf;
async function model() {
  clf ??= await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", { dtype: "q8" });
  return clf;
}

/** Classify one photo (a Buffer). Returns { keep, kind, score, top }:
    keep = mostly a product / worn shot; kind = "product" | "model" | "junk". */
export async function screen(buf, genre) {
  const c = await model();
  const image = await RawImage.fromBlob(new Blob([buf]));
  const good = GOOD[genre] ?? GOOD.apparel;
  const labels = [...good.map(([l]) => l), ...BAD];
  const out = await c(image, labels);
  const p = Object.fromEntries(out.map((o) => [o.label, o.score]));
  const goodScore = good.reduce((s, [l]) => s + p[l], 0);
  const best = good.map(([l, kind]) => ({ l, kind, s: p[l] })).sort((a, b) => b.s - a.s)[0];
  const top = out[0].label;
  const sum = (ls) => ls.reduce((s, l) => s + (p[l] ?? 0), 0);
  // Text overlays (sale posters, captioned reel covers) and people talking /
  // sitting in the shop are junk even when some product is visible in frame.
  const textish = sum(TEXTISH);
  const person = sum(PERSON);
  let keep = goodScore >= 0.5 && textish < 0.15 && person < 0.2;
  // Read printed text only on photos that passed: a poster (many words, or
  // text over a big share of the frame) is junk; any text makes a poor lead.
  let words = 0;
  if (keep) {
    const t = await readText(buf);
    words = t.words;
    if (t.words >= 6 || t.area >= 0.025) keep = false;
  }
  // "On model" only when clearly worn — a hand holding earrings is a product shot.
  const kind = !keep ? "junk" : best.kind === "model" && best.s >= 0.6 ? "model" : "product";
  return { keep, kind, score: Number(goodScore.toFixed(3)), textish: Number(textish.toFixed(2)), person: Number(person.toFixed(2)), words, top };
}
