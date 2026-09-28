/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.20.10.4', '172.20.10.8'],
  serverExternalPackages: ['archiver'],
};

export default nextConfig;
