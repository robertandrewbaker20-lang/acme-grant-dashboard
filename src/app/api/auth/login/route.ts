import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieOptions, verifyPassword } from "@/lib/auth";
import { isAuthRequired } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (!isAuthRequired()) {
    return NextResponse.json(
      { error: "This demo does not use a password." },
      { status: 400 },
    );
  }

  let password: unknown;
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || !("password" in body)) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }
    password = (body as { password: unknown }).password;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  try {
    const token = await createSessionToken();
    const cookie = getSessionCookieOptions();
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookie.name, token, cookie);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Authentication is not configured" },
      { status: 500 },
    );
  }
}
