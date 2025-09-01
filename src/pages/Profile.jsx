import React, { useState, useEffect } from "react";
import { account } from "../lib/appwrite";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ message, onClose }) => (
  <motion.div
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 20, opacity: 1 }}
    exit={{ y: -50, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="fixed top-5 right-5 bg-gradient-to-r from-cyan-400 to-blue-600 text-white px-5 py-2 rounded-xl shadow-xl z-50"
  >
    {message}
    <button onClick={onClose} className="ml-3 font-bold hover:text-gray-200">✖</button>
  </motion.div>
);

const ConfirmModal = ({ show, message, onConfirm, onCancel }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-black/80 p-6 rounded-2xl border border-cyan-400/30 flex flex-col gap-4 max-w-sm w-full text-white"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <p className="text-center">{message}</p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 rounded-lg hover:scale-105 transition"
            >
              Delete
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 rounded-lg hover:scale-105 transition"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await account.get();
        setUser(u);
        setUsername(u.name || "");
        setEmail(u.email || "");
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleSave = async () => {
    if (!user) return showToast("User not loaded");
    try {
      if (username !== user.name) await account.updateName(username);
      if (password) await account.updatePassword(password, password);
      const updatedUser = await account.get();
      setUser(updatedUser);
      setUsername(updatedUser.name || "");
      setEmail(updatedUser.email || "");
      setPassword("");
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast("Error updating profile: " + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await account.delete();
      setUser(null);
      showToast("Account deleted successfully!");
    } catch (err) {
      showToast("Error deleting account: " + err.message);
    }
    setShowConfirm(false);
  };

  if (loading) return <p className="text-center text-cyan-400 mt-10 animate-pulse">Loading profile...</p>;
  if (!user) return <p className="text-center text-cyan-400 mt-10">No user logged in.</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <AnimatePresence>
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      </AnimatePresence>

      <ConfirmModal
        show={showConfirm}
        message="Are you sure you want to delete your account?"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="w-full max-w-md bg-black/70 backdrop-blur-xl border border-cyan-400/50 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center mb-6">
          User Profile
        </h2>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="p-3 rounded-xl border border-cyan-400/50 bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 outline-none transition w-full"
        />

        <input
          type="email"
          value={email}
          readOnly
          className="p-3 rounded-xl border border-cyan-400/50 bg-black/30 text-gray-300 placeholder-gray-400 cursor-not-allowed w-full"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password"
          className="p-3 rounded-xl border border-cyan-400/50 bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 outline-none transition w-full"
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold py-3 rounded-2xl shadow-lg hover:scale-105 transition"
          >
            Save
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-2xl shadow-lg hover:scale-105 transition"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
