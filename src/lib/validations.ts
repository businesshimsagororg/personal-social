import { z } from "zod";

/** Turn Zod field errors into a single user-facing message. */
export function formatValidationErrors(fieldErrors: Record<string, string[] | undefined>): string {
  const messages = Object.entries(fieldErrors).flatMap(([, errors]) => errors ?? []);
  return messages.join(" ") || "Invalid inputs";
}

// Authentication schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  inviteCode: z
    .string()
    .nullish()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "New password must be at least 8 characters"),
});

// Social Schemas
export const postCreateSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty").max(2000, "Post is too long"),
media: z.array(z.object({
  url: z.string().url(),
  type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  size: z.number().int().nonnegative().default(0),
})).optional().default([]),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "MUTUALS", "PRIVATE"]).default("PUBLIC"),
});

export const commentCreateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long"),
  parentId: z.string().uuid().nullable().optional(),
});

// Profile Schema
export const profileUpdateSchema = z.object({
  displayName: z.string().max(50, "Display name cannot exceed 50 characters").nullable().optional(),
  bio: z.string().max(160, "Bio cannot exceed 160 characters").nullable().optional(),
  website: z.string().url("Invalid website URL").or(z.literal("")).nullable().optional(),
  location: z.string().max(50, "Location cannot exceed 50 characters").nullable().optional(),
  privacySetting: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
  avatarUrl: z.string().url().or(z.literal("")).nullable().optional(),
});

// Messaging Schemas
export const messageCreateSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty").max(1000, "Message too long"),
  mediaUrl: z.string().url().nullable().optional(),
});

// Admin Schemas
export const inviteCreateSchema = z.object({
  code: z.string().min(4, "Invite code must be at least 4 characters").max(20, "Invite code cannot exceed 20 characters").optional(),
  maxUses: z.number().int().min(1).default(1),
  expiresDays: z.number().int().min(1).optional(),
});

export const reportCreateSchema = z.object({
  targetType: z.enum(["USER", "POST", "COMMENT"]),
  targetId: z.string().uuid(),
  reason: z.string().min(5, "Please provide a valid reason (at least 5 characters)").max(300),
});
