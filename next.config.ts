import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.EXPORT_APK === "true" ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
