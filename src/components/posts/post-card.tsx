"use client";

import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  CornerDownRight,
  Send,
  MoreHorizontal,
  Lock,
  Globe,
  Users,
  Shield,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatarUrl?: string;
    };
  };
  replies?: Comment[];
}

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  visibility: "PUBLIC" | "FOLLOWERS" | "MUTUALS" | "PRIVATE";
  createdAt: string;
  author: {
    id: string;
    username: string;
    role: "USER" | "MODERATOR" | "ADMIN";
    profile?: {
      displayName?: string;
      avatarUrl?: string;
    };
  };
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  const [newCommentText, setNewCommentText] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleLikeToggle = async () => {
    // Optimistic UI updates
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });

      if (!res.ok) {
        throw new Error();
      }
    } catch (e) {
      // Revert if error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    }
  };

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setShowComments(true);
    setCommentsLoading(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
      console.error("Error loading comments", e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const text = parentId ? replyText : newCommentText;
    if (!text.trim()) return;

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, parentId }),
      });

      if (res.ok) {
        const data = await res.json();
        const freshComment = data.comment;

        if (parentId) {
          // Nest reply under its parent comment in state
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === parentId) {
                return { ...c, replies: [...(c.replies || []), freshComment] };
              }
              return c;
            })
          );
          setReplyText("");
          setReplyToCommentId(null);
        } else {
          setComments((prev) => [...prev, { ...freshComment, replies: [] }]);
          setNewCommentText("");
        }

        setCommentsCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error posting comment", err);
    }
  };

  const getVisibilityIcon = (v: string) => {
    switch (v) {
      case "PUBLIC":
        return <Globe className="h-3 w-3" />;
      case "FOLLOWERS":
        return <Users className="h-3 w-3" />;
      case "MUTUALS":
        return <Users className="h-3 w-3 text-primary" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Reusable Comment Node Component supporting nested replies
  const CommentNode = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 text-sm ${isReply ? "pl-6 mt-3 border-l-2 border-border/40" : "mt-4"}`}>
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 text-xs">
        {comment.author.profile?.avatarUrl ? (
          <img
            src={comment.author.profile.avatarUrl}
            alt={comment.author.username}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          comment.author.username.substring(0, 2).toUpperCase()
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className="glass/50 px-3.5 py-2 rounded-2xl border border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-foreground">
              {comment.author.profile?.displayName || comment.author.username}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatTimestamp(comment.createdAt)}</span>
          </div>
          <p className="text-sm mt-1 text-foreground/90">{comment.content}</p>
        </div>

        {!isReply && (
          <div className="flex items-center gap-4 pl-2">
            <button
              onClick={() => {
                setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id);
                setReplyText("");
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition"
            >
              Reply
            </button>
          </div>
        )}

        {/* Nest replies form inside */}
        {replyToCommentId === comment.id && (
          <form
            onSubmit={(e) => handlePostComment(e, comment.id)}
            className="flex gap-2 items-center mt-2 pl-4"
          >
            <CornerDownRight className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Reply to this comment..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        )}

        {/* Nested Children replies mapping */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-1">
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <article className="glass rounded-3xl p-6 border border-border/80 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/20 shadow-inner">
            {post.author.profile?.avatarUrl ? (
              <img
                src={post.author.profile.avatarUrl}
                alt={post.author.username}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              post.author.username.substring(0, 2).toUpperCase()
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground">
                {post.author.profile?.displayName || post.author.username}
              </span>
              
              {post.author.role === "ADMIN" && (
                <span className="p-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" title="Administrator">
                  <Shield className="h-3.5 w-3.5" />
                </span>
              )}
              {post.author.role === "MODERATOR" && (
                <span className="p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" title="Moderator">
                  <Shield className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>@{post.author.username}</span>
              <span>•</span>
              <span>{formatTimestamp(post.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1" title={`Visibility: ${post.visibility}`}>
                {getVisibilityIcon(post.visibility)}
              </span>
            </div>
          </div>
        </div>

        <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 mb-5">
        <p className="text-sm md:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {/* Media Attachments */}
        {post.mediaUrls.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-border max-h-[400px]">
            <img
              src={post.mediaUrls[0]}
              alt="Post attachment"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 py-2 border-t border-b border-border/40 text-muted-foreground font-semibold text-xs">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center gap-2 transition hover:text-pink-500 ${
            isLiked ? "text-pink-500" : ""
          }`}
        >
          <Heart className={`h-5 w-5 transition ${isLiked ? "fill-pink-500 scale-110" : ""}`} />
          <span>{likesCount} Likes</span>
        </button>

        <button
          onClick={loadComments}
          className="flex items-center gap-2 hover:text-primary transition"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{commentsCount} Comments</span>
        </button>
      </div>

      {/* Expandable Comments Drawer Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border/30 space-y-4 animate-fade-in">
          {/* Create Root Comment Form */}
          <form onSubmit={(e) => handlePostComment(e, null)} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Add a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-semibold transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Comments list loader */}
          {commentsLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="text-xs">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-1.5 divide-y divide-border/20">
              {comments.map((comment) => (
                <CommentNode key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
