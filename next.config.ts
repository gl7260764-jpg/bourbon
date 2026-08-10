import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // bourbonoaklover.com is the canonical host (matches NEXT_PUBLIC_SITE_URL,
  // the canonical tags and the Search Console property). Without this, www
  // serves a full 200 duplicate of the site and splits ranking signals.
  // If you later set this redirect at the host/DNS level instead, remove it
  // here — and never let the two point in opposite directions or you'll
  // create an infinite redirect loop.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.bourbonoaklover.com" }],
        destination: "https://bourbonoaklover.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
