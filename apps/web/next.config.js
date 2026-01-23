/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@oratoria/ui', '@oratoria/lib'],
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000'],
        },
    },
    // Removed rewrites since we are moving API to Next.js Route Handlers
};

module.exports = nextConfig;
