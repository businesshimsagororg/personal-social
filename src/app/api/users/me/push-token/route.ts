import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({
  pushToken: z.string().min(1).nullable(),
});

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { pushToken: result.data.pushToken },
    });

    return NextResponse.json({ message: "Push token saved" });
  } catch (error) {
    console.error("Push token error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
