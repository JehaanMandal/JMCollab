import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";
import { Bell, User } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  markRead,
  fetchNotifications,
} from "../features/notification/notificationSlice";
import {
  account,
  realtime,
  DATABASE_ID,
  NOTIFICATIONS_COLLECTION_ID,
} from "../lib/appwrite";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items: notifications } = useSelector((state) => state.notifications);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    let unsubscribe;
    const initRealtime = async () => {
      try {
        const u = await account.get();
        if (!u.$id) return;

        dispatch(fetchNotifications(u.$id));

        unsubscribe = realtime.subscribe(
          `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`,
          (res) => {
            if (
              ["document.create", "document.update", "document.delete"].some(
                (event) => res.events.includes(event)
              ) &&
              res.payload.userId === u.$id
            ) {
              dispatch(fetchNotifications(u.$id)); // Refresh notifications
            }
          }
        );
      } catch (err) {
        console.error("Navbar realtime error:", err);
      }
    };

    initRealtime();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  const handleBellClick = () => {
    unreadNotifications.forEach((notif) => dispatch(markRead(notif.$id)));

    navigate("/notifications");
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 backdrop-blur-3xl bg-black/60 border border-cyan-400/30 shadow-2xl">
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">
        JMCollab
      </h1>

      <div className="flex items-center gap-6">
        <motion.button
          onClick={handleBellClick}
          whileHover={{ scale: 1.1 }}
          className="relative p-2 rounded-lg hover:bg-cyan-700/40 transition shadow-md"
        >
          <Bell size={24} className="text-cyan-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs font-bold rounded-full px-1.5 py-0.5 shadow-lg">
              {unreadCount}
            </span>
          )}
        </motion.button>

        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-cyan-700/40 transition shadow-md"
          >
            <User size={24} className="text-cyan-300" />
            <span className="text-gray-100 font-medium">
              {user?.name || "Guest"}
            </span>
          </Link>
        )}

        {user && (
          <motion.button
            onClick={() => dispatch(logoutUser())}
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-cyan-400 to-blue-400 text-white px-4 py-1 rounded-xl font-semibold shadow-lg hover:brightness-110 transition"
          >
            Logout
          </motion.button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
