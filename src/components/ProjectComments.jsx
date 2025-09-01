import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { account, databases, DATABASE_ID, COMMENTS_COLLECTION_ID, ID } from "../lib/appwrite";
import { motion, AnimatePresence } from "framer-motion";


const CommentItem = ({ comment, currentUserId, onReply, onDelete }) => (
  <div className="bg-black/30 p-3 rounded-xl border border-cyan-400/20 shadow-sm mb-2">
    <p className="text-white">
      <span className="font-semibold text-cyan-400">{comment.username || "Anonymous"}:</span> {comment.text}
    </p>
    <small className="text-gray-400">{new Date(comment.$createdAt).toLocaleString()}</small>
    <div className="mt-1 flex gap-2">
      <button
        onClick={() => onReply(comment.$id)}
        className="px-2 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Reply
      </button>
      {comment.userId === currentUserId && (
        <button
          onClick={() => onDelete(comment.$id)}
          className="px-2 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Delete
        </button>
      )}
    </div>
    {comment.replies && comment.replies.length > 0 && (
      <div className="ml-6 mt-2 space-y-2">
        {comment.replies.map((reply) => (
          <CommentItem
            key={reply.$id}
            comment={reply}
            currentUserId={currentUserId}
            onReply={onReply}
            onDelete={onDelete}
          />
        ))}
      </div>
    )}
  </div>
);


const ProjectComments = () => {
  const { id } = useParams(); // project id
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await account.get();
        setUser(u);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

 
  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(DATABASE_ID, COMMENTS_COLLECTION_ID, [
        databases.query.equal("projectId", id),
        databases.query.orderAsc("$createdAt"),
      ]);

      const map = {};
      res.documents.forEach((c) => {
        map[c.$id] = { ...c, replies: [], username: c.username || c.createdBy || "Anonymous" };
      });

      const rootComments = [];
      res.documents.forEach((c) => {
        if (c.replyTo && map[c.replyTo]) map[c.replyTo].replies.push(map[c.$id]);
        else rootComments.push(map[c.$id]);
      });

      setComments(rootComments);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);


  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      await databases.createDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, ID.unique(), {
        projectId: id,
        text: newComment,
        replyTo: replyTo || null,
        createdBy: user.$id,
        username: user.name || user.email || "Anonymous",
        userId: user.$id,
      });
      setNewComment("");
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  
  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    try {
      await databases.deleteDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, commentId);

      const res = await databases.listDocuments(DATABASE_ID, COMMENTS_COLLECTION_ID, [
        databases.query.equal("replyTo", commentId),
      ]);
      for (let reply of res.documents) await handleDeleteComment(reply.$id);

      fetchComments();
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  return (
    <div className="p-6 min-h-screen max-w-4xl mx-auto relative bg-black/40 backdrop-blur-2xl rounded-3xl shadow-lg">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-blue-400 text-white rounded-xl"
      >
        ← Back
      </button>

     
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyTo ? "Replying..." : "Add a comment..."}
          className="w-full p-3 rounded-xl bg-black/30 text-white border border-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-2"
        />
        {replyTo && (
          <button
            onClick={() => setReplyTo(null)}
            className="text-sm text-gray-400 underline mb-2"
          >
            Cancel Reply
          </button>
        )}
        <button
          onClick={handleAddComment}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-blue-400 text-white rounded-xl"
        >
          {replyTo ? "Reply" : "Comment"}
        </button>
      </div>

      
      {loading ? (
        <p className="text-gray-400">Loading comments...</p>
      ) : (
        <div className="space-y-2">
          {comments.length === 0 && <p className="text-gray-400">No comments yet.</p>}
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
                  currentUserId={user?._id || user?.$id}
                  onReply={setReplyTo}
                  onDelete={handleDeleteComment}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ProjectComments;
