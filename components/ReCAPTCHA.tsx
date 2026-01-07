
"use client";

import { useEffect, useRef } from "react";

interface ReCAPTCHAProps {
  onToken: (token: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (el: HTMLElement, options: any) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

const ReCAPTCHA: React.FC<ReCAPTCHAProps> = ({ onToken, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
      onError?.("reCAPTCHA site key missing");
      return;
    }

    // ---- callbacks (MUST be defined first) ----
    const onTokenReceived = (token: string) => {
      onToken(token);
    };

    const onExpired = () => {
      onToken("");
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    };

    const renderCaptcha = () => {
      if (!window.grecaptcha || !containerRef.current) return;

      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        size: "normal",
        callback: onTokenReceived,
        "expired-callback": onExpired,
      });
    };

    // ---- load script once ----
    if (!document.querySelector('script[src="https://www.google.com/recaptcha/api.js"]')) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => window.grecaptcha?.ready(renderCaptcha);
      script.onerror = () => onError?.("Failed to load reCAPTCHA");
      document.head.appendChild(script);
    } else {
      window.grecaptcha?.ready(renderCaptcha);
    }
  }, [onToken, onError]);

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
    />
  );
};

export default ReCAPTCHA;
