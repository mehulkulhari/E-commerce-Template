# Model shots

Photos of a person wearing a product. They show as **"On model"** — on hover
in the product grid and as a toggle in the product view — for apparel and
jewellery shops.

## How to add them

1. Make a folder per shop inside `model-shots/`:
   - `impact-store/` for the live Impact Store
   - the shop's Instagram handle (e.g. `riya.boutique/`) for a prospect preview
2. Name each photo by the **product number**:
   - Impact Store: the product code (the number on the product, e.g. `12.jpg`)
   - Previews: the product's position on the preview (1st product = `1.jpg`)
   - More than one photo of the same product: `12-2.jpg`, `12-3.jpg`
3. Run:

   ```
   npm run model-shots
   ```

   or for one shop only: `npm run model-shots -- riya.boutique`

Photos are resized, converted to WebP, uploaded, and attached to the right
product. Running it again skips photos that were already added. JPG, PNG,
WebP and HEIC all work; portrait photos look best.

Photos in this folder are **not** committed to Git (they can be large and
may show real people), so keep your originals somewhere safe.
