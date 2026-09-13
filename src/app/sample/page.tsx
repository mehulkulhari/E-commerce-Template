import { catalog } from "@/lib/catalog";
import Storefront from "./Storefront";

/* Products and photos come from the catalog/ folder via `npm run catalog`
   (see catalog/README.md). Until something is imported, demo products show. */
export default function SamplePage() {
  return <Storefront catalog={catalog} />;
}
