/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Set by the GitHub Pages workflow; empty locally.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};
export default nextConfig;
