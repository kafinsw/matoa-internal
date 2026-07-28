/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  allowedDevOrigins: ['192.168.18.28'],
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost/matoa_internal/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;