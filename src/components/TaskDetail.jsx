import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { updateTask, updateTaskOptimistic } from "../features/task/taskSlice";
import { uploadTaskImage, account, BUCKET_ID } from "../lib/appwrite";


const CustomAlert = ({ message, onClose }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg mb-4 w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="flex justify-between items-center">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4 font-bold">✖</button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);


const GlassDropdown = ({ value, onChange, options, disabled }) => {
  const [open, setOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const dropdownRef = useRef();

  const toggleDropdown = () => {
    if (!disabled) {
      if (!open && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setMenuTop(rect.bottom + 4);
      }
      setOpen(!open);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full mt-1 z-10">
      <div
        onClick={toggleDropdown}
        className={`w-full p-1.5 rounded bg-black/30 backdrop-blur-md border border-cyan-400/20 text-white text-[11px] sm:text-xs cursor-pointer flex justify-between items-center ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>{value}</span>
        <span className="text-xs">▾</span>
      </div>

      <AnimatePresence>
        {open && !disabled && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed left-[50%] transform -translate-x-1/2 w-60 max-h-60 bg-black/30 backdrop-blur-md border border-cyan-400/20 rounded-lg shadow-lg overflow-y-auto z-50"
            style={{ top: menuTop }}
          >
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="px-3 py-2 hover:bg-cyan-400/20 cursor-pointer text-white text-[11px] sm:text-xs"
              >
                {opt.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};


const TaskDetail = ({ task, onClose }) => {
  const dispatch = useDispatch();
  const [editableTask, setEditableTask] = useState(task);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    account.get()
      .then(u => setCurrentUserId(u.$id))
      .catch(() => setCurrentUserId(null));

    if (task.imageId) {
      const url = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${task.imageId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
      setImagePreview(url);
    }
  }, [task]);

  const isOwner = editableTask.userId === currentUserId;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDeleteImage = () => {
    setImageFile(null);
    setImagePreview("");
    setEditableTask({ ...editableTask, imageId: null });
  };

  const handleSave = async () => {
    if (!isOwner) return;

    try {
      let imageId = editableTask.imageId;
      if (imageFile) imageId = await uploadTaskImage(imageFile);

      const updates = {
        title: editableTask.title?.trim() || "Untitled Task",
        description: editableTask.description?.trim() || "",
        status: editableTask.status || "pending",
        imageId: imageId || null,
        updatedBy: currentUserId,
      };

     
      dispatch(updateTaskOptimistic({ $id: editableTask.$id, ...updates }));

      
      const resultAction = await dispatch(updateTask({ id: editableTask.$id, updates }));

      if (updateTask.fulfilled.match(resultAction)) {
        setAlertMsg("Task updated successfully!");
        setTimeout(() => { setAlertMsg(""); onClose(resultAction.payload); }, 1000);
      } else {
        console.error("Update failed:", resultAction.error);
        setAlertMsg("Failed to update task!");
        setTimeout(() => setAlertMsg(""), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
      setAlertMsg("Failed to update task!");
      setTimeout(() => setAlertMsg(""), 3000);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-start pt-8 z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl p-6 bg-black/40 backdrop-blur-2xl border border-cyan-400/20 rounded-xl shadow-2xl flex flex-col text-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <CustomAlert message={alertMsg} onClose={() => setAlertMsg("")} />

        <h2 className="text-2xl font-bold text-cyan-200 mb-4">Task Details</h2>

        <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[70vh]">
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="task" className="rounded-lg w-full max-h-60 object-cover" />
              {isOwner && (
                <button
                  onClick={handleDeleteImage}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          )}

          {isOwner && (
            <label className="flex gap-3 items-center cursor-pointer">
              <span className="px-3 py-1 bg-cyan-500 text-white rounded text-sm">Upload Image</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}

          <div>
            <label className="text-xs text-cyan-200 mb-1 block">Title</label>
            <input
              type="text"
              value={editableTask.title}
              onChange={(e) => setEditableTask({ ...editableTask, title: e.target.value })}
              disabled={!isOwner}
              className="w-full p-2 rounded bg-black/30 text-white border border-cyan-400/20 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-cyan-200 mb-1 block">Description</label>
            <textarea
              value={editableTask.description}
              onChange={(e) => setEditableTask({ ...editableTask, description: e.target.value })}
              disabled={!isOwner}
              className="w-full p-3 rounded bg-black/30 text-white border border-cyan-400/20 text-sm h-32 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-cyan-200 mb-1 block">Status</label>
            <GlassDropdown
              value={editableTask.status}
              onChange={(val) => setEditableTask({ ...editableTask, status: val })}
              disabled={!isOwner}
              options={[
                { value: "pending", label: "Pending" },
                { value: "in-progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-cyan-200 mt-2">
            <div><span className="font-semibold">Created By:</span> {editableTask.createdBy || "N/A"}</div>
            <div><span className="font-semibold">Updated By:</span> {editableTask.updatedBy || "N/A"}</div>
            <div><span className="font-semibold">Created At:</span> {editableTask.$createdAt ? new Date(editableTask.$createdAt).toLocaleString() : "N/A"}</div>
            <div><span className="font-semibold">Updated At:</span> {editableTask.$updatedAt ? new Date(editableTask.$updatedAt).toLocaleString() : "N/A"}</div>
          </div>
        </div>

                <div className="flex gap-3 mt-4">
          {isOwner && (
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-blue-400 text-white rounded-lg hover:scale-105 text-sm transition-transform duration-200"
            >
              Save
            </button>
          )}
          <button
            onClick={() => onClose()}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskDetail;
