/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client", "bcryptjs", "jsonwebtoken", "twilio"]
  }
};
module.exports = nextConfig;
