import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/tarot-card/[id]": ["./public/**/*"],
  },
};

export default nextConfig;
