import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing records to ensure clean slate
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.block.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.postHashtag.deleteMany({});
  await prisma.hashtag.deleteMany({});
  await prisma.share.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);

  console.log("Creating users...");

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          displayName: "System Administrator",
          bio: "I manage this private social network. Reach out for invites or support.",
          privacySetting: "PUBLIC",
        },
      },
    },
  });

  // 2. Moderator
  const moderator = await prisma.user.create({
    data: {
      email: "moderator@example.com",
      username: "moderator",
      passwordHash,
      role: "MODERATOR",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          displayName: "Moderator",
          bio: "Official content moderator of this community.",
          privacySetting: "PUBLIC",
        },
      },
    },
  });

  // 3. User A
  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      username: "alice",
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          displayName: "Alice Vance",
          bio: "Software Engineer | Enthusiast of books, hiking, and green tea.",
          privacySetting: "PUBLIC",
        },
      },
    },
  });

  // 4. User B
  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      username: "bob",
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          displayName: "Bob Miller",
          bio: "Avid photographer & music lover. Capturing the world one pixel at a time.",
          privacySetting: "PUBLIC",
        },
      },
    },
  });

  // 5. User C (Pending approval)
  const charlie = await prisma.user.create({
    data: {
      email: "charlie@example.com",
      username: "charlie",
      passwordHash,
      role: "USER",
      status: "PENDING_APPROVAL",
      emailVerified: true,
      profile: {
        create: {
          displayName: "Charlie Davis",
          bio: "Would love to join this amazing closed community!",
          privacySetting: "PUBLIC",
        },
      },
    },
  });

  console.log("Creating invite codes...");
  // Create invite codes
  await prisma.invite.createMany({
    data: [
      {
        code: "INVITE2026",
        createdById: admin.id,
        status: "UNUSED",
        maxUses: 10,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        code: "ALICES_FRIEND",
        createdById: alice.id,
        status: "UNUSED",
        maxUses: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    ],
  });

  console.log("Creating follow relationships...");
  // Alice follows Bob (accepted)
  await prisma.follow.create({
    data: {
      followerId: alice.id,
      followingId: bob.id,
      isPending: false,
    },
  });

  // Bob follows Alice (accepted)
  await prisma.follow.create({
    data: {
      followerId: bob.id,
      followingId: alice.id,
      isPending: false,
    },
  });

  // Admin follows Alice (accepted)
  await prisma.follow.create({
    data: {
      followerId: admin.id,
      followingId: alice.id,
      isPending: false,
    },
  });

  console.log("Creating posts & hashtags...");
  // Create Hashtags
  const hashWelcome = await prisma.hashtag.create({ data: { name: "welcome" } });
  const hashTech = await prisma.hashtag.create({ data: { name: "tech" } });
  const hashPhoto = await prisma.hashtag.create({ data: { name: "photography" } });

  // Post 1: Admin welcome
  const post1 = await prisma.post.create({
    data: {
      authorId: admin.id,
      content: "Welcome everyone to our brand new private community platform! Super excited to have you all here. Remember to keep discussion respectful and constructive. #welcome",
      visibility: "PUBLIC",
    },
  });

  // Link Post 1 to hashtag
  await prisma.postHashtag.create({
    data: {
      postId: post1.id,
      hashtagId: hashWelcome.id,
    },
  });

  // Post 2: Alice tech post
  const post2 = await prisma.post.create({
    data: {
      authorId: alice.id,
      content: "Just migrated my side project to Next.js 14 and Postgres. The performance boost from React Server Components is mind-blowing! Anyone else building with it? #tech",
      visibility: "PUBLIC",
    },
  });

  await prisma.postHashtag.create({
    data: {
      postId: post2.id,
      hashtagId: hashTech.id,
    },
  });

  // Post 3: Bob photo post
  const post3 = await prisma.post.create({
    data: {
      authorId: bob.id,
      content: "Shot this gorgeous misty sunrise in the mountains earlier today. Nature is the ultimate therapist. #photography",
      media: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800",
              type: "IMAGE",
              size: 0,
            },
          ],
        },
      visibility: "PUBLIC",
    },
  });

  await prisma.postHashtag.create({
    data: {
      postId: post3.id,
      hashtagId: hashPhoto.id,
    },
  });

  console.log("Creating comments and likes...");
  // Bob likes Alice's tech post
  await prisma.like.create({
    data: {
      userId: bob.id,
      postId: post2.id,
    },
  });

  // Bob comments on Alice's tech post
  const comment1 = await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: bob.id,
      content: "Awesome! I've been meaning to check out Server Components too. Did you face any issues with third-party CSS libraries?",
    },
  });

  // Alice replies to Bob's comment (threaded comments)
  await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: alice.id,
      parentId: comment1.id,
      content: "Thanks Bob! Yeah, Tailwind worked perfectly, but some CSS-in-JS libraries still require the 'use client' directive. It's totally manageable though!",
    },
  });

  // Alice likes Bob's photo post
  await prisma.like.create({
    data: {
      userId: alice.id,
      postId: post3.id,
    },
  });

  // Alice comments on Bob's photo post
  await prisma.comment.create({
    data: {
      postId: post3.id,
      authorId: alice.id,
      content: "Wow Bob, this is stunning! The lighting is absolutely perfect.",
    },
  });

  console.log("Creating direct conversations and messages...");
  // Chat between Alice and Bob
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
    },
  });

  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conversation.id, userId: alice.id },
      { conversationId: conversation.id, userId: bob.id },
    ],
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "Hey Bob! Loved your mountain photo today.",
      status: "READ",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: bob.id,
      content: "Hey Alice, thank you so much! Really appreciate it.",
      status: "READ",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "Are you planning to go hiking again this weekend?",
      status: "SENT",
    },
  });

  console.log("Creating notifications...");
  // Notify Alice that Bob liked her post
  await prisma.notification.create({
    data: {
      recipientId: alice.id,
      actorId: bob.id,
      type: "LIKE_POST",
      targetId: post2.id,
      read: false,
    },
  });

  // Notify Alice that Bob commented on her post
  await prisma.notification.create({
    data: {
      recipientId: alice.id,
      actorId: bob.id,
      type: "COMMENT",
      targetId: post2.id,
      read: false,
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
