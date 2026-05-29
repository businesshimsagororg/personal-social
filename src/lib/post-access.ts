import { prisma } from "@/lib/prisma";
import type { Post, PostVisibility } from "@prisma/client";

export async function canViewerAccessPost(
  viewerId: string,
  post: Pick<Post, "id" | "authorId" | "visibility" | "deletedAt">
): Promise<boolean> {
  if (post.deletedAt) return false;
  if (post.authorId === viewerId) return true;

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: post.authorId },
        { blockerId: post.authorId, blockedId: viewerId },
      ],
    },
  });
  if (block) return false;

  const visibility = post.visibility as PostVisibility;
  if (visibility === "PUBLIC") return true;
  if (visibility === "PRIVATE") return false;

  const followToAuthor = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: post.authorId,
      },
    },
  });
  const isAcceptedFollower = followToAuthor ? !followToAuthor.isPending : false;

  if (visibility === "FOLLOWERS") return isAcceptedFollower;

  if (visibility === "MUTUALS") {
    if (!isAcceptedFollower) return false;
    const followBack = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: post.authorId,
          followingId: viewerId,
        },
      },
    });
    return followBack ? !followBack.isPending : false;
  }

  return false;
}
