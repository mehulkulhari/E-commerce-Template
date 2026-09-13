import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — DM to Store",
  description: "How DM to Store handles your information.",
};

export default function PrivacyPolicy() {
  return (
    <article>
      <h1>Privacy Policy</h1>
      <p className={styles.meta}>
        Effective date: <strong>11 September 2026</strong> · Last updated: 11 September 2026
      </p>

      <div className={styles.flag}>
        <strong>⚠ Placeholder — Action required before going live</strong>
        Replace every <code>[PLACEHOLDER]</code> with real information before publishing this page.
        This policy was drafted based on the current website code. Have a qualified legal professional
        review it before launch if you handle sensitive data or serve regulated markets.
      </div>

      <h2>1. Who we are</h2>
      <p>
        <strong>DM to Store</strong> is a freelance web design service run by{" "}
        <strong>[YOUR FULL LEGAL NAME / BUSINESS NAME]</strong>, based in Jodhpur, Rajasthan, India.
      </p>
      <p>
        Contact:{" "}
        <strong>[YOUR EMAIL ADDRESS]</strong> ·{" "}
        <strong>[YOUR WHATSAPP / PHONE NUMBER]</strong>
      </p>

      <h2>2. What this policy covers</h2>
      <p>
        This policy explains what information we collect when you visit{" "}
        <strong>dmtostore.in</strong> (or wherever this site is hosted), how we use it, and your
        rights. It applies to visitors and potential clients of DM to Store.
      </p>

      <h2>3. Information we collect</h2>

      <h2>3a. Information you give us directly</h2>
      <p>
        This website does <strong>not</strong> have a contact form, account registration, or payment
        form. All enquiries are handled through WhatsApp. When you tap a &ldquo;Message on
        WhatsApp&rdquo; button, WhatsApp (owned by Meta Platforms, Inc.) opens on your device with a
        pre-filled message. We receive that message through WhatsApp — not through this website.
        Any information you share in that WhatsApp conversation (name, Instagram handle, business
        details) is handled according to{" "}
        <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
          WhatsApp&apos;s Privacy Policy
        </a>.
      </p>

      <h2>3b. Information collected automatically</h2>
      <p>
        <strong>Google Fonts.</strong> This site loads typefaces from Google Fonts
        (<code>fonts.googleapis.com</code>). When your browser requests a font file, Google receives
        your IP address and browser information. We do not control or access this data. See{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google&apos;s Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href="https://developers.google.com/fonts/faq/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Fonts Privacy FAQ
        </a>.
      </p>
      <p>
        <strong>Web hosting / server logs.</strong> Our hosting provider may record standard server
        log data (IP address, browser type, pages visited, timestamps) for security and reliability
        purposes. We do not use this data for marketing.
      </p>
      <p>
        <strong>Analytics.</strong> This site currently uses <strong>no third-party analytics</strong>{" "}
        (no Google Analytics, Meta Pixel, or similar tracking).
      </p>
      <p>
        <strong>Cookies.</strong> This site sets <strong>no cookies</strong> of its own. Google Fonts
        uses a cookie-less delivery method. No cookie consent banner is therefore required for the
        current configuration.
      </p>

      <h2>4. How we use information</h2>
      <p>We use the information you share over WhatsApp only to:</p>
      <ul>
        <li>Respond to your enquiry about our web design services.</li>
        <li>Prepare and send you a preview or quote.</li>
        <li>Deliver the agreed web design project.</li>
        <li>Send project-related updates or invoices.</li>
      </ul>
      <p>We do not sell, rent, or share your information with third parties for marketing purposes.</p>

      <h2>5. Legal basis for processing (India DPDP Act 2023)</h2>
      <p>
        Under the Digital Personal Data Protection Act, 2023 (India), we process your personal data
        on the basis of <strong>consent</strong> (when you initiate contact with us) and{" "}
        <strong>legitimate interest / contractual necessity</strong> (when fulfilling a project you
        have commissioned).
      </p>

      <h2>6. Data retention</h2>
      <p>
        Conversation records and project files are retained for{" "}
        <strong>[SPECIFY RETENTION PERIOD — e.g., 3 years]</strong> after project completion, or
        until you request deletion, whichever is earlier. Server logs are deleted after{" "}
        <strong>[CHECK WITH YOUR HOSTING PROVIDER]</strong>.
      </p>

      <h2>7. Your rights</h2>
      <p>Under Indian law (DPDP Act 2023) and general good practice, you have the right to:</p>
      <ul>
        <li>Know what personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Request deletion of your data (subject to legal or contractual obligations).</li>
        <li>Withdraw consent at any time (this will not affect services already delivered).</li>
        <li>Nominate a representative to exercise these rights on your behalf.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <strong>[YOUR EMAIL ADDRESS]</strong>.
      </p>

      <h2>8. Children</h2>
      <p>
        Our services are intended for business owners and adults. We do not knowingly collect
        personal data from anyone under 18 years of age.
      </p>

      <h2>9. Security</h2>
      <p>
        We take reasonable steps to protect the information you share with us. However, no method of
        electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>10. Third-party links</h2>
      <p>
        This site links to WhatsApp and Instagram. We are not responsible for the privacy practices
        of those platforms. Please review their privacy policies before using them.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        If we make material changes, we will update the &ldquo;Last updated&rdquo; date above. We
        encourage you to review this page periodically.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about this policy? Reach us at{" "}
        <strong>[YOUR EMAIL ADDRESS]</strong> or message us on WhatsApp.
      </p>
    </article>
  );
}
