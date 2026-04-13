/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      ...(process.env.NODE_ENV === "development"
        ? [{ protocol: "http", hostname: "127.0.0.1" }]
        : []),
    ],
  },
};

export default nextConfig;
