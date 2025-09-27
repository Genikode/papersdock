import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
const API_BASE_URL = "https://lms-prod.ddns.net"; // {{baseUrl}}
    // Detect IP from incoming request headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip =
      forwardedFor?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    // Forward to your backend login endpoint
    const response = await fetch(`${API_BASE_URL}/users/login-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "lms_API", // match your backend config
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("Proxy login error:", err);
    return NextResponse.json({ message: "Proxy failed" }, { status: 500 });
  }
}
