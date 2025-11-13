// //  wbl-frontend/app/api/chat/route.ts
// export async function POST(request: Request) {
//   try {
//     // Read incoming message from Chatbot.tsx
//     const body = await request.json();

//     // Forward to your FastAPI backend
//     const backendResponse = await fetch("http://127.0.0.1:8000/api/chat", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body), // Re-send as valid JSON
//     });

//     const data = await backendResponse.json();

//     // Return the backend's response to your Chatbot
//     return Response.json(data);
//   } catch (error) {
//     console.error("Proxy error:", error);
//     return Response.json({ reply: " Error connecting to backend." }, { status: 500 });
//   }
// }

// wbl-frontend/app/api/chat/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Use env var (set in frontend.yaml). Fallback to in-cluster service name.
    const backendBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://backend-service";

    // Ensure there's no trailing slash problem
    const backendUrl = backendBase.replace(/\/$/, "") + "/api/chat";

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // You can add credentials/mode if needed
    });

    // If backend returned non-2xx, forward useful info
    if (!backendResponse.ok) {
      const txt = await backendResponse.text().catch(() => "");
      console.error("Backend returned error:", backendResponse.status, txt);
      return NextResponse.json(
        { reply: "Backend error", detail: txt },
        { status: 502 }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { reply: "Error connecting to backend." },
      { status: 500 }
    );
  }
}
