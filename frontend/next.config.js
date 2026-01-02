/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/trustwallet/assets/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.ensideas.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "metadata.ens.domains",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "euc.li",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
