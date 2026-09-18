"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettings } from "../../actions";
import styles from "../../admin.module.css";

export type SettingsData = {
  brand: string; whatsapp_phone: string; upi_vpa: string; upi_name: string;
  instagram: string; announcements: string[]; free_ship_over: number; ship_fee: number;
};

export default function SettingsForm({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [f, setF] = useState({
    brand: settings.brand,
    whatsapp_phone: settings.whatsapp_phone,
    upi_vpa: settings.upi_vpa,
    upi_name: settings.upi_name,
    instagram: settings.instagram,
    announcements: settings.announcements.join("\n"),
    free_ship_over: settings.free_ship_over.toString(),
    ship_fee: settings.ship_fee.toString(),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit() {
    setMsg(null);
    start(async () => {
      const r = await saveSettings({
        brand: f.brand,
        whatsapp_phone: f.whatsapp_phone,
        upi_vpa: f.upi_vpa || null,
        upi_name: f.upi_name || null,
        instagram: f.instagram || null,
        announcements: f.announcements.split("\n").map((a) => a.trim()).filter(Boolean),
        free_ship_over: Number(f.free_ship_over) || 0,
        ship_fee: Number(f.ship_fee) || 0,
      });
      setMsg(r.ok ? { ok: true, text: "Saved. Your store updates within a minute." } : { ok: false, text: r.error ?? "Couldn’t save." });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="s-brand">Store name</label>
        <input id="s-brand" className={styles.input} value={f.brand} onChange={(e) => set("brand", e.target.value)} />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="s-wa">WhatsApp number <span className={styles.hint}>with country code, e.g. 9198…</span></label>
          <input id="s-wa" className={styles.input} inputMode="numeric" value={f.whatsapp_phone} onChange={(e) => set("whatsapp_phone", e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="s-ig">Instagram link <span className={styles.hint}>optional</span></label>
          <input id="s-ig" className={styles.input} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="s-upi">UPI ID <span className={styles.hint}>optional, enables Pay-by-UPI</span></label>
          <input id="s-upi" className={styles.input} value={f.upi_vpa} onChange={(e) => set("upi_vpa", e.target.value)} placeholder="name@bank" />
        </div>
        <div className={styles.field}>
          <label htmlFor="s-upiname">UPI display name <span className={styles.hint}>optional</span></label>
          <input id="s-upiname" className={styles.input} value={f.upi_name} onChange={(e) => set("upi_name", e.target.value)} />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="s-free">Free shipping over (₹)</label>
          <input id="s-free" className={styles.input} inputMode="numeric" value={f.free_ship_over} onChange={(e) => set("free_ship_over", e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="s-fee">Shipping fee (₹)</label>
          <input id="s-fee" className={styles.input} inputMode="numeric" value={f.ship_fee} onChange={(e) => set("ship_fee", e.target.value)} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="s-ann">Announcement bar <span className={styles.hint}>one line per message, scrolls across the top</span></label>
        <textarea id="s-ann" className={styles.textarea} rows={4} value={f.announcements} onChange={(e) => set("announcements", e.target.value)} />
      </div>

      {msg && <p className={`${styles.notice} ${msg.ok ? styles.noticeOk : styles.noticeErr}`}>{msg.text}</p>}

      <div className={styles.btnRow}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
