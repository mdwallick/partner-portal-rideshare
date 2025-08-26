/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 14, no need for experimental.appDir

  // Control React Strict Mode via environment variable
  reactStrictMode: process.env.NEXT_PUBLIC_STRICT_MODE !== "false",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "*.auth0.com",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
      },
    ],
  },
}

module.exports = nextConfig
