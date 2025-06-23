// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./app/**/*.{js,ts,jsx,tsx}",
//     "./pages/**/*.{js,ts,jsx,tsx}",
//     "./components/**/*.{js,ts,jsx,tsx}",
//   ],
//   darkMode: "class",
//   theme: {
//     container: {
//       center: true,
//       padding: "1rem",
//     },
   
//     screens: {
//       xs: "450px",
//       // => @media (min-width: 450px) { ... }

//       sm: "575px",
//       // => @media (min-width: 576px) { ... }

//       md: "768px",
//       // => @media (min-width: 768px) { ... }

//       lg: "992px",
//       // => @media (min-width: 992px) { ... }

//       xl: "1200px",
//       // => @media (min-width: 1200px) { ... }

//       "2xl": "1400px",
//       // => @media (min-width: 1400px) { ... }
//     },
//     extend: {
//       colors: {
//         current: "currentColor",
//         transparent: "transparent",
//         white: "#FFFFFF",
//         black: "#121723",
//         dark: "#1D2144",
//         darklight: "#333756",
//         primary: "#4A6CF7",
//         primarylight: "#5c7af7",
//         yellow: "#FBB040",
//         "body-color": "#959CB1",
//       },
//       boxShadow: {
//         zero: "0px 5px 10px rgba(4, 10, 34, 0.2)",
//         one: "0px 2px 3px rgba(7, 7, 77, 0.05)",
//         sticky: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)",
//       },
//       animation: {
//         "spin-slow": "spin 0.5s linear 1",
//       },
//       fontFamily: {
//         comic: ['"Comic Sans MS"', 'cursive']
//       },
//     },
//   },
//   plugins: [],
// };

// -----------------------------


// // tailwind.config.js
// module.exports = {
//   content: [
//     "./app/**/*.{js,ts,jsx,tsx}",
//     "./pages/**/*.{js,ts,jsx,tsx}",
//     "./components/**/*.{js,ts,jsx,tsx}",
//   ],
//   darkMode: "class", 
//   theme: {
//     container: {
//       center: true,
//       padding: "1rem",
//     },
//     screens: {
//       xs: "450px",
//       sm: "575px",
//       md: "768px",
//       lg: "992px",
//       xl: "1200px",
//       "2xl": "1400px",
//     },
//     extend: {
//       colors: {
//         current: "currentColor",
//         transparent: "transparent",
//         white: "#FFFFFF",
//         black: "#121723",
//         dark: "#1D2144",
//         darklight: "#333756",
//         primary: "#4A6CF7",
//         primarylight: "#5c7af7",
//         yellow: "#FBB040",
//         "body-color": "#959CB1",
//       },
//       boxShadow: {
//         zero: "0px 5px 10px rgba(4, 10, 34, 0.2)",
//         one: "0px 2px 3px rgba(7, 7, 77, 0.05)",
//         sticky: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)",
//       },
//       animation: {
//         "spin-slow": "spin 0.5s linear 1",
//       },
//       fontFamily: {
//         comic: ['"Comic Sans MS"', 'cursive'],
//       },
//     },
//   },
//   plugins: [],
// };


// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    screens: {
      xs: "450px",
      sm: "575px",
      md: "768px",
      lg: "992px",
      xl: "1200px",
      "2xl": "1400px",
    },
    extend: {
      colors: {
        current: "currentColor",
        transparent: "transparent",
        white: "#FFFFFF",
        black: "#121723",
        dark: "#1D2144",
        darklight: "#333756",
        primary: "#4A6CF7",
        primarylight: "#5c7af7",
        yellow: "#FBB040",
        "body-color": "#959CB1",

        // ✅ These fix the bg-background, text-foreground, border-border errors
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        "card-foreground": "hsl(var(--card-foreground) / <alpha-value>)",
        popover: "hsl(var(--popover) / <alpha-value>)",
        "popover-foreground": "hsl(var(--popover-foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        "sidebar-background": "hsl(var(--sidebar-background) / <alpha-value>)",
        "sidebar-foreground": "hsl(var(--sidebar-foreground) / <alpha-value>)",
        "sidebar-primary": "hsl(var(--sidebar-primary) / <alpha-value>)",
        "sidebar-primary-foreground":
          "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
        "sidebar-accent": "hsl(var(--sidebar-accent) / <alpha-value>)",
        "sidebar-accent-foreground":
          "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
        "sidebar-border": "hsl(var(--sidebar-border) / <alpha-value>)",
        "sidebar-ring": "hsl(var(--sidebar-ring) / <alpha-value>)",
      },
      boxShadow: {
        zero: "0px 5px 10px rgba(4, 10, 34, 0.2)",
        one: "0px 2px 3px rgba(7, 7, 77, 0.05)",
        sticky: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "spin-slow": "spin 0.5s linear 1",
      },
      fontFamily: {
        comic: ['"Comic Sans MS"', "cursive"],
      },
    },
  },
  plugins: [],
};
