import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — DM to Store",
  description: "Refund and cancellation terms for DM to Store web design services.",
};

export default function RefundPolicy() {
  return (
    <article>
      <h1>Refund &amp; Cancellation Policy</h1>
      <p className={styles.meta}>
        Effective date: <strong>11 September 2026</strong> · Last updated: 11 September 2026
      </p>

      <div className={styles.flag}>
        <strong>⚠ Action required — review before publishing</strong>
        The terms below reflect common practices for freelance web design. Review and adjust them
        to match what you actually intend to offer. Have a lawyer review if you are unsure.
      </div>

      <h2>1. Overview</h2>
      <p>
        DM to Store provides custom web design services. Because each project involves time and
        effort invested from the start, our refund policy reflects that reality while being fair
        to clients.
      </p>

      <h2>2. Project cancellations</h2>

      <h2>2a. Cancelled before work begins</h2>
      <p>
        If you cancel your project <strong>before we have started design work</strong> (typically
        within 24 hours of paying the advance), we will refund the full advance payment, minus
        any transaction fees charged by the payment platform.
      </p>

      <h2>2b. Cancelled after work has begun</h2>
      <p>
        If you cancel after work has started:
      </p>
      <ul>
        <li>
          The <strong>50% advance is non-refundable</strong> — it covers time already spent on
          research, design, and setup.
        </li>
        <li>
          If the project is more than 50% complete (based on our assessment), an additional
          partial payment may be due for work completed.
        </li>
        <li>
          We will share all work completed to that point with you.
        </li>
      </ul>

      <h2>2c. Cancelled by DM to Store</h2>
      <p>
        In the rare case that we are unable to complete your project, we will refund 100% of
        any amounts paid, including the advance.
      </p>

      <h2>3. Revisions and satisfaction</h2>
      <p>
        Each package includes a reasonable number of revision rounds (discussed and agreed at the
        start). We work with you until you are happy with the result.
      </p>
      <p>
        If you are not satisfied with the delivered website, please contact us first — we will
        make every reasonable effort to address your concerns before considering a refund request.
      </p>
      <p>
        Refunds are <strong>not</strong> available simply because you changed your mind about
        needing a website after the work was completed and delivered.
      </p>

      <h2>4. Care Plan cancellations</h2>
      <p>
        The Care Plan (₹799/month) is month-to-month. You may cancel at any time by messaging us
        on WhatsApp. Cancellation takes effect at the end of the current billing month. No partial
        refunds are issued for unused days within a paid month.
      </p>

      <h2>5. Domain and hosting fees</h2>
      <p>
        Domain registration fees are <strong>non-refundable</strong> once the domain has been
        registered, as these are paid directly to the domain registrar.
      </p>
      <p>
        Prepaid hosting fees may be partially refundable on a pro-rata basis depending on the
        hosting provider&apos;s policy.
      </p>

      <h2>6. How to request a refund</h2>
      <p>
        To request a refund or cancellation, message us on WhatsApp or email{" "}
        <strong>[YOUR EMAIL ADDRESS]</strong> with:
      </p>
      <ul>
        <li>Your name and the project we worked on.</li>
        <li>The reason for cancellation or refund request.</li>
        <li>Payment details (UPI transaction ID or bank reference).</li>
      </ul>
      <p>
        We aim to respond within <strong>2 business days</strong>. Approved refunds are
        processed within <strong>5–7 business days</strong> via the original payment method.
      </p>

      <h2>7. Disputes</h2>
      <p>
        We prefer to resolve any issues directly and amicably. If you feel a refund request has
        been unfairly denied, you may escalate to consumer forums available under the{" "}
        <strong>Consumer Protection Act, 2019</strong> (India), including the National Consumer
        Disputes Redressal Commission (NCDRC) or{" "}
        <a
          href="https://consumerhelpline.gov.in"
          target="_blank"
          rel="noopener noreferrer"
        >
          consumerhelpline.gov.in
        </a>.
      </p>

      <h2>8. Contact</h2>
      <p>
        <strong>[YOUR EMAIL ADDRESS]</strong> · WhatsApp:{" "}
        <strong>[YOUR WHATSAPP NUMBER]</strong>
      </p>
    </article>
  );
}
