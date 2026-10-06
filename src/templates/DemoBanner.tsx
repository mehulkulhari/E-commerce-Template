import { AGENCY, agencyWa } from "@/lib/agency";
import type { StoreSpec } from "@/lib/store-spec";
import styles from "./demo.module.css";

/* Shown on every prospect preview. It makes plain that the page is a concept
   made for the shop, not their official store, and that nothing can be bought
   here — so it can never be mistaken for (or used as) the real thing. */
export default function DemoBanner({ spec }: { spec: StoreSpec }) {
  const who = spec.handle ? `@${spec.handle}` : spec.brand;
  const ask = agencyWa(`Hi ${AGENCY.name}! I saw the website preview you made for ${who} and I'd like to know more.`);
  return (
    <div className={styles.banner} role="note" aria-label="About this preview">
      <p>
        <strong>Free concept preview</strong> made for {who} by {AGENCY.name}.
        <span className={styles.sub}> Not the official store — nothing can be bought on this page.</span>
      </p>
      <a className={styles.cta} href={ask} target="_blank" rel="noopener noreferrer">Get this website</a>
    </div>
  );
}
