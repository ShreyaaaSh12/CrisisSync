/** @type {import('next').NextConfig} */
const nextConfig = {
  // Whitelist your local network IP to bypass the security block
  allowedDevOrigins: ['10.50.0.52', 'localhost'],
};

export default nextConfig;
