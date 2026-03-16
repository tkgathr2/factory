/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@spec-engine/shared", "@spec-engine/engine"],
};

module.exports = nextConfig;
