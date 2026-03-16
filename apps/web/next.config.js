/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@spec-engine/shared", "@spec-engine/engine"],
};

module.exports = nextConfig;
