#!/usr/bin/env node
/* Downloads the stock photos used by the /templates showcase shops and writes
   src/data/sample-images.json. Photos are from Unsplash (free for commercial
   use under the Unsplash License, https://unsplash.com/license); photographers
   are credited in public/samples/CREDITS.md. Run: node scripts/fetch-samples.mjs */
import fs from "node:fs";
import path from "node:path";
import { download, optimise, ROOT, say, writeJson } from "./lib/common.mjs";

const U = (id, by) => ({ url: `https://images.unsplash.com/${id}?w=1600&q=85&fm=jpg`, by });
// [product number, photo, optional "on model" photo]
const PHOTOS = {
  handicrafts: [
    [1, U("photo-1578678809569-1a8ead9cb802", "Content Pixie")],
    [2, U("photo-1643509877015-c90830bb8519", "Igor Savelev")],
    [3, U("photo-1622153093514-4dd0078ac132", "Kat Med")],
    [4, U("photo-1590751518505-1fc2d227ef9b", "Michelle Garres")],
    [5, U("photo-1659520709425-31b547254b59", "Tuyen Vo")],
    [6, U("photo-1524679813234-66a389fe1a42", "tamaki kato")],
    [7, U("photo-1756362398677-4fd1a4f9f64b", "engin akyurt")],
    [8, U("photo-1591195853317-6b4249a1b03b", "engin akyurt")],
    [9, U("photo-1616961002389-504228edfcb7", "Gabriella Clare Marino")],
    [10, U("photo-1779357807367-d661cc51a362", "Random Institute")],
    [11, U("photo-1779905702925-d25860db6f61", "Fujiphilm")],
    [12, U("photo-1575277340591-849c346c4542", "Awesome Sauce Creative")],
  ],
  jewellery: [
    [1, U("photo-1738754719555-05aca36707b1", "cherriscope lifestyle"), U("photo-1787831398033-d70495c1e8a4", "Picture & Poet")],
    [2, U("photo-1714733831162-0a6e849141be", "Johny Silver"), U("photo-1597055952513-4e9bce9345c3", "Mukul Kumar")],
    [3, U("photo-1543294001-f7cd5d7fb516", "Cornelia Ng")],
    [4, U("photo-1605100804763-247f67b3557e", "Sabrianna")],
    [5, U("photo-1635767798638-3e25273a8236", "Eve Maier"), U("photo-1620291699655-d958150a3ff8", "Edward Xu")],
    [6, U("photo-1573408301185-9146fe634ad0", "Carlos Esteves")],
    [7, U("photo-1606293926249-ed22e446d476", "Sonika Agarwal"), U("photo-1763578590148-fbac0711f3b2", "nupur Batra")],
    [8, U("photo-1623135600383-7fdef487617d", "injamul haque")],
    [9, U("photo-1651395835317-d2868e8ebcac", "Bhawana priyadarshini"), U("photo-1635770607507-beb7d7972491", "BenMoses M")],
    [10, U("photo-1722410180687-b05b50922362", "PRAHANT STUDIO"), U("photo-1610276347467-2f3a6053d297", "Bulbul Ahmed")],
    [11, U("photo-1587593692659-38c32c496642", "Coco Tafoya")],
  ],
};

const OUT = path.join(ROOT, "public", "samples");
const manifest = {};
const credits = new Set();
for (const [genre, rows] of Object.entries(PHOTOS)) {
  fs.mkdirSync(path.join(OUT, genre), { recursive: true });
  manifest[genre] = {};
  for (const [n, photo, worn] of rows) {
    const imgs = [];
    for (const [p, suffix, model] of [[photo, "", false], [worn, "-model", true]]) {
      if (!p) continue;
      const img = await optimise(await download(p.url), 1400);
      const rel = `/samples/${genre}/${n}${suffix}.webp`;
      fs.writeFileSync(path.join(ROOT, "public", rel), img.data);
      imgs.push({ src: rel, width: img.width, height: img.height, blur: img.blur, ...(model ? { model: true } : {}) });
      credits.add(p.by);
    }
    manifest[genre][n] = imgs;
    say.ok(`${genre} ${n}: ${imgs.length} photo(s)`);
  }
}
writeJson(path.join(ROOT, "src", "data", "sample-images.json"), manifest);
fs.writeFileSync(path.join(OUT, "CREDITS.md"),
  `# Sample photo credits\n\nShowcase photos are from [Unsplash](https://unsplash.com) under the [Unsplash License](https://unsplash.com/license).\nPhotographers: ${[...credits].sort().join(", ")}.\n`);
say.ok("Wrote src/data/sample-images.json");
