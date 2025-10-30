export const getCriticalCSS = () => `
  /* Critical CSS - Inlined for instant styling */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    color-scheme: light;
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 262 83% 58%;
    --body-color: #959CB1;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
    }
  }

  html {
    background-color: white;
    color: #121723;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.5;
  }

  html.dark {
    background-color: #121723;
    color: white;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  /* Prevent layout shifts */
  img, video {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Header skeleton to prevent layout shift */
  header {
    min-height: 80px;
  }

  /* Container structure */
  .container {
    width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
    margin-left: auto;
    margin-right: auto;
    max-width: 1320px;
  }

  /* Prevent FOUC on buttons and links */
  button, a {
    cursor: pointer;
    text-decoration: none;
  }

  /* Loading state */
  .loading-skeleton {
    background: linear-gradient(90deg, 
      rgba(240, 240, 240, 0.3) 25%, 
      rgba(224, 224, 224, 0.5) 50%, 
      rgba(240, 240, 240, 0.3) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Dark mode loading skeleton */
  .dark .loading-skeleton {
    background: linear-gradient(90deg, 
      rgba(55, 65, 81, 0.3) 25%, 
      rgba(75, 85, 99, 0.5) 50%, 
      rgba(55, 65, 81, 0.3) 75%
    );
  }
`;