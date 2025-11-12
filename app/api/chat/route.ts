// ✅ wbl-frontend/app/api/chat/route.ts
export async function POST(request: Request) {
  try {
    // Read incoming message from Chatbot.tsx
    const body = await request.json();

    // Forward to your FastAPI backend
    const backendResponse = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // Re-send as valid JSON
    });

    const data = await backendResponse.json();

    // Return the backend's response to your Chatbot
    return Response.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json({ reply: "⚠️ Error connecting to backend." }, { status: 500 });
  }
}
