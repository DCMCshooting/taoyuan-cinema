import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.unicornpopcorn.com.tw" },
      { protocol: "https", hostname: "www.ambassador.com.tw" },
    ],
  },
};

export default nextConfig;
