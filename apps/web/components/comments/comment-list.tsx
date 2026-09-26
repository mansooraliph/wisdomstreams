"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommentThread } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

function CommentAuthorLabel({ comment }: { comment: CommentThread }) {
  return (
    <span className="text-sm font-medium">
      {comment.user.displayName ?? comment.user.username}
      {comment.isPinned && <span className="ml-2 text-xs text-gray-500">Pinned</span>}
    </span>
  );
}

function ReplyBox({ parentId, onPosted }: { parentId: string; onPosted: (c: CommentThread) => void }) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setPosting(true);
    const res = await apiFetch<CommentThread>(`/comments/${parentId}/replies`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    setPosting(false);
    if (res.data) {
      onPosted(res.data);
      setBody("");
    }
  };

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reply..."
        className="flex-1 rounded border px-2 py-1 text-sm"
      />
      <button
        onClick={submit}
        disabled={posting}
        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Reply
      </button>
    </div>
  );
}

function CommentRow({ comment }: { comment: CommentThread }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replies, setReplies] = useState<CommentThread[]>([]);
  const [showReplies, setShowReplies] = useState(false);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await apiFetch(`/comments/${comment.id}/like`, { method: "DELETE" });
      setLikeCount((c) => c - 1);
    } else {
      await apiFetch(`/comments/${comment.id}/like`, { method: "POST" });
      setLikeCount((c) => c + 1);
    }
    setLiked(!liked);
  };

  const loadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    const res = await apiFetch<CommentThread[]>(`/comments/${comment.id}/replies`);
    setReplies(res.data ?? []);
    setShowReplies(true);
  };

  return (
    <li className="py-3">
      <CommentAuthorLabel comment={comment} />
      <p className="text-sm text-gray-700">{comment.body}</p>
      <div className="mt-1 flex gap-3 text-xs text-gray-500">
        <button onClick={toggleLike} className={liked ? "font-medium text-blue-600" : ""}>
          👍 {likeCount}
        </button>
        {user && <button onClick={() => setShowReplyBox((v) => !v)}>Reply</button>}
        {(comment._count?.replies ?? 0) > 0 && (
          <button onClick={loadReplies}>
            {showReplies ? "Hide replies" : `View ${comment._count?.replies} replies`}
          </button>
        )}
      </div>
      {showReplyBox && user && (
        <ReplyBox
          parentId={comment.id}
          onPosted={(c) => {
            setReplies((prev) => [...prev, c]);
            setShowReplies(true);
            setShowReplyBox(false);
          }}
        />
      )}
      {showReplies && replies.length > 0 && (
        <ul className="ml-6 mt-2 space-y-2 border-l pl-3">
          {replies.map((r) => (
            <li key={r.id}>
              <CommentAuthorLabel comment={r} />
              <p className="text-sm text-gray-700">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentList({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<CommentThread[]>(`/videos/${videoId}/comments`);
    setComments(res.data ?? []);
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await apiFetch<CommentThread>(`/videos/${videoId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: newComment }),
    });
    setPosting(false);
    if (res.data) {
      setComments((prev) => [res.data!, ...prev]);
      setNewComment("");
    }
  };

  return (
    <div className="border-t pt-4">
      <h2 className="mb-3 text-sm font-semibold">Comments</h2>

      {user ? (
        <div className="mb-4 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button
            onClick={postComment}
            disabled={posting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Comment
          </button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-500">Sign in to leave a comment.</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        <ul className="divide-y">
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
