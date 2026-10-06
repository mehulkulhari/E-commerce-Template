/* Pure functions that turn a scraped Instagram profile into a shop:
   genre, "do they already have a website?", and products from posts.
   No network here, so it can be tested on its own (npm run prospects -- test). */

const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\u200d\ufe0f\u20e3]/gu;

/** Strip emojis, hashtags, mentions and links; collapse whitespace. */
export function clean(s = "") {
  return String(s)
    .replace(EMOJI, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#@][\p{L}\p{N}_.]+/gu, " ")
    .replace(/[|•·★☆✦✧❤♥]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const KEYWORDS = {
  apparel: /\b(boutique|clothing|clothes|kurti|kurtis|kurta|saree|sarees|sari|lehenga|lehnga|suits?|salwar|anarkali|ethnic ?wear|western ?wear|fashion|apparel|garments?|dress(es)?|co-?ords?|designer wear|tailor|stitching|tops?|gowns?|dupattas?|menswear|womenswear)\b/g,
  jewellery: /\b(jewell?e?ry|jewelry|jewels?|earrings?|jhumk[ai]s?|oxidi[sz]ed|artificial|imitation|kundan|polki|american diamond|anklets?|bangles?|necklaces?|chokers?|rings|maang ?tikka|nose ?pins?|accessories|bracelets?|pendants?)\b/g,
  handicrafts: /\b(handicrafts?|handmade|hand-?made|handcrafted|hand-?crafted|home ?decor|decor|crafts?|pottery|ceramics?|macrame|artisans?|block ?print(ed)?|terracotta|bamboo|cane|jute|rattan|candles?|resin ?art|wall ?art|planters?|baskets?|diyas?|blue pottery|dhurries?)\b/g,
};
const CATEGORY_HINTS = {
  apparel: /clothing|apparel|fashion|boutique|tailor/i,
  jewellery: /jewel|watch|accessor/i,
  handicrafts: /craft|decor|home goods|art|furniture|gift/i,
};

/** Score each genre; returns { genre, score, scores } or genre null if unclear. */
export function classify(profile) {
  const text = [profile.fullName, profile.username, profile.biography, profile.businessCategoryName,
    ...(profile.latestPosts ?? []).slice(0, 12).map((p) => p.caption)].join(" \n ").toLowerCase();
  const scores = {};
  for (const [g, re] of Object.entries(KEYWORDS)) scores[g] = (text.match(re) ?? []).length;
  for (const [g, re] of Object.entries(CATEGORY_HINTS)) if (re.test(profile.businessCategoryName ?? "")) scores[g] += 5;
  const [genre, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { genre: score >= 2 ? genre : null, score, scores };
}

// Link-in-bio hubs, chat links, socials and marketplaces are not an own website.
const NOT_A_SITE = /(^|\.)(linktr\.ee|linkin\.bio|beacons\.ai|bio\.link|bio\.site|taplink\.cc|lnk\.bio|campsite\.bio|msha\.ke|solo\.to|wa\.me|whatsapp\.com|wa\.link|instagram\.com|facebook\.com|fb\.me|fb\.com|youtube\.com|youtu\.be|threads\.net|bit\.ly|tinyurl\.com|cutt\.ly|forms\.gle|docs\.google\.com|google\.com|g\.page|goo\.gl|maps\.app\.goo\.gl|t\.me|telegram\.me|meesho\.com|amazon\.in|amzn\.to|flipkart\.com|myntra\.com|etsy\.com|ajio\.com|nykaa\.com|jiomart\.com)$/i;

export function linksOf(profile) {
  const urls = [profile.externalUrl, ...(profile.externalUrls ?? []).map((l) => l?.url ?? l)].filter(Boolean);
  return [...new Set(urls.map(String))];
}

/** True when the profile links to what looks like its own store website. */
export function hasOwnWebsite(profile) {
  return linksOf(profile).some((u) => {
    try {
      const host = new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "");
      return !NOT_A_SITE.test(host);
    } catch { return false; }
  });
}

const CATEGORIES = {
  apparel: [
    ["Sarees", /\bsar(ee|i)s?\b/i], ["Lehengas", /lehe?n?ga/i], ["Kurtis & Kurtas", /kurt[ia]s?\b/i],
    ["Suit Sets", /\bsuits?\b|salwar|anarkali|sharara|palazzo|gharara/i], ["Co-ord Sets", /co-?ords?/i],
    ["Dresses", /\bdress(es)?\b|gowns?|maxi/i], ["Dupattas", /dupattas?|stoles?/i],
    ["Tops & Shirts", /\btops?\b|blouses?|shirts?|\btees?\b|t-shirts?/i], ["Bottoms", /jeans|trousers?|pants|skirts?/i],
  ],
  jewellery: [
    ["Earrings", /earrings?|jhumk|studs?|hoops?|chandbali|danglers?/i], ["Necklaces", /necklaces?|chokers?|pendants?|\bchains?\b|mala|\bhaar\b/i],
    ["Bangles & Bracelets", /bangles?|bracelets?|kadas?|kangan/i], ["Rings", /\brings?\b/i], ["Anklets", /anklets?|payal/i],
    ["Maang Tikka", /tikka|maang/i], ["Nose Pins", /nose ?pins?|\bnath\b/i],
  ],
  handicrafts: [
    ["Lamps & Lighting", /lamps?|lights?|lanterns?|lampshades?/i], ["Baskets & Trays", /baskets?|trays?|hampers?/i],
    ["Planters", /planters?|\bpots?\b/i], ["Wall Decor", /wall|hangings?|mirrors?|frames?|macrame|dreamcatchers?/i],
    ["Pottery", /pottery|ceramics?|terracotta|\bclay\b/i], ["Textiles", /cushions?|bedsheets?|rugs?|dhurries?|throws?|runners?|quilts?|razai/i],
    ["Bags", /\bbags?\b|totes?|clutch|potli/i], ["Candles & Diyas", /candles?|diyas?/i], ["Decor", /decor|showpiece|figurines?|idols?/i],
  ],
};
export function categoryOf(text, genre) {
  for (const [name, re] of CATEGORIES[genre] ?? []) if (re.test(text)) return name;
  return "New Arrivals";
}

/** Price (and MRP, if a higher "was" price is given) from a caption. */
export function pricesFrom(caption = "") {
  const re = /(?:₹|\brs\.?|\binr|\bprice\s*[:\-–]?\s*(?:₹|rs\.?)?|\bmrp\s*[:\-–]?\s*(?:₹|rs\.?)?|\@\s*)\s*([\d][\d,]{1,7})(?:\.\d+)?\s*(?:\/-)?/gi;
  const nums = [...caption.matchAll(re)].map((m) => Number(m[1].replace(/,/g, ""))).filter((n) => n >= 49 && n <= 300000);
  if (!nums.length) return {};
  const price = Math.min(...nums);
  const top = Math.max(...nums);
  return top > price && top <= price * 4 ? { price, mrp: top } : { price };
}

const SKIP_LINE = /^(dm|price|prices|order|orders|available|link|whatsapp|call|book|booking|shop now|rs\.?|₹|inr|mrp|size|sizes|fabric|colou?r|ship|shipping|cod|free|new arrivals?|swipe|follow|tag|comment|save|share)\b/i;
const NON_PRODUCT = /(giveaway|winner|announcement|we are closed|holiday|happy (diwali|holi|new year|dussehra|navratri|independence|republic|raksha)|customer (review|feedback)|testimonial|thank you for|behind the scenes|hiring|vacancy)/i;

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(/&-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

/** A short product name from the caption, or a fallback like "Earrings 3". */
export function nameFrom(caption, category, n) {
  const lines = String(caption ?? "").split(/\n|[.!?](?=\s)/).map(clean).filter(Boolean);
  let line = lines.find((l) => l.length >= 4 && /\p{L}{3}/u.test(l) && !SKIP_LINE.test(l) && !/\d{5,}/.test(l));
  if (!line) return `${category === "New Arrivals" ? "Piece" : category.replace(/s$/, "")} ${n}`;
  line = line.replace(/\s*[:\-–,]+\s*$/, "").replace(/^[\s:\-–,*]+/, "");
  if (line.length > 52) line = line.slice(0, 52).replace(/\s+\S*$/, "");
  if (line === line.toUpperCase() || line === line.toLowerCase()) line = titleCase(line);
  return line;
}

/** Short "about" text from the bio: drop contact lines, links and emojis. */
export function aboutFrom(bio = "") {
  const lines = String(bio).split("\n").map(clean)
    .filter((l) => l.length > 3 && !/\d{6,}|whats ?app|wa\.me|call|dm (us|for|to)|order now|link|cod available|shipping/i.test(l));
  return lines.slice(0, 3).join("\n") || null;
}

export function isNonProduct(caption = "") {
  return NON_PRODUCT.test(caption) && !pricesFrom(caption).price;
}

/** Image URLs for one post: carousel children first, then the cover. */
export function imagesOf(post) {
  const urls = [];
  if (Array.isArray(post.images)) urls.push(...post.images.filter((u) => typeof u === "string"));
  for (const c of post.childPosts ?? []) if (c?.displayUrl && c.type !== "Video") urls.push(c.displayUrl);
  if (post.displayUrl) urls.push(post.displayUrl);
  return [...new Set(urls)];
}

/** Products from the latest posts: one product per post, up to `max`. */
export function productsFrom(posts = [], genre, max = 12) {
  const out = [];
  const ordered = [...posts].sort((a, b) => Number(a.type === "Video") - Number(b.type === "Video"));
  for (const post of ordered) {
    if (out.length >= max) break;
    const caption = post.caption ?? "";
    if (isNonProduct(caption)) continue;
    const imgs = imagesOf(post).slice(0, 3);
    if (!imgs.length) continue;
    const n = out.length + 1;
    const category = categoryOf(`${caption} ${(post.hashtags ?? []).join(" ")}`, genre);
    const { price, mrp } = pricesFrom(caption);
    out.push({ n, name: nameFrom(caption, category, n), category, price, mrp, imageUrls: imgs, postUrl: post.url });
  }
  return out;
}

export function brandFrom(profile) {
  const name = clean(profile.fullName ?? "").replace(/\s*[-–|:].*$/, "").trim();
  if (name.length >= 2) return name.length > 34 ? name.slice(0, 34).replace(/\s+\S*$/, "") : name;
  return titleCase(String(profile.username).replace(/[._]+/g, " ").trim());
}
