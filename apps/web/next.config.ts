import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
