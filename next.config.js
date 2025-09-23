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
    
    // Optimize CSS handling in development
    experimental: {
      // Reduce CSS preloading warnings in development
      optimizeCss: false,
      // Disable CSS optimization that causes preload warnings
      cssChunking: 'strict',
    },
    
    // Suppress CSS preload warnings in development
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Suppress CSS preload warnings in development
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            ...config.optimization.splitChunks,
            cacheGroups: {
              ...config.optimization.splitChunks?.cacheGroups,
              styles: {
                name: 'styles',
                test: /\.(css|scss|sass)$/,
                chunks: 'all',
                enforce: true,
                priority: 20,
              },
            },
          },
        };
        
        // Reduce CSS chunking in development
        config.optimization.splitChunks.cacheGroups.default = false;
        config.optimization.splitChunks.cacheGroups.vendor = false;
      }
      return config;
    },
  }),
};

export default nextConfig;

