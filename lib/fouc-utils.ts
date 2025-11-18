
export function isPageLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return document.body.classList.contains('loaded');
}


export function isPageLoading(): boolean {
  if (typeof window === 'undefined') return false;
  return document.body.classList.contains('loading');
}


export function markPageAsLoaded(): void {
  if (typeof window === 'undefined') return;
  
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[FOUC] Page manually marked as loaded');
  }
}


export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}


export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  

  localStorage.setItem('theme', theme);
}


export function getFOUCMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
  const lcp = paint.find(entry => entry.name === 'largest-contentful-paint');
  
  return {

    ttfb: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : 0,
    

    fcp: fcp ? Math.round(fcp.startTime) : 0,
    

    lcp: lcp ? Math.round(lcp.startTime) : 0,
    

    domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) : 0,
    

    loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
    

    dnsTime: navigation ? Math.round(navigation.domainLookupEnd - navigation.domainLookupStart) : 0,
    

    tcpTime: navigation ? Math.round(navigation.connectEnd - navigation.connectStart) : 0,
  };
}


export function logFOUCMetrics(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const metrics = getFOUCMetrics();
  
  if (metrics) {
    console.group('[FOUC] Performance Metrics');
    console.log('TTFB:', metrics.ttfb, 'ms');
    console.log('First Contentful Paint:', metrics.fcp, 'ms');
    console.log('DOM Content Loaded:', metrics.domContentLoaded, 'ms');
    console.log('Total Load Time:', metrics.loadTime, 'ms');
    console.log('DNS Lookup:', metrics.dnsTime, 'ms');
    console.log('TCP Connection:', metrics.tcpTime, 'ms');
    console.groupEnd();
    
    if (metrics.fcp < 1500) {
      console.log('Excellent FCP performance!');
    } else if (metrics.fcp < 2500) {
      console.log('Moderate FCP performance');
    } else {
      console.log('Poor FCP performance - investigate');
    }
  }
}

/**

 * @param timeout
 * @returns
 */
export function waitForPageLoad(timeout: number = 5000): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {

    if (isPageLoaded()) {
      resolve();
      return;
    }
    

    const checkLoaded = () => {
      if (isPageLoaded()) {
        clearInterval(interval);
        clearTimeout(timeoutId);
        resolve();
      }
    };
    
    const interval = setInterval(checkLoaded, 100);
    

    const timeoutId = setTimeout(() => {
      clearInterval(interval);
      console.warn('[FOUC] Wait timeout - forcing resolve');
      resolve();
    }, timeout);
  });
}


export function preloadCriticalResources(resources: { href: string; as: string; type?: string }[]): void {
  if (typeof window === 'undefined') return;
  
  resources.forEach(({ href, as, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    
    document.head.appendChild(link);
  });
}


export async function areFontsLoaded(): Promise<boolean> {
  if (typeof window === 'undefined' || !document.fonts) {
    return true;
  }
  
  try {
    await document.fonts.ready;
    return true;
  } catch (error) {
    console.error('[FOUC] Font loading error:', error);
    return false;
  }
}


export function optimizeAboveFoldImages(selector: string = 'img[data-above-fold]'): void {
  if (typeof window === 'undefined') return;
  
  const images = document.querySelectorAll<HTMLImageElement>(selector);
  
  images.forEach(img => {
    img.loading = 'eager';
    img.decoding = 'async';
    

    if (!img.complete) {
      img.style.backgroundColor = getCurrentTheme() === 'dark' ? '#2a2a2a' : '#f0f0f0';
    }
  });
}


export function monitorLayoutShifts(callback?: (cls: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }
  
  let clsScore = 0;
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as any).hadRecentInput) continue;
        clsScore += (entry as any).value;
      }
      
      if (callback) {
        callback(clsScore);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[FOUC] Cumulative Layout Shift:', clsScore.toFixed(4));
      }
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.error('[FOUC] Layout shift monitoring error:', error);
  }
}


export function getFOUCStatus() {
  if (typeof window === 'undefined') {
    return {
      isServer: true,
      isLoaded: false,
      isLoading: false,
      theme: 'unknown',
      hasCriticalCSS: false,
    };
  }
  
  return {
    isServer: false,
    isLoaded: isPageLoaded(),
    isLoading: isPageLoading(),
    theme: getCurrentTheme(),
    hasCriticalCSS: !!document.querySelector('style[data-href="critical-css"]'),
    bodyClasses: Array.from(document.body.classList),
    htmlClasses: Array.from(document.documentElement.classList),
  };
}
