import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'utils', 'sw-click-tracker.js');
        const swContent = readFileSync(filePath, 'utf-8');

        return new NextResponse(swContent, {
            headers: {
                'Content-Type': 'application/javascript',
                'Service-Worker-Allowed': '/',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error("Failed to serve service worker:", error);
        return new NextResponse("Service Worker unavailable.", { status: 500 });
    }
}
