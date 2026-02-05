import { useEffect, useState } from "react";

/**
 * Ensures loading state displays for a minimum duration to prevent flickering
 * @param loading - The actual loading state from data fetching
 * @param minimumMs - Minimum time to show loader (default: 500ms)
 * @returns boolean - Whether to show the loader
 */
export function useMinimumLoadingTime(loading: boolean, minimumMs: number = 500): boolean {
    const [showLoader, setShowLoader] = useState(loading);
    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
        if (loading) {
            // Loading started - record the start time
            setStartTime(Date.now());
            setShowLoader(true);
        } else if (startTime !== null) {
            // Loading finished - check if minimum time has elapsed
            const elapsed = Date.now() - startTime;
            const remaining = minimumMs - elapsed;

            if (remaining > 0) {
                // Wait for remaining time before hiding loader
                const timer = setTimeout(() => {
                    setShowLoader(false);
                    setStartTime(null);
                }, remaining);
                return () => clearTimeout(timer);
            } else {
                // Minimum time already elapsed
                setShowLoader(false);
                setStartTime(null);
            }
        }
    }, [loading, startTime, minimumMs]);

    return showLoader;
}
