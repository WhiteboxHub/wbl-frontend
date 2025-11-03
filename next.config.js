/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["whitebox-learning.com"],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  

      swcMinify: true,
  experimental: {
    esmExternals: true,
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      '@headlessui/react',
      'lucide-react',
      'react-icons',
    ],
  },
  
    reactStrictMode: true,
  
  poweredByHeader: false,
  
  compress: true,
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    RESUME_PUBLIC_API_URL: process.env.RESUME_PUBLIC_API_URL,
  },
  
  webpack: (config, { isServer, dev }) => {
    config.module.rules.push({
      test: /\.hbs$/,
      loader: "handlebars-loader",
      options: {
        partialDirs: ['./public/templates/partials'],
      },
    });

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
            priority: 40,
            enforce: true,
          },

                    lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              if (!module.context) return 'npm.unknown';
              const match = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              );
              if (!match || !match[1]) return 'npm.unknown';
              const packageName = match[1];
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },

          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },

          shared: {
            name: 'shared',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
                maxInitialRequests: 25,
        maxAsyncRequests: 25,
        minSize: 20000,
      };
    }

    return config;
  },
  

  output: 'standalone',
  
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;