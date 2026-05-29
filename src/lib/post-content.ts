import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const tags: string[] = [];
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    const name = match[1].toLowerCase();
    if (!tags.includes(name)) tags.push(name);
  }
  return tags;
}

export function extractMentionUsernames(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g;
  const names: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    const u = match[1].toLowerCase();
    if (!names.includes(u)) names.push(u);
  }
  return names;
}

export async function syncPostHashtags(
  postId: string,
  content: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const tagNames = extractHashtags(content);

  await db.postHashtag.deleteMany({ where: { postId } });

  for (const tagName of tagNames) {
    const tag = await db.hashtag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
    await db.postHashtag.create({
      data: { postId, hashtagId: tag.id },
    });
  }
}

export async function notifyMentions(
  content: string,
  actorId: string,
  postId: string
) {
  const usernames = extractMentionUsernames(content);
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({
    where: { username: { in: usernames, mode: "insensitive" } },
    select: { id: true },
  });

  for (const u of users) {
    await createNotification({
      recipientId: u.id,
      actorId,
      type: "MENTION",
      targetId: postId,
    });
  }
}
