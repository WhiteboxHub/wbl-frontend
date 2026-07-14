"use client";

import { useEffect } from "react";
import { useAuth } from "@/utils/AuthContext";

/**
 * /logout route — used by the AI Prep Tool (and any other SSO consumer)
 * to trigger a full WBL logout programmatically.
 *
 * Flow: AI Prep "Sign Out" → clears cookie → redirects here →
 *       WBL logout() runs (clears localStorage, next-auth, cookies) →
 *       user lands on /login.
 */
export default function LogoutPage() {
  const { logout, isAuthenticated } = useAuth();

  
  useEffect(() => {
    // Call the full WBL logout which clears localStorage, next-auth session,
    // cookies, and redirects to /login
    if (typeof logout === "function") {
      logout();
    } else {
      // Fallback: if AuthContext isn't ready yet, manually clear and redirect
      localStorage.removeItem("access_token");
      localStorage.removeItem("prep_token");
      sessionStorage.clear();
      window.location.href = "/login";
    }
  }, [logout]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
      <p style={{ color: "#888" }}>Signing out…</p>
    </div>
  );
}
