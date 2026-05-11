import { appSessionCookie } from "@/lib/app-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(appSessionCookie);
  return response;
}

