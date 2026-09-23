"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

const isDev = process.env.NODE_ENV === "development";

function getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("bearer_token")
    );
}

export default function GlobalServiceWorker() {
    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/api/sw.js', { scope: '/' })
                .then(registration => {
                    if (isDev) console.log('✅ Global SW Active');

                    const token = getStoredToken();
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
                .catch(err => {
                    if (isDev) console.error('SW Registration failed:', err);
                });

            // Sync token if it changes or when SW becomes active
            navigator.serviceWorker.oncontrollerchange = () => {
                const token = getStoredToken();
                if (navigator.serviceWorker.controller) {
                    if (isDev) console.log('🔄 SW Control changed, sending config...');
                    navigator.serviceWorker.controller.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
                    if (token) navigator.serviceWorker.controller.postMessage({ type: 'SET_TOKEN', token });
                }
            };

            // Periodic config sync
            const intervalToken = setInterval(() => {
                const token = getStoredToken();

                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
                    if (token) navigator.serviceWorker.controller.postMessage({ type: 'SET_TOKEN', token });
                }
            }, 30000); // every 30s

            return () => clearInterval(intervalToken);
        }
    }, []);

    // Flush on initial app load once SW is ready and configured
    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                const token = getStoredToken();
                const worker = registration.active || navigator.serviceWorker.controller;
                if (worker) {
                    worker.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
                    if (token) worker.postMessage({ type: 'SET_TOKEN', token });
                    worker.postMessage({ type: 'FLUSH' });
                }
            }).catch(() => {});
        }
    }, []);

    return null; // This component has no UI, it only runs the SW background logic globally
}
