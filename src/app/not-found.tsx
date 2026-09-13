import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — DM to Store",
};

export default function NotFound() {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, background: "#FBF5F2", color: "#2A1B24", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", lineHeight: 1, marginBottom: "1rem" }}>404</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0 0 .6rem" }}>Page not found</h1>
          <p style={{ color: "#7C6873", maxWidth: "36ch", margin: "0 0 2rem", lineHeight: 1.6 }}>
            This page doesn&apos;t exist. Head back to the home page or message us on WhatsApp if something seems broken.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="/"
              style={{ background: "#DE2F6B", color: "#fff", fontWeight: 700, padding: ".85em 1.6em", borderRadius: "999px", textDecoration: "none", fontSize: "1rem" }}
            >
              Go home
            </a>
            <a
              href={`https://wa.me/910000000000?text=${encodeURIComponent("Hi! I got a 404 error on your site.")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#1FA855", color: "#fff", fontWeight: 700, padding: ".85em 1.6em", borderRadius: "999px", textDecoration: "none", fontSize: "1rem" }}
            >
              WhatsApp us
            </a>
          </div>
        </main>
        <footer style={{ textAlign: "center", padding: "1.5rem", fontSize: ".8rem", color: "#7C6873", borderTop: "1px solid #EBDDD6" }}>
          © {new Date().getFullYear()} DM to Store · Jodhpur, Rajasthan
        </footer>
      </body>
    </html>
  );
}
