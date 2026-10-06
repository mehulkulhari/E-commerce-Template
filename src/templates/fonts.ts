import { Bodoni_Moda, Cormorant_Garamond, Jost } from "next/font/google";

/* Display faces for the genre templates. Self-hosted by next/font, so no
   request reaches Google at runtime. Body text uses Figtree from the root layout. */

// Handicrafts: a soft, hand-set serif.
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Jewellery: a high-contrast luxury serif, with a clean geometric sans for UI.
export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

export const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});
