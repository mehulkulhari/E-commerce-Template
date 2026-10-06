/* DM to Store — your own contact details, used by the landing page and by the
   "Want this website?" call-to-action on every prospect preview.
   Set NEXT_PUBLIC_AGENCY_WHATSAPP (digits with country code, e.g. 9198xxxxxxxx)
   in .env.local and in Vercel. */
export const AGENCY = {
  name: "DM to Store",
  whatsapp: process.env.NEXT_PUBLIC_AGENCY_WHATSAPP || "910000000000",
  instagram: process.env.NEXT_PUBLIC_AGENCY_INSTAGRAM || "",
};

export const agencyWa = (msg: string) => `https://wa.me/${AGENCY.whatsapp}?text=${encodeURIComponent(msg)}`;
