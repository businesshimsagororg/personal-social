import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { postCreateSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = postCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content, media, visibility } = result.data;

    // Parse hashtags from content (e.g., #tech #welcome)
    const hashtagRegex = /#(\w+)/g;
    const hashtags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      const hashtagName = match[1].toLowerCase();
      if (!hashtags.includes(hashtagName)) {
        hashtags.push(hashtagName);
      }
    }

    // Database transaction to create post and map hashtags
    const newPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId: user.id,
          content,
          media,
          visibility,
        },
      });

      // Handle hashtags
      for (const tagName of hashtags) {
        // Find or create the hashtag
        const tag = await tx.hashtag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        // Link post to hashtag
        await tx.postHashtag.create({
          data: {
            postId: post.id,
            hashtagId: tag.id,
          },
        });
      }

      return post;
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_POST",
        metadata: JSON.stringify({ postId: newPost.id, visibility }),
      },
    });

    return NextResponse.json({ message: "Post created successfully", post: newPost }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Fetch lists of who this user is following (accepted status)
    const followingIds = await prisma.follow
      .findMany({
        where: { followerId: user.id, isPending: false },
        select: { followingId: true },
      })
      .then((follows) => follows.map((f) => f.followingId));

    // Fetch list of users who are following this user (for Mutuals check)
    const followerIds = await prisma.follow
      .findMany({
        where: { followingId: user.id, isPending: false },
        select: { followerId: true },
      })
      .then((follows) => follows.map((f) => f.followerId));

    const mutualIds = followingIds.filter((id) => followerIds.includes(id));

    // Privacy-controlled visibility query
    // A post is visible to the user if:
    // 1. Author is the user themselves
    // 2. Visibility is PUBLIC
    // 3. Visibility is FOLLOWERS and user follows the author
    // 4. Visibility is MUTUALS and user is mutual with author
    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        OR: [
          { authorId: user.id },
          { visibility: "PUBLIC" },
          {
            visibility: "FOLLOWERS",
            authorId: { in: followingIds },
          },
          {
            visibility: "MUTUALS",
            authorId: { in: mutualIds },
          },
        ],
      },
      take: limit + 1, // Fetch an extra post to determine next cursor
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        media: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        likes: {
          where: { userId: user.id },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { deletedAt: null } },
            shares: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      media: post.media,
      visibility: post.visibility,
      createdAt: post.createdAt,
      author: post.author,
      isLiked: post.likes.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post._count.shares,
    }));

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor,
    });
  } catch (error) {
    console.error("Fetch feed error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
