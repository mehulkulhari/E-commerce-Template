import Storefront from "@/app/sample/Storefront";
import type { StoreSpec } from "@/lib/store-spec";
import { toApparel } from "./apparel/adapter";
import Handicrafts from "./handicrafts/Handicrafts";
import Jewellery from "./jewellery/Jewellery";

/** Renders any StoreSpec with the template for its genre. */
export default function StoreView({ spec }: { spec: StoreSpec }) {
  if (spec.genre === "handicrafts") return <Handicrafts spec={spec} />;
  if (spec.genre === "jewellery") return <Jewellery spec={spec} />;
  const { catalog, settings, copy } = toApparel(spec);
  return <Storefront catalog={catalog} settings={settings} copy={copy} preview={spec.demo ? spec : undefined} />;
}
