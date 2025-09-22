/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable HMR in development
  reactStrictMode: true,
  
  // Optimize for development
  swcMinify: true,
  
  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Disable static optimization in development for better HMR
    trailingSlash: false,
    
    // Enable source maps for better debugging
    productionBrowserSourceMaps: false,
  }),
};

export default nextConfig;

