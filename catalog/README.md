# Adding products to the store

Put your photos and one spreadsheet in this folder, run one command, and every
product appears on the store with optimised photos. Nothing on the site changes
unless the whole catalogue checks out, so a typo can never break the live store.

## 1. Add the photos

Put them in `catalog/photos/`, named with the product number:

```
catalog/
  products.csv
  photos/
    1.jpg        product 1
    1-2.jpg      product 1, second angle (optional)
    1-3.jpg      product 1, third angle (optional, up to 6)
    2.jpg        product 2
    3.png        any of .jpg .jpeg .png .webp .heic works
```

- **Portrait photos (3:4) look best.** Landscape photos get their sides cropped.
- **At least 1200 px wide** so they stay sharp on large screens.
- Straight from the phone is fine. They're resized, converted to fast-loading
  WebP, and their hidden GPS location is removed before going online.
- A second angle (`1-2.jpg`) appears when a shopper hovers over the product,
  and every angle shows in the quick-view gallery.

## 2. Fill in the spreadsheet

Copy `catalog/_template/products.csv` to `catalog/products.csv` and edit it in
Excel or Google Sheets. One row per product. Row 1 holds the column names.

| Column | Needed? | Example | Notes |
|---|---|---|---|
| `photo` | Yes | `7` | Matches `7.jpg`. It's also the product code customers quote on WhatsApp. |
| `name` | Yes | `Marigold Anarkali Set` | |
| `price` | Yes | `2199` | `2,199`, `Rs 2199` and `₹2,199/-` also work. |
| `mrp` | No | `3299` | Shown crossed out. Leave blank if there's no discount. |
| `category` | No | `Kurtas` | Builds the menu, filters and category circles. |
| `collection` | No | `The Festive Edit` | Two or more collections become the carousel. Otherwise categories are used. |
| `colour` | No | `Indigo` | |
| `fabric` | No | `Hand block-printed cotton` | |
| `care` | No | `Dry clean only` | |
| `sizes` | No | `S-XL` | Also `S, M, L`, `XS to XXL`, `Free size` or `32/34/36`. Blank means no size picker. |
| `tag` | No | `New` | A small label on the photo. Keep it short. |
| `in_stock` | No | `no` | Blank or `yes` means in stock. `no` shows "Sold out" with a restock-enquiry button. |
| `featured` | No | `yes` | The first featured product leads the home banner. |
| `description` | No | `Printed by hand…` | A sentence or two for quick view. |

Columns can be in any order, and common alternatives like "Product Name",
"Photo No.", "Color" or "MRP (Rs)" are recognised.

If you leave out the `photo` column, row order is used instead: the first
product uses `1.jpg`, the second `2.jpg`, and so on.

**Saving from Excel:** use **File > Save As > CSV UTF-8**. Plain "CSV" can garble
symbols like ₹. **Google Sheets:** File > Download > Comma-separated values.

## 3. Run it

In the project folder:

```
npm run catalog
```

You'll see what was imported, or a clear list of anything to fix, with the row
number exactly as your spreadsheet shows it. Then open
`http://localhost:3000/sample` (refresh if it's already open).

`npm run dev` also imports the catalogue automatically each time it starts.

| Command | What it does |
|---|---|
| `npm run catalog` | Import. Re-runs are fast; only new or changed photos are processed. |
| `npm run catalog -- --check` | Check everything without changing the site. |
| `npm run catalog -- --clear` | Remove the imported products and go back to the demo ones. This folder isn't touched. |

## Optional: banner photos

Add these to `catalog/photos/` for a more editorial store. Without them,
product photos are used.

| File | Where it appears |
|---|---|
| `hero.jpg` | The full-width banner at the top. Use a wide (landscape) photo. |
| `story.jpg` | Beside "Our story". |
| `look-1.jpg`, `look-2.jpg`, `look-3.jpg` | The lookbook row. All three are needed. |

## Common messages

| Message | Fix |
|---|---|
| No photo found. Expected 7.jpg | The photo is missing or named differently. Rename it to `7.jpg`. |
| Uses photo 7, which row 4 already uses | Two rows share a number. Give each product its own. |
| Price "abc" isn't a number | Type the price as digits, like `2199`. |
| No product in the CSV uses photo 9 | A spare photo. Add a row for it or remove it. |
| Only 640x800px, so it may look soft | Use a larger original if you have one. It's still imported. |
| iPhone HEIC photos can't be read | Export as JPG, or set iPhone Settings > Camera > Formats > Most Compatible. |

## Putting it online

The site ships the processed files, `public/catalog/` and
`src/data/catalog.json`. Commit those and deploy. The original photos in
`catalog/photos/` are deliberately left out of git: they're large and contain
the phone's location data.
