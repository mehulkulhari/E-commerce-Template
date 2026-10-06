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
    .replace(/[*~]+/g, " ")
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

/* Who we pitch: anyone selling apparel, handicrafts or ARTIFICIAL jewellery
   online through Instagram (a physical shop is not required), without a site. */
const NOT_A_SELLER = /\b(restaurants?|caf[eé]s?|cuisine|dining|food|bakery|bakers|cakes?|hotels?|homestay|resort|salon|spa|makeup artist|mua\b|photograph(y|er)|wedding planner|event planner|decorators?|interior designer|architects?|real estate|academy|classes|coaching|tutor)\b/i;
const B2B_ONLY = /\b(b2b|wholesale only|wholesalers? only|resellers? only|retailers? only|job ?work|bulk only)\b/i;
// Manufacturers / wholesalers / suppliers are only a fit if they also sell retail.
const WHOLESALE = /\b(wholesal\w*|wholsale|manufactur\w*|mfg|bulk (orders?|quantity|only)|minimum order|moq|exporters?|distributors?|suppliers?|resellers? (are )?welcome|boutique supplies)\b/i;
const RETAIL = /\bretail|single piece|\bcod\b|cash on delivery|home delivery|free shipping|for ?sale\b|payment by|paytm|g ?pay|phone ?pe|dm (to|for) order|order now|shop now|online shopping|in-store|customers?\b/i;
const FINE_JEWELLERY =/\b(22 ?k(t|arat)?|22 ?ct|18 ?k(t|arat)?|hallmark(ed)?|bis\b|diamond jewell?e?ry|gold jewell?e?r(s|y)?|gold ?(\/|&|and) ?silver|silver ?(\/|&|and) ?gold|solitaires?|certified diamonds?|jadau|925|92\.5|sterling|pure silver|real silver|silver jewell?e?ry)\b/i;
const ARTIFICIAL = /\b(artificial|imitation|oxidi[sz]ed|fashion jewell?e?ry|american diamond|\bad\b|kundan|polki|anti[- ]?tarnish|gold[- ]plated|silver[- ]plated|plated|rental|for rent|costume|stainless|western jewell?e?ry|korean)\b/i;
const SELLS = /(dm (to|for) (order|price|details)|dm us|order now|orders? (open|accepted|booking)|shipping|delivery|deliver|\bcod\b|cash on delivery|price|₹|\brs\.? ?\d|whats ?app|buy|shop now|available|book (now|yours)|online|pan[- ]?india|all over india|dispatch|in stock|sale\b|\bstore\b|\bshop\b|showroom)/i;

/** Reasons this account isn't a fit (empty = fine). */
export function sellerProblems(profile, genre) {
  const bio = `${profile.fullName ?? ""} ${profile.biography ?? ""} ${profile.businessCategoryName ?? ""}`;
  const captions = (profile.latestPosts ?? []).map((p) => p.caption ?? "").join(" \n ");
  const why = [];
  if (NOT_A_SELLER.test(bio)) why.push("not a product seller (services / food / venue)");
  if (B2B_ONLY.test(bio) || (WHOLESALE.test(bio) && !RETAIL.test(bio))) why.push("B2B / wholesale only");
  if (genre === "jewellery" && FINE_JEWELLERY.test(bio) && !ARTIFICIAL.test(`${bio} ${captions}`)) why.push("fine gold/silver jeweller, not artificial jewellery");
  if (!SELLS.test(`${bio} ${captions}`)) why.push("no sign of selling (no order / price / delivery mentions)");
  return why;
}

/** City for an account: from the search term that found it, else its bio. */
export function cityFrom(cities, ...texts) {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  return cities.find((c) => new RegExp(`\\b${c.toLowerCase()}\\b`).test(hay)) ?? null;
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
    ["Rajputi Poshak", /poshak|\bbaju\b|odhn[ai]|rajputi|kanchli/i],
    ["Lehengas", /lehe?n?ga/i], ["Sarees", /\bsar(ee|i)s?\b/i], ["Kurtis & Kurtas", /kurt[ia]s?\b/i],
    ["Suit Sets", /\bsuits?\b|salwar|anarkali|sharara|palazzo|gharara/i], ["Co-ord Sets", /co-?ords?/i],
    ["Dresses", /\bdress(es)?\b|gowns?|maxi/i], ["Dupattas", /dupattas?|stoles?/i],
    ["Tops & Shirts", /\btops?\b|blouses?|shirts?|\btees?\b|t-shirts?/i], ["Bottoms", /jeans|trousers?|pants|skirts?/i],
    ["Bridal Wear", /bridal|\bbride\b|wedding wear/i],
  ],
  jewellery: [
    ["Necklaces", /necklaces?|neck ?pieces?|chokers?|pendants?|\bchains?\b|mala|\bhaar\b/i],
    ["Earrings", /earrings?|jhumk|studs?|hoops?|chandbali|danglers?/i],
    ["Bangles & Bracelets", /bangles?|bracelets?|kadas?|kangan/i], ["Rings", /\brings?\b/i], ["Anklets", /anklets?|payal/i],
    ["Maang Tikka", /tikka|maang/i], ["Nose Pins", /nose ?pins?|\bnath\b/i],
    ["Jewellery Sets", /\bsets?\b|combo/i], ["Bridal Jewellery", /bridal/i],
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

/** Price (and MRP, if a higher "was" price is given) from a caption.
    Understands "₹1,299", "Rs. 1299/-", "Price: 899" and "90 Rs" / "450/-". */
export function pricesFrom(caption = "") {
  const before = /(?:₹|\brs\.?|\binr|\bprice\s*[:\-–]?\s*(?:₹|rs\.?)?|\bmrp\s*[:\-–]?\s*(?:₹|rs\.?)?|\@\s*)\s*([\d][\d,]{1,7})(?:\.\d+)?\s*(?:\/-)?/gi;
  const after = /\b(\d[\d,]{1,6})\s*(?:\/-|rs\b\.?|₹|inr\b|rupees\b)/gi;
  const nums = [...caption.matchAll(before), ...caption.matchAll(after)]
    .map((m) => Number(m[1].replace(/,/g, ""))).filter((n) => n >= 49 && n <= 300000);
  if (!nums.length) return {};
  const price = Math.min(...nums);
  const top = Math.max(...nums);
  return top > price && top <= price * 4 ? { price, mrp: top } : { price };
}

const SKIP_LINE = /^(dm|price|prices|order|orders|available|link|whatsapp|call|book|booking|shop now|rs\.?|₹|inr|mrp|size|sizes|fabric|colou?r|ship|shipping|cod|free|new arrivals?|swipe|follow|tag|comment|save|share)\b/i;
const NON_PRODUCT = /(giveaway|winner|announcement|we are closed|holiday|happy (diwali|holi|new year|dussehra|navratri|independence|republic|raksha)|customer (review|feedback)|testimonial|thank you for|behind the scenes|hiring|vacancy)/i;
// Romanised Hindi chit-chat ("ye color pehnte hi sab puchenge") isn't a product name.
const HINGLISH = /\b(ke|ki|ka|liye|apne|apni|aap|hai|hain|sab|se|ko|mein|ye|yeh|bhi|nahi|kya|karo|kare|banwaye|wale|wali|jaata|jata|hota|sirf|har|aur|hi|pe|par)\b/gi;
const PRICE_BITS = /(₹|\brs\.?|\binr)\s*\d[\d,]*(\s*\/-)?|\b\d[\d,]*\s*(\/-|rs\b\.?|₹|inr\b|rupees\b)/gi;
const TRAILING_FILLER = /(\s+|^)(for|with|your|and|the|of|in|to|a|an|by|at|&|on)\s*$/i;

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(/&-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

const SINGULAR = {
  "Rajputi Poshak": "Rajputi Poshak", Lehengas: "Lehenga", Sarees: "Saree", "Kurtis & Kurtas": "Kurti", "Suit Sets": "Suit Set",
  "Co-ord Sets": "Co-ord Set", Dresses: "Dress", Dupattas: "Dupatta", "Tops & Shirts": "Top", Bottoms: "Bottom Wear", "Bridal Wear": "Bridal Outfit",
  Earrings: "Earrings", Necklaces: "Necklace", "Bangles & Bracelets": "Bangles", Rings: "Ring", Anklets: "Anklets", "Maang Tikka": "Maang Tikka",
  "Nose Pins": "Nose Pin", "Jewellery Sets": "Jewellery Set", "Bridal Jewellery": "Bridal Set",
  "Lamps & Lighting": "Lamp", "Baskets & Trays": "Basket", Planters: "Planter", "Wall Decor": "Wall Hanging", Pottery: "Pottery Piece",
  Textiles: "Handloom Textile", Bags: "Bag", "Candles & Diyas": "Diya Set", Decor: "Decor Piece",
};
// What to call a piece whose caption says nothing about it.
const UNNAMED = { apparel: "Look", jewellery: "Design", handicrafts: "Piece" };
const MATERIAL_WORDS = /\b(cotton|silk|georgette|chiffon|rayon|linen|velvet|organza|chanderi|banarasi|bandhej|bandhani|leheriya|gota|zari|embroider(ed|y)|block ?print(ed)?|kundan|polki|oxidi[sz]ed|pearls?|meenakari|temple|american diamond|bamboo|cane|jute|rattan|wicker|seagrass|terracotta|brass|wooden|macrame|handwoven|hand-?painted)\b/i;
const COLOUR = /\b(red|maroon|rani|pink|peach|orange|yellow|mustard|haldi|green|mint|teal|blue|navy|purple|lavender|wine|white|ivory|cream|black|grey|golden|gold|silver|beige|brown|rust|magenta|multicolou?r)\b/i;
const FILLER = [
  /\b(now )?available (now )?(at|in|on|with)\b.*$/i,
  /\b(shop|order|dm|whats ?app|book) (now|us|for|to)\b.*$/i,
  /\bnew arrivals?\b/gi, /\(?\bpart ?\d+\)?/gi, /^(introducing|presenting|meet|new)\s+/i,
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const latinShare = (s) => (s.match(/[A-Za-z]/g) ?? []).length / Math.max(1, (s.match(/\p{L}/gu) ?? []).length);
const productWord = (genre) => new RegExp([...(CATEGORIES[genre] ?? []).map(([, re]) => re.source), MATERIAL_WORDS.source].join("|"), "i");

/** { name, generic }: a product name from the caption when a line actually
    names a product (English preferred); otherwise colour + category
    ("Orange Rajputi Poshak") or a plain "Look"/"Design"/"Piece" (generic). */
export function nameInfo(caption, category, genre, brand) {
  const brandRe = brand ? new RegExp(`\\b(at |by |from )?${escapeRe(brand)}\\b`, "ig") : null;
  const segs = String(caption ?? "").split(/\n|[.!?|•](?=\s)|\s[—–-]\s|,\s/)
    .map((x) => {
      let t = clean(x).replace(PRICE_BITS, " ");
      if (brandRe) t = t.replace(brandRe, " ");
      for (const re of FILLER) t = t.replace(re, " ");
      t = t.replace(/\s+/g, " ").replace(/^[\s:\-–,*&()]+|[\s:\-–,*&(]+$/g, "");
      if (t.length > 52) t = t.slice(0, 52).replace(/\s+\S*$/, "");
      for (let i = 0; i < 3; i++) t = t.replace(TRAILING_FILLER, "").trim();
      return t;
    })
    .filter((t) => t.length >= 4 && /\p{L}{3}/u.test(t) && !SKIP_LINE.test(t) && !/\d{5,}/.test(t)
      && latinShare(t) >= 0.6 && (t.match(HINGLISH) ?? []).length < 2);
  let line = genre ? segs.find((t) => productWord(genre).test(t) && t.split(" ").length <= 9) : segs[0];
  if (!line) {
    const colour = String(caption ?? "").match(COLOUR)?.[1];
    const noun = SINGULAR[category] ?? UNNAMED[genre] ?? "Piece";
    return { name: titleCase(`${colour ? `${colour} ` : ""}${noun}`), generic: !colour || !SINGULAR[category] };
  }
  if (line === line.toUpperCase() || line === line.toLowerCase()) line = titleCase(line);
  // A one-word name ("Pearl") reads better with its category ("Pearl Earrings").
  if (line.split(" ").length === 1 && SINGULAR[category] && !line.toLowerCase().includes(SINGULAR[category].toLowerCase())) {
    line = `${line} ${SINGULAR[category]}`;
  }
  return { name: line, generic: false };
}
export const nameFrom = (caption, category, genre, brand) => nameInfo(caption, category, genre, brand).name;

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

/** Products from the latest posts: one product per post (photos before
    reels), up to `max`. Unnamed pieces are numbered ("Look 01", "Look 02");
    repeated real names become "…, Style 2". */
export function productsFrom(posts = [], genre, max = 12, brand) {
  const out = [];
  const ordered = [...posts].sort((a, b) => Number(a.type === "Video") - Number(b.type === "Video"));
  for (const post of ordered) {
    if (out.length >= max) break;
    const caption = post.caption ?? "";
    if (isNonProduct(caption)) continue;
    const imgs = imagesOf(post).slice(0, 2); // 2 photos per piece keeps storage well under the free 1 GB
    if (!imgs.length) continue;
    let category = categoryOf(`${caption} ${(post.hashtags ?? []).join(" ")}`, genre);
    const info = nameInfo(caption, category, genre, brand);
    const fromName = categoryOf(info.name, genre); // the name is the best evidence of what it is
    if (fromName !== "New Arrivals") category = fromName;
    const { price, mrp } = pricesFrom(caption);
    out.push({ n: out.length + 1, name: info.name, generic: info.generic, category, price, mrp, imageUrls: imgs, postUrl: post.url });
  }
  const total = new Map();
  for (const p of out) total.set(p.name.toLowerCase(), (total.get(p.name.toLowerCase()) ?? 0) + 1);
  const seen = new Map();
  for (const p of out) {
    const key = p.name.toLowerCase();
    const k = (seen.get(key) ?? 0) + 1;
    seen.set(key, k);
    if (p.generic && total.get(key) > 1) p.name = `${p.name} ${String(k).padStart(2, "0")}`;
    else if (k > 1) p.name = `${p.name}, Style ${k}`;
    delete p.generic;
  }
  return out;
}

const PLACE_SUFFIX = /\s+(jodhpur|jaipur|new delhi|delhi|udaipur|ajmer|bikaner|kota|ahmedabad|surat|vadodara|rajkot|chandigarh|ludhiana|amritsar|jalandhar|gurgaon|gurugram|noida|faridabad|rajasthan|india|official)\s*$/i;
const tidyBrand = (s) => {
  let name = s.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3; i++) {
    const t = name.replace(PLACE_SUFFIX, "").trim();
    if (t.length >= 3) name = t;
  }
  if (name.length > 34) name = name.slice(0, 34).replace(/\s+\S*$/, "");
  for (let i = 0; i < 3; i++) name = name.replace(TRAILING_FILLER, "").trim();
  // SHOUTING words become Title Case; short acronyms (AD, SS) stay.
  return name.split(" ").map((w) => (w.length > 2 && w === w.toUpperCase() && /\p{L}/u.test(w) ? titleCase(w) : w)).join(" ");
};

/** Shop name: the profile name without taglines, trailing city or "official";
    falls back to the handle when the name isn't in English letters. */
export function brandFrom(profile) {
  const fromName = tidyBrand(clean(profile.fullName ?? "").replace(/\s*[-–|:].*$/, ""));
  if (fromName.length >= 2 && latinShare(fromName) >= 0.6) return fromName;
  return tidyBrand(titleCase(String(profile.username).replace(/[._]+/g, " ").trim()));
}
