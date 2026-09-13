"use client";

import { useEffect } from "react";
import styles from "./page.module.css";

// ── EDIT: your WhatsApp number, country code first, digits only ──
const PHONE = "910000000000";
// ── EDIT: your live sample store URL ──
const SAMPLE_URL = "/sample";

function waLink(msg: string) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
}

function FeatureIcon({ name }: { name: string }) {
  const c = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "link":
      return <svg {...c}><path d="M9.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" /><path d="M14.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" /></svg>;
    case "chat":
      return <svg {...c}><path d="M21 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-5.2A8 8 0 1 1 21 12z" /></svg>;
    case "sparkle":
      return <svg {...c}><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" /></svg>;
    case "phone":
      return <svg {...c}><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></svg>;
    case "search":
      return <svg {...c}><circle cx="11" cy="11" r="6" /><path d="M20 20l-3.6-3.6" /></svg>;
    case "lock":
      return <svg {...c}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    default:
      return null;
  }
}

function Check() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-label="Yes"><path d="M4 12.5l5 5 11-11" /></svg>;
}
function Cross() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-label="No"><path d="M6 6l12 12M18 6L6 18" /></svg>;
}

export default function Home() {
  useEffect(() => {
    const yr = document.getElementById("yr");
    if (yr) yr.textContent = String(new Date().getFullYear());
  }, []);

  return (
    <>
      {/* ── Header ── */}
      <header className={styles.siteHeader}>
        <div className={styles.wrap}>
          <nav className={styles.nav}>
            <a className={styles.brand} href="#top">
              <span className={styles.brandDot}>→</span>DM <b>to</b> Store
            </a>
            <a
              className={`${styles.btn} ${styles.btnWa}`}
              href={waLink("Hi! I saw your page and I'd like a website for my Instagram business.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message on WhatsApp
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <div className={styles.heroGrid}>
              <div>
                <span className={styles.eyebrow}>Websites for Instagram sellers · Jodhpur</span>
                <h1 className={styles.heroH1}>
                  Turn your Instagram DMs into a{" "}
                  <span className={styles.hl}>store that sells for you.</span>
                </h1>
                <p className={styles.lede}>
                  Stop typing &ldquo;price, DM&rdquo; fifty times a day. Give your customers one link to see
                  everything and order on WhatsApp in two taps, while you focus on your products.
                </p>
                <div className={styles.heroCta}>
                  <a
                    className={`${styles.btn} ${styles.btnWa}`}
                    href={waLink("Hi! I'd like a free preview of a website for my Instagram business.")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get a free preview
                  </a>
                  <a className={`${styles.btn} ${styles.btnGhost}`} href="#pricing">
                    See pricing
                  </a>
                </div>
                <p className={styles.micro}>
                  <span><b>Ready in 2–4 days</b></span>
                  <span className={styles.dot} aria-hidden="true">·</span>
                  <span><b>Works on every phone</b></span>
                  <span className={styles.dot} aria-hidden="true">·</span>
                  <span><b>You own it forever</b></span>
                </p>
              </div>

              {/* Transformation visual */}
              <div className={styles.transform} aria-label="From messy DMs to a clean store">
                <div className={`${styles.phone} ${styles.chaos}`} aria-hidden="true">
                  <div className={styles.phoneTop}>
                    <span className={styles.av} />
                    <small>your.page</small>
                  </div>
                  <div className={`${styles.bub} ${styles.bubIn}`}>Price?</div>
                  <div className={`${styles.bub} ${styles.bubIn}`}>Is this available??</div>
                  <div className={`${styles.bub} ${styles.bubIn}`}>DM me rate</div>
                  <div className={`${styles.bub} ${styles.bubMe}`}>1899, DM for order</div>
                  <div className={`${styles.bub} ${styles.bubIn}`}>COD? size M?</div>
                  <small className={styles.chaosNote}>50+ of these a day. Half never buy.</small>
                </div>
                <div className={styles.arrow}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></svg>
                  <span>becomes</span>
                </div>
                <div className={`${styles.phone} ${styles.store}`} aria-hidden="true">
                  <div className={styles.phoneTop}>
                    <span className={`${styles.av} ${styles.avAccent}`} />
                    <small>yourstore.com</small>
                  </div>
                  <div className={styles.shot}>
                    <b>Marigold Anarkali</b>
                  </div>
                  <h4 className={styles.storeH4}>Marigold Anarkali Set</h4>
                  <div className={styles.storePr}>₹1,899</div>
                  <div className={styles.storeMini}>Order on WhatsApp →</div>
                  <small className={styles.storeWin}>Ordered in 2 taps. No back-and-forth.</small>
                </div>
              </div>
            </div>

            <div className={styles.niches}>
              <div className={styles.wrap}>
                <span>Boutiques</span>
                <span>Home bakers</span>
                <span>Jewellery</span>
                <span>Handmade &amp; decor</span>
                <span>Accessories</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>Sound familiar?</span>
              <h2 className={styles.secH2}>Selling in DMs is quietly costing you sales.</h2>
              <p className={styles.secP}>
                Instagram is great for getting seen. It&apos;s terrible for actually selling. Here&apos;s
                where the money leaks out.
              </p>
            </div>
            <div className={`${styles.cols} ${styles.colsFour}`}>
              {[
                { n: "01", title: "Slow replies lose buyers", body: 'Someone asks "price?" at 11pm. You reply next morning. They\'ve already bought elsewhere.' },
                { n: "02", title: "Your best pieces vanish", body: "Products get buried under old stories and posts. New visitors can't find what you sell." },
                { n: "03", title: "New buyers don't trust a DM", body: "Paying an unknown page feels risky. A real website signals you're a real, safe business." },
                { n: "04", title: "You are the website", body: 'Answering the same "size? COD? price?" all day is a full-time job that doesn\'t scale.' },
              ].map((p) => (
                <div className={styles.pain} key={p.n}>
                  <div className={styles.painN}>{p.n}</div>
                  <b>{p.title}</b>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What you get ── */}
        <section className={`${styles.section} ${styles.sectionPt0}`}>
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>What you get</span>
              <h2 className={styles.secH2}>One link that does the selling for you.</h2>
            </div>
            <div className={styles.cols}>
              {[
                { icon: "link", title: "Your whole catalogue, one link", body: "Put it in your Instagram bio. Customers browse everything, any time, even while you sleep." },
                { icon: "chat", title: "Order on WhatsApp in 2 taps", body: "No confusing checkout. They tap a product, WhatsApp opens with the order ready to send." },
                { icon: "sparkle", title: "Looks professional, builds trust", body: "A clean site makes buyers comfortable paying more, and ordering bigger." },
                { icon: "phone", title: "Built mobile-first", body: "90% of your buyers are on phones. Your site is designed for their thumb first." },
                { icon: "search", title: "Show up on Google", body: 'People searching "boutique in Jodhpur" can find you, not just your Instagram followers.' },
                { icon: "lock", title: "You own everything", body: "Your domain, your customers, your store. One Instagram ban can't wipe out your business." },
              ].map((f) => (
                <div className={styles.feat} key={f.title}>
                  <div className={styles.featIc}><FeatureIcon name={f.icon} /></div>
                  <div>
                    <b>{f.title}</b>
                    <p>{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: "1.6rem" }}>
              <a className={`${styles.btn} ${styles.btnGhost}`} href={SAMPLE_URL} target="_blank" rel="noopener noreferrer">
                See a live sample store →
              </a>
            </p>
          </div>
        </section>

        {/* ── Comparison ── */}
        <section className={`${styles.section} ${styles.sectionPt0}`}>
          <div className={styles.wrap}>
            <div className={`${styles.secHead} ${styles.secHeadCenter}`}>
              <span className={styles.eyebrow}>Why not just Instagram or Linktree?</span>
              <h2 className={styles.secH2}>See the difference.</h2>
            </div>
            <div className={styles.cmpWrap}>
              <table className={styles.cmp}>
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Instagram only</th>
                    <th scope="col">Linktree</th>
                    <th scope="col" className={styles.cmpYou}>Your DM to Store site</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["One link to your full catalogue", "no", "Links only"],
                    ["Order without endless DMs", "no", "no"],
                    ["Looks like a real, trusted brand", "So-so", "no"],
                    ["Found on Google", "no", "no"],
                    ["You own your customers", "no", "no"],
                    ["Survives if your account gets banned", "no", "no"],
                  ].map(([label, ig, lt]) => (
                    <tr key={String(label)}>
                      <th scope="row">{label}</th>
                      <td className={ig === "no" ? styles.na : undefined}>{ig === "no" ? <Cross /> : ig}</td>
                      <td className={lt === "no" ? styles.na : undefined}>{lt === "no" ? <Cross /> : lt}</td>
                      <td className={styles.cmpYouCell}><span className={styles.yes}><Check /></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className={`${styles.section} ${styles.sectionBg}`}>
          <div className={styles.wrap}>
            <div className={`${styles.secHead} ${styles.secHeadCenter}`}>
              <span className={styles.eyebrow}>Simple, honest pricing</span>
              <h2 className={styles.secH2}>Pick a package. No hidden charges.</h2>
              <p className={styles.secP}>
                One-time build fees below. Made for Indian small businesses — priced to pay for itself in a
                few orders.
              </p>
            </div>
            <div className={styles.plans}>
              <div className={styles.plan}>
                <div className={styles.planName}>Starter</div>
                <p className={styles.planTag}>Perfect to get off the ground</p>
                <div className={styles.planCost}>₹2,999 <small>one-time</small></div>
                <ul className={styles.planList}>
                  {["1-page mobile website","Replaces your link-in-bio","Up to 12 products","Order-on-WhatsApp buttons","Instagram, call & location links","Ready in ~2 days"].map(i=><li key={i}>{i}</li>)}
                </ul>
                <a className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`} href={waLink("Hi! I'm interested in the Starter package (₹2,999) for my Instagram business.")} target="_blank" rel="noopener noreferrer">Choose Starter</a>
              </div>
              <div className={`${styles.plan} ${styles.planPop}`}>
                <div className={styles.planName}>Boutique</div>
                <p className={styles.planTag}>Our most-loved package</p>
                <div className={styles.planCost}>₹8,999 <small>one-time</small></div>
                <ul className={styles.planList}>
                  {["Everything in Starter, plus:","Up to 40 products with categories","Lookbook / gallery & reviews","About page that builds trust","Your own domain (yourname.com)","Shows up on Google (basic SEO)","Ready in 3–4 days"].map(i=><li key={i}>{i}</li>)}
                </ul>
                <a className={`${styles.btn} ${styles.btnAccent} ${styles.btnFull}`} href={waLink("Hi! I'm interested in the Boutique package (₹8,999) for my Instagram business.")} target="_blank" rel="noopener noreferrer">Choose Boutique</a>
              </div>
              <div className={styles.plan}>
                <div className={styles.planName}>Store</div>
                <p className={styles.planTag}>Full online shop with payments</p>
                <div className={styles.planCost}>₹24,999 <small>onwards</small></div>
                <ul className={styles.planList}>
                  {["Everything in Boutique, plus:","Online payments — UPI & cards","Real cart & checkout","Unlimited products","Order & stock management","Timeline shared on quote"].map(i=><li key={i}>{i}</li>)}
                </ul>
                <a className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`} href={waLink("Hi! I'd like a quote for the Store package (online payments) for my business.")} target="_blank" rel="noopener noreferrer">Get a quote</a>
              </div>
            </div>
            <div className={styles.care}>
              <div>
                <b>Care Plan — keep it running</b>
                <p>Hosting, backups, up to 5 product/photo updates a month, festive banners, and "WhatsApp me if anything breaks." Optional, cancel anytime.</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={styles.careAmt}>₹799</span>
                <small style={{ color: "var(--muted)" }}> /month</small>
              </div>
            </div>
            <p className={styles.finep}>+ Domain ₹800–1,200/year and hosting billed at cost (or bundled into the Care Plan). 50% advance to begin. GST extra where applicable.</p>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className={styles.section}>
          <div className={styles.wrap}>
            <div className={`${styles.secHead} ${styles.secHeadCenter}`}>
              <span className={styles.eyebrow}>How it works</span>
              <h2 className={styles.secH2}>Live in three easy steps.</h2>
            </div>
            <div className={styles.steps}>
              {[
                { n: "1", title: "Message me on WhatsApp", body: "Send your Instagram handle and tell me what you sell. Takes two minutes." },
                { n: "2", title: "Get a free preview + quote", body: "I send a short video showing what your store could look like, and a fixed price. No obligation." },
                { n: "3", title: "Go live in 2–4 days", body: "You approve, I build, and your link is ready to drop into your bio. That simple." },
              ].map((s) => (
                <div className={styles.step} key={s.n}>
                  <div className={styles.stepN}>{s.n}</div>
                  <b>{s.title}</b>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={`${styles.section} ${styles.sectionPt0}`}>
          <div className={`${styles.wrap} ${styles.wrapNarrow}`}>
            <div className={`${styles.secHead} ${styles.secHeadCenter}`}>
              <span className={styles.eyebrow}>Questions</span>
              <h2 className={styles.secH2}>Good to know.</h2>
            </div>
            <div className={styles.faq}>
              {[
                { q: "I already have Instagram. Why do I need this?", a: "Instagram gets you seen; it doesn't help people buy. A site gives customers one place to browse everything and order instantly — so you stop losing buyers who won't wait for a DM reply." },
                { q: "Will my customers have to learn something new?", a: "No. They still order on WhatsApp — the app they already use. The site just makes it faster and clearer, so more of them actually complete the order." },
                { q: "How long does it take?", a: "Starter is usually ready in about 2 days, Boutique in 3–4. I'll give you an exact date before we start." },
                { q: "Do I need to know anything technical?", a: "Not at all. You send me your product photos and prices over WhatsApp; I handle the domain, hosting, and every technical part." },
                { q: "What if I want changes later?", a: "Small tweaks are covered by the Care Plan (₹799/month). Bigger changes are quoted upfront so there are never surprise bills." },
                { q: "How do payments work?", a: "On Starter and Boutique, customers order via WhatsApp and pay you how you already accept (UPI, COD, etc.). The Store package adds automatic online payments — UPI and cards — on the site itself." },
              ].map((item) => (
                <details className={styles.faqDetails} key={item.q}>
                  <summary className={styles.faqSummary}>{item.q}</summary>
                  <p className={styles.faqBody}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className={`${styles.section} ${styles.sectionPt0}`}>
          <div className={styles.wrap}>
            <div className={styles.final}>
              <h2>See your store before you pay a rupee.</h2>
              <p>
                Message "Hi" on WhatsApp with your Instagram handle. I&apos;ll send back a free 60-second
                preview of what your store could look like — no charge, no obligation.
              </p>
              <a
                className={`${styles.btn} ${styles.btnWaFinal}`}
                href={waLink("Hi! Here's my Instagram handle: ____. Can you send me a free preview of my store?")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message on WhatsApp for a free preview
              </a>
              <small>Based in Jodhpur · Working with sellers across India</small>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.siteFooter}>
        <div className={styles.wrap}>
          <div className={styles.footInner}>
            <div className={styles.brand}>
              <span className={styles.brandDot}>→</span>DM <b>to</b> Store
            </div>
            <div className={styles.footLinks}>
              <a href={waLink("Hi! I'd like to know more about a website for my business.")} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              {/* ACTION REQUIRED: replace # with your real Instagram URL and mailto: link */}
              <a href="#" aria-label="Instagram (link coming soon)">Instagram</a>
              <a href="#" aria-label="Email (link coming soon)">Email</a>
            </div>
            <div>© <span id="yr"></span> DM to Store · Jodhpur, Rajasthan</div>
          </div>
          <div className={styles.footLegal}>
            <a href="/legal/privacy-policy">Privacy Policy</a>
            <a href="/legal/terms">Terms of Service</a>
            <a href="/legal/refund">Refund Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}
