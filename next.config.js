// // whiteboxLearning-wbl\next.config.js
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     domains: ["whitebox-learning.com"],
//   },
//   experimental: {
//     missingSuspenseWithCSRBailout: false,
//   },
//   reactStrictMode: false,
//   env: {
//     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
//     RESUME_PUBLIC_API_URL: process.env.RESUME_PUBLIC_API_URL,
//   },
//   webpack: (config, { isServer }) => {
//     config.module.rules.push({
//       test: /\.hbs$/, // Handle .hbs files
//       loader: "handlebars-loader", // Use handlebars-loader
//       options: {
//         partialDirs: [
//           // Specify the directory for partials relative to the project root
//           './public/templates/partials', // Assuming partials are in public/templates/partials
//         ],
//       },
//     });

//     return config;
//   },
   
// };


// module.exports = nextConfig;

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["whitebox-learning.com"],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    RESUME_PUBLIC_API_URL: process.env.RESUME_PUBLIC_API_URL,
  },
  webpack: (config, { isServer }) => {
    // Add alias for @
    config.resolve.alias["@"] = path.resolve(__dirname);

    // Your existing Handlebars loader setup
    config.module.rules.push({
      test: /\.hbs$/,
      loader: "handlebars-loader",
      options: {
        partialDirs: [
          path.resolve(__dirname, "public/templates/partials")
        ],
      },
    });

    return config;
  },
};

module.exports = nextConfig;
