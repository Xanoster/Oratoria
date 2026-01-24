/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@oratoria/ui', '@oratoria/lib'],
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000'],
        },
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: 'http://localhost:3001/api/v1/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
