import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Benarkan muat naik gambar menu sehingga 5MB melalui server action
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
