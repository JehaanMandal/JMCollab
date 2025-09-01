import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects, updateProject, deleteProject } from "../features/project/projectSlice";
import { account } from "../lib/appwrite";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ message, type = "info", onClose }) => (
  <motion.div
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 20, opacity: 1 }}
    exit={{ y: -50, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300 }}
    className={`fixed left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-md sm:mt-12 mt-28 ${
      type === "success" ? "text-green-500" : type === "error" ? "text-red-500" : "text-white"
    }`}
  >
    <div className="flex items-center justify-between gap-4">
      <span>{message}</span>
      <button onClick={onClose} className="font-bold hover:opacity-70 text-white">✖</button>
    </div>
  </motion.div>
);

const ConfirmModal = ({ show, message, onConfirm, onCancel }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="p-6 rounded-2xl border border-cyan-400 flex flex-col gap-4 max-w-sm w-full text-white"
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
              className="px-4 py-2 bg-gray-800 rounded-lg hover:scale-105 transition"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CustomDropdown = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 border border-cyan-400 rounded-xl text-white text-sm sm:text-base text-left bg-transparent flex justify-between items-center"
      >
        {value}
        <span className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}>▼</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 border border-cyan-400 rounded-xl bg-black/80 flex flex-col">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className="p-3 text-white hover:bg-cyan-400/20 text-left"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: projects, loading } = useSelector((state) => state.projects);

  const [currentUser, setCurrentUser] = useState(null);
  const [project, setProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("not-started");
  const [deadline, setDeadline] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await account.get();
        setCurrentUser(u);
        await dispatch(fetchProjects());
      } catch {
        showToast("Failed to fetch user.", "error");
      }
    };
    init();
  }, [dispatch]);

  useEffect(() => {
    const p = projects.find((proj) => proj.$id === id);
    if (p) {
      setProject(p);
      setTitle(p.name || "");
      setDescription(p.description || "");
      setStatus(p.status || "not-started");
      setDeadline(p.deadline ? p.deadline.split("T")[0] : "");
    }
  }, [projects, id]);

  const isCreator = project?.userId === currentUser?.$id;

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), 3000);
  };

  const handleUpdate = async () => {
    if (!project || !isCreator) return showToast("You cannot update this project.", "error");
    try {
      const updated = await dispatch(
        updateProject({
          id: project.$id,
          updates: {
            name: title.trim(),
            description: description.trim(),
            status,
            deadline,
          },
        })
      ).unwrap();
      setProject(updated);
      setEditing(false);
      showToast("Project updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update project.", "error");
    }
  };

  const handleDelete = async () => {
    if (!isCreator) return showToast("Only the creator can delete this project.", "error");
    setShowConfirm(false);
    try {
      await dispatch(deleteProject(project.$id)).unwrap();
      showToast("Project deleted!", "success");
      navigate("/projects");
    } catch (err) {
      showToast(err.message || "Failed to delete project.", "error");
    }
  };

  if (loading) return <p className="text-white text-center mt-28">Loading project...</p>;
  if (!project) return <p className="text-red-500 text-center mt-28">Project not found</p>;

  const statusOptions = ["not-started", "in-progress", "completed"];

  return (
    <div className="min-h-screen p-4 sm:p-6 flex justify-center items-start">
      <AnimatePresence>
        {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />}
      </AnimatePresence>

      <ConfirmModal
        show={showConfirm}
        message="Are you sure you want to delete this project?"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 rounded-2xl border border-cyan-400 shadow-xl w-full max-w-lg sm:max-w-2xl flex flex-col gap-3 sm:gap-4 mt-12 sm:mt-16"
      >
        {editing ? (
          <>
            <input
              className="p-2 sm:p-3 rounded-xl border border-cyan-400 text-white text-sm sm:text-base w-full bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="p-2 sm:p-3 rounded-xl border border-cyan-400 text-white text-sm sm:text-base w-full bg-transparent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />
            <input
              type="date"
              className="p-2 sm:p-3 rounded-xl border border-cyan-400 text-white text-sm sm:text-base w-full bg-transparent"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <CustomDropdown options={statusOptions} value={status} onChange={setStatus} />
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
              <button
                className="flex-1 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-2xl text-sm sm:text-base hover:scale-105 transition"
                onClick={handleUpdate}
              >
                Save
              </button>
              <button
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-2xl text-sm sm:text-base hover:scale-105 transition"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white">{project.name}</h1>
            <p className="text-white text-sm">{project.description || "No description"}</p>
            <p className="text-white text-xs sm:text-sm">Status: {project.status}</p>
            <p className="text-white text-xs sm:text-sm">Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString("en-IN") : "N/A"}</p>
            <p className="text-white text-xs sm:text-sm">Created by: {project.createdBy}</p>
            <p className="text-white text-xs sm:text-sm">Updated by: {project.updatedBy || "Not updated yet"}</p>
            <p className="text-white text-xs sm:text-sm">Created at: {project.$createdAt ? new Date(project.$createdAt).toLocaleString() : "N/A"}</p>
           

                       {isCreator && (
              <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm sm:text-base hover:scale-105 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex-1 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-2xl text-sm sm:text-base hover:scale-105 transition"
                >
                  Delete
                </button>
              </div>
            )}

            <button
              onClick={() => navigate("/projects")}
              className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-2xl text-sm sm:text-base hover:scale-105 transition"
            >
              Back to Projects
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ProjectDetail;
