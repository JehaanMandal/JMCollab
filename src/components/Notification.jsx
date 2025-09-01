import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markRead, deleteNotification } from "../features/notification/notificationSlice";
import { account, realtime, DATABASE_ID, NOTIFICATIONS_COLLECTION_ID } from "../lib/appwrite";
import { motion } from "framer-motion";

const Notification = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.notifications);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await account.get();
        setUser(u);
        setUserLoading(false);
        if (!u.$id) return;

        dispatch(fetchNotifications(u.$id));

        const unsubscribe = realtime.subscribe(
          `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`,
          (res) => {
            if (
              ["document.create", "document.update", "document.delete"].some((event) =>
                res.events.includes(event)
              ) &&
              res.payload.userId === u.$id
            ) {
              dispatch(fetchNotifications(u.$id));
            }
          }
        );

        return () => unsubscribe;
      } catch (err) {
        console.error("Notification init error:", err);
        setUser(null);
        setUserLoading(false);
      }
    };

    init();
  }, [dispatch]);

  if (userLoading || loading) return <p className="text-gray-300">Loading notifications...</p>;
  if (!user) return <p className="text-red-400">Please log in to see notifications.</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="flex justify-center items-start min-h-screen p-4 pt-10 bg-black/20">
      <div className="w-full max-w-lg border rounded-lg shadow-lg bg-black/50 text-white flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400 p-4">Notifications</h2>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-4">
          {items.length === 0 && <p className="text-gray-300">No notifications yet.</p>}

          <ul className="space-y-3">
            {items.map((notif) => (
              <motion.li
                key={notif.$id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border flex flex-col gap-1 ${
                  notif.read ? "bg-gray-800/50 border-gray-600" : "bg-cyan-900/50 border-cyan-400"
                }`}
              >
                <p className="font-semibold">{notif.message}</p>
                {notif.type && <p className="text-sm text-gray-400">Type: {notif.type}</p>}
                <p className="text-xs text-gray-500">{new Date(notif.$createdAt).toLocaleString()}</p>

                <div className="flex gap-3 mt-2">
                  {!notif.read && (
                    <button
                      onClick={() => dispatch(markRead(notif.$id))}
                      className="text-blue-400 text-sm hover:underline"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => dispatch(deleteNotification(notif.$id))}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Notification;
