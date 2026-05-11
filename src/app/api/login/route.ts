import { appPassword, appProfiles, appSessionCookie } from "@/lib/app-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const profile = appProfiles.find((item) => item.email === email);

  if (!profile || body.password !== appPassword) {
    return NextResponse.json({ message: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(appSessionCookie, profile.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

