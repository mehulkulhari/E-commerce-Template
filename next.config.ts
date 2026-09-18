import type { NextConfig } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dmtostore.in";

// Supabase Storage host (for product photos the owner uploads in /admin).
// Seeded photos are static files under /public/catalog; owner uploads live in
// the Supabase `product-images` bucket and are served from this host.
const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname || null; }
  catch { return null; }
})();

const nextConfig: NextConfig = {
  // Disable source maps in production — don't expose source code to browser
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },

  // Dev only: lets a phone on the same Wi-Fi load the dev server by this PC's
  // LAN address. Update if the router assigns the PC a different IP.
  allowedDevOrigins: ["192.168.1.5"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features not used by this site
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
          // Basic XSS protection for older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // HSTS — enforce HTTPS (only active once on a real HTTPS domain)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
