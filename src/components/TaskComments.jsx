import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { account, addComment, getCommentsByTask, deleteComment } from "../lib/appwrite";

const CommentItem = ({ comment, currentUsername, onReply, onDelete }) => {
  const isOwner = comment.username === currentUsername;

  return (
    <div className="bg-black/30 p-3 rounded-xl border border-cyan-400/20 shadow-sm mb-2">
      <p className="text-white">
        <span className="font-semibold text-cyan-400">{comment.username || "Anonymous"}:</span>{" "}
        {comment.text}
      </p>
      <small className="text-gray-400">{new Date(comment.$createdAt).toLocaleString()}</small>

      <div className="mt-1 flex gap-2">
        <button
          onClick={() => onReply(comment.$id)}
          className="px-2 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reply
        </button>

        {isOwner && (
          <button
            onClick={() => onDelete(comment.$id)}
            className="px-2 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Delete
          </button>
        )}
      </div>

      {comment.replies?.length > 0 && (
        <div className="ml-6 mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.$id}
              comment={reply}
              currentUsername={currentUsername}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TaskComments = ({ task, onClose }) => {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    account.get().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (task) loadComments();
  }, [task]);

  const loadComments = async () => {
    const allComments = await getCommentsByTask(task.$id);
    setComments(allComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    try {
      await addComment({
        taskId: task.$id,
        text: newComment,
        replyTo,
      });
      setNewComment("");
      setReplyTo(null);
      loadComments();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      await deleteComment(id);
      loadComments();
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-start sm:items-center pt-8 sm:pt-0 z-50 px-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-xs sm:max-w-sm md:max-w-md p-3 md:p-4 bg-black/40 backdrop-blur-2xl border border-cyan-400/20 rounded-xl shadow-2xl flex flex-col gap-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Chat / Comments</h2>

        <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-2">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.$id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CommentItem
                  comment={comment}
                  currentUsername={user?.name || user?.email || "Anonymous"}
                  onReply={setReplyTo}
                  onDelete={handleDeleteComment}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyTo ? "Replying..." : "Add a comment..."}
          className="w-full p-2 sm:p-3 rounded-lg bg-black/30 text-white border border-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />

        {replyTo && (
          <button
            onClick={() => setReplyTo(null)}
            className="text-sm text-gray-400 underline self-end"
          >
            Cancel Reply
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleAddComment}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-blue-400 text-white rounded-lg hover:scale-105 text-[11px] sm:text-xs"
          >
            {replyTo ? "Reply" : "Comment"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[11px] sm:text-xs"
          >
            Close Chat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskComments;
