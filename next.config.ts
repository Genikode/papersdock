// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "papers-dock.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/**", // allow all buckets under this host
      },
      // If you want to allow *all* AWS S3 bucket hostnames:
      // {
      //   protocol: "https",
      //   hostname: "*.s3.amazonaws.com",
      //   pathname: "/**",
      // },
    ],
  },
};

export default nextConfig;
