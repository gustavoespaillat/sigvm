import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/sigvm",
  assetPrefix: "/sigvm",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default nextConfig;
