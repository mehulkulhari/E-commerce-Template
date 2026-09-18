import type { Metadata } from "next";

// The admin area must never be indexed by search engines.
export const metadata: Metadata = {
  title: "Admin — Impact Store",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
