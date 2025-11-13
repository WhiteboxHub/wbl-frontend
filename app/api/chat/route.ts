// wbl-frontend/app/api/chat/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Base URL from Kubernetes env (frontend.yaml)
    // Fallback to in-cluster backend-service
    const backendBase =
      process.env.NEXT_PUBLIC_API_URL || "http://backend-service";

    // Clean trailing slash and append path
    const backendUrl = `${backendBase.replace(/\/$/, "")}/api/chat`;

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Backend responded with error: forward details
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => "");
      console.error(
        "❌ Backend error:",
        backendResponse.status,
        errorText || "(no details)"
      );

      return NextResponse.json(
        {
          reply: "⚠️ Backend returned an error.",
          status: backendResponse.status,
          backendMessage: errorText,
        },
        { status: 502 }
      );
    }

    // Backend returned success
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Proxy error:", error);
    return NextResponse.json(
      { reply: "⚠️ Could not connect to backend." },
      { status: 500 }
    );
  }
}
