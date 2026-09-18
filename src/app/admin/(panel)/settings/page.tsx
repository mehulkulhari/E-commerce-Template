import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_SETTINGS } from "@/lib/store-data";
import styles from "../../admin.module.css";
import SettingsForm, { type SettingsData } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();

  const settings: SettingsData = {
    brand: data?.brand ?? DEFAULT_SETTINGS.brand,
    whatsapp_phone: data?.whatsapp_phone ?? DEFAULT_SETTINGS.whatsappPhone,
    upi_vpa: data?.upi_vpa ?? "",
    upi_name: data?.upi_name ?? "",
    instagram: data?.instagram ?? "",
    announcements: Array.isArray(data?.announcements) && data.announcements.length ? data.announcements : DEFAULT_SETTINGS.announcements,
    free_ship_over: data?.free_ship_over ?? DEFAULT_SETTINGS.freeShipOver,
    ship_fee: data?.ship_fee ?? DEFAULT_SETTINGS.shipFee,
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Settings</h1>
          <p className={styles.sub}>Your store’s name, contact and shipping.</p>
        </div>
      </div>
      <SettingsForm settings={settings} />
    </>
  );
}
