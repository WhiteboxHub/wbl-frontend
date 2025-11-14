

export function getCriticalCSS(): string {
  return `
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html {
      -webkit-text-size-adjust: 100%;
      font-family: var(--font-inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      background-color: #ffffff;
      color: #121723;
      scroll-behavior: smooth;
    }
    
    html.dark {
      background-color: #121723;
      color: #ffffff;
      color-scheme: dark;
    }
    
    body {
      margin: 0;
      padding: 0;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      min-height: 100vh;
      transition: none !important;
    }
    
    body.hydrated {
      transition: background-color 0.2s ease, color 0.2s ease !important;
    }
    
    main {
      display: block;
      width: 100%;
    }
    
    img {
      max-width: 100%;
      height: auto;
      display: block;
      border: 0;
    }
    
    a {
      color: inherit;
      text-decoration: inherit;
      background-color: transparent;
    }
    
    button {
      font-family: inherit;
      font-size: 100%;
      line-height: 1.15;
      margin: 0;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      -webkit-appearance: button;
    }
    
    input,
    textarea,
    select {
      font-size: 16px;
    }
    
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s ease-in-out infinite;
    }
    
    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
    
    .dark .loading-skeleton {
      background: linear-gradient(90deg, #2a2a2a 25%, #1a1a1a 50%, #2a2a2a 75%);
      background-size: 200% 100%;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    }
    
    .skip-link:focus {
      top: 0;
    }
  `.trim();
}
