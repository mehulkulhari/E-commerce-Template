import { getCatalog, getSettings } from "@/lib/store-data";
import Storefront from "./Storefront";

/* Products and settings come from the Supabase database (managed in /admin).
   Re-fetched at most once a minute so owner edits appear without a rebuild.
   Falls back to the built-in catalogue if the database isn't configured. */
export const revalidate = 60;

export default async function SamplePage() {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  return <Storefront catalog={catalog} settings={settings} />;
}
