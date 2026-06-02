"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function GlobalServiceWorker() {
    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/api/sw.js', { scope: '/' })
                .then(registration => {
                    console.log('✅ Global SW Active');

                    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                    const config = { token, url: API_BASE_URL };

                    // Function to send config to a specific worker
                    const sendConfig = (worker: ServiceWorker | null) => {
                        if (!worker) return;
                        worker.postMessage({ type: 'SET_API_URL', url: config.url });
                        if (config.token) worker.postMessage({ type: 'SET_TOKEN', token: config.token });
                    };

                    // Send to whichever worker is available
                    sendConfig(registration.active);
                    sendConfig(registration.waiting);
                    sendConfig(registration.installing);
                })
                .catch(err => console.error('SW Registration failed:', err));

            // Sync token if it changes or when SW becomes active
            navigator.serviceWorker.oncontrollerchange = () => {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                if (navigator.serviceWorker.controller) {
                    console.log('🔄 SW Control changed, sending config...');
                    navigator.serviceWorker.controller.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
                    if (token) navigator.serviceWorker.controller.postMessage({ type: 'SET_TOKEN', token });
                }
            };

            // Periodic config sync
            const intervalToken = setInterval(() => {
                const token =
                    localStorage.getItem("access_token") ||
                    localStorage.getItem("token") ||
                    localStorage.getItem("auth_token") ||
                    localStorage.getItem("bearer_token");

                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
                    if (token) navigator.serviceWorker.controller.postMessage({ type: 'SET_TOKEN', token });
                }
            }, 30000); // every 30s

            return () => clearInterval(intervalToken);
        }
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && navigator.serviceWorker?.controller) {
                console.log('App visible (tab focused), evaluating sync...');
                navigator.serviceWorker.controller.postMessage({ type: 'FLUSH' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Flush on initial app load if SW is already active
    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'FLUSH' });
        }
    }, []);

    return null; // This component has no UI, it only runs the SW background logic globally
}
