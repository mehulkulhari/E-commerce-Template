"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDiscount, saveDiscount, toggleDiscount } from "../../actions";
import { IcoTrash } from "../../icons";
import styles from "../../admin.module.css";

export type AdminDiscount = {
  id: string; code: string; kind: "percent" | "flat"; value: number;
  min_order: number; active: boolean; usage_limit: number | null; used: number; expires_at: string | null;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function DiscountsManager({ codes }: { codes: AdminDiscount[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ code: "", kind: "percent" as "percent" | "flat", value: "", min_order: "", usage_limit: "" });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function add() {
    setErr(null);
    start(async () => {
      const r = await saveDiscount({
        code: f.code, kind: f.kind, value: Number(f.value),
        min_order: Number(f.min_order) || 0,
        usage_limit: f.usage_limit ? Number(f.usage_limit) : null,
        active: true, expires_at: null,
      });
      if (r.ok) { setF({ code: "", kind: "percent", value: "", min_order: "", usage_limit: "" }); router.refresh(); }
      else setErr(r.error ?? "Couldn’t create the code.");
    });
  }

  const toggle = (id: string, active: boolean) => start(async () => { await toggleDiscount(id, active); router.refresh(); });
  const remove = (id: string, code: string) => start(async () => {
    if (!confirm(`Delete code ${code}?`)) return;
    await deleteDiscount(id); router.refresh();
  });

  return (
    <div className={styles.grid} style={{ gap: "2rem" }}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>New code</h2>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="d-code">Code</label>
            <input id="d-code" className={styles.input} value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" />
          </div>
          <div className={styles.field}>
            <label htmlFor="d-kind">Type</label>
            <select id="d-kind" className={styles.select} value={f.kind} onChange={(e) => set("kind", e.target.value as "percent" | "flat")}>
              <option value="percent">Percent off (%)</option>
              <option value="flat">Flat amount off (₹)</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="d-value">{f.kind === "percent" ? "Percent (%)" : "Amount (₹)"}</label>
            <input id="d-value" className={styles.input} inputMode="numeric" value={f.value} onChange={(e) => set("value", e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="d-min">Minimum order (₹) <span className={styles.hint}>optional</span></label>
            <input id="d-min" className={styles.input} inputMode="numeric" value={f.min_order} onChange={(e) => set("min_order", e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="d-limit">Usage limit <span className={styles.hint}>optional</span></label>
            <input id="d-limit" className={styles.input} inputMode="numeric" value={f.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} />
          </div>
        </div>
        {err && <p className={`${styles.notice} ${styles.noticeErr}`} style={{ marginTop: "1rem" }}>{err}</p>}
        <div className={styles.btnRow} style={{ marginTop: "1rem" }}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={add} disabled={pending}>
            {pending ? "Saving…" : "Create code"}
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {codes.length === 0 ? (
          <p className={styles.empty}>No discount codes yet.</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Active</th><th /></tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} style={{ opacity: pending ? 0.6 : 1 }}>
                  <td className={styles.cellName}>{c.code}</td>
                  <td>{c.kind === "percent" ? `${c.value}%` : inr(c.value)}</td>
                  <td className={styles.cellMeta}>{c.min_order ? inr(c.min_order) : "—"}</td>
                  <td className={styles.cellMeta}>{c.used}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                  <td>
                    <button type="button" className={styles.toggle} onClick={() => toggle(c.id, !c.active)} disabled={pending} aria-pressed={c.active}>
                      <span className={`${styles.toggleTrack} ${c.active ? styles.toggleOn : ""}`}><span className={styles.toggleKnob} /></span>
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`} onClick={() => remove(c.id, c.code)} disabled={pending} aria-label="Delete"><IcoTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
