import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — DM to Store",
  description: "Terms and conditions for DM to Store web design services.",
};

export default function Terms() {
  return (
    <article>
      <h1>Terms of Service</h1>
      <p className={styles.meta}>
        Effective date: <strong>11 September 2026</strong> · Last updated: 11 September 2026
      </p>

      <div className={styles.flag}>
        <strong>⚠ Placeholder — Action required before going live</strong>
        Replace every <code>[PLACEHOLDER]</code> with real information before publishing.
        Have a qualified legal professional review these terms, especially around payment disputes,
        intellectual property ownership, and applicable law.
      </div>

      <h2>1. About these terms</h2>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the DM to Store website
        and the web design services provided by{" "}
        <strong>[YOUR FULL LEGAL NAME / BUSINESS NAME]</strong>{" "}
        (&ldquo;DM to Store,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), operating from Jodhpur,
        Rajasthan, India.
      </p>
      <p>
        By using this website or engaging our services, you agree to these Terms. If you do not
        agree, please do not use our services.
      </p>

      <h2>2. Services</h2>
      <p>DM to Store provides freelance website design services for small businesses, including:</p>
      <ul>
        <li><strong>Starter</strong> — one-page mobile website (up to 12 products)</li>
        <li><strong>Boutique</strong> — multi-page website with domain and SEO</li>
        <li><strong>Store</strong> — full online shop with payment integration (quoted individually)</li>
        <li><strong>Care Plan</strong> — ongoing maintenance subscription (month-to-month)</li>
      </ul>
      <p>
        The exact scope, deliverables, and price for each project are confirmed over WhatsApp before
        work begins. Nothing on this website constitutes a binding offer until we confirm it to you
        in writing (including WhatsApp).
      </p>

      <h2>3. Payment</h2>
      <ul>
        <li>
          A <strong>50% advance payment</strong> is required before project work begins. The
          remaining 50% is due before the final website is handed over or goes live.
        </li>
        <li>
          Payments are made via <strong>[UPI / bank transfer / your accepted methods]</strong>.
        </li>
        <li>
          Prices listed on this website are in <strong>Indian Rupees (₹)</strong> and exclude
          GST where applicable.
        </li>
        <li>
          Domain registration and hosting costs are billed separately at cost, unless bundled into
          a Care Plan.
        </li>
        <li>
          <strong>GST (Goods and Services Tax)</strong> will be added where legally applicable.
          [ADD: Your GST registration number if registered, or state: "DM to Store is not
          currently registered for GST as annual turnover is below the threshold."]
        </li>
      </ul>

      <h2>4. Project timeline</h2>
      <p>
        Estimated timelines (Starter: ~2 days; Boutique: 3–4 days) are good-faith estimates, not
        guarantees. Timelines may be affected by delays in receiving content (photos, text, product
        details) from the client. We will communicate any changes promptly.
      </p>

      <h2>5. Client responsibilities</h2>
      <p>To allow us to complete your project, you agree to:</p>
      <ul>
        <li>
          Provide accurate product photos, descriptions, prices, and other content you own or have
          rights to use.
        </li>
        <li>Respond to messages within a reasonable time (typically 24–48 hours).</li>
        <li>
          Ensure all images and text you supply do not infringe third-party copyright, trademark,
          or other intellectual property rights.
        </li>
      </ul>
      <p>
        We are not responsible for any claims arising from content supplied by you.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        Upon receipt of full payment, you own the finished website we build for you — including
        its code, design, and content (to the extent you supplied it). We retain ownership of any
        proprietary tools, templates, or code frameworks we develop independently.
      </p>
      <p>
        We may include a small &ldquo;Built with DM to Store&rdquo; attribution in the footer of
        your site unless you request its removal (removal is available on Boutique and Store packages).
      </p>

      <h2>7. Care Plan</h2>
      <ul>
        <li>The Care Plan is a month-to-month subscription at <strong>₹799/month</strong>.</li>
        <li>It includes hosting, backups, and up to 5 product/photo updates per month.</li>
        <li>You may cancel at any time with reasonable notice (we recommend at least 7 days).</li>
        <li>No partial refunds are issued for the current billing month.</li>
      </ul>

      <h2>8. Acceptable use</h2>
      <p>You agree not to use a website we build for you to:</p>
      <ul>
        <li>Sell illegal goods or services.</li>
        <li>Publish false, defamatory, or misleading information.</li>
        <li>Infringe intellectual property rights.</li>
        <li>Violate any applicable Indian or local law.</li>
      </ul>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, DM to Store is not liable for indirect, incidental,
        or consequential damages arising from use of your website or our services, including loss
        of sales, data loss, or third-party platform outages (hosting, WhatsApp, Instagram).
      </p>
      <p>
        Our total liability in connection with any project shall not exceed the total fees paid by
        you for that project.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes shall be subject to the
        exclusive jurisdiction of courts in <strong>Jodhpur, Rajasthan</strong>.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. The current version will always be at
        this URL. Continued use of our services after changes constitutes acceptance of the
        updated Terms.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions? Reach us at <strong>[YOUR EMAIL ADDRESS]</strong> or on WhatsApp.
      </p>
    </article>
  );
}
