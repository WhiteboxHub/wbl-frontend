import React from "react";

export function TestOwasp({ html, jwt }: { html: string, jwt: string }) {
  // 1. Safe HTML (Expected: Ignored)
  const safeHtml = DOMPurify.sanitize(html);
  
  // 2. Benign localStorage (Expected: Ignored)
  localStorage.setItem("theme", "dark");
  
  // 3. Public env var (Expected: Ignored)
  const REACT_APP_URL = "https://api.example.com";
  
  // 4. Real secret (Expected: SEC generated)
  const STRIPE_SECRET = "sk_live_123456789";
  
  // 5. Multiple sinks
  // 5a. XSS Sink (Expected: SEC generated)
  const badContent = <div dangerouslySetInnerHTML={{ __html: html }} />;
  
  // 5b. LocalStorage JWT (Expected: SEC generated)
  localStorage.setItem("jwt", jwt);
  
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      {badContent}
    </div>
  );
}
