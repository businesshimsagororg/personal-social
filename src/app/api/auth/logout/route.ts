import { NextResponse } from "next/server";
import { logoutUserSession } from "@/lib/auth";

export async function POST() {
  try {
    await logoutUserSession();
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
