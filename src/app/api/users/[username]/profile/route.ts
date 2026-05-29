import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validations";

export async function PUT(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.username !== username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = profileUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid inputs", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { displayName, bio, website, location, privacySetting, avatarUrl, coverUrl } =
      result.data;

    const updatedProfile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        displayName,
        bio,
        website,
        location,
        privacySetting,
        avatarUrl,
        coverUrl,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_PROFILE",
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
