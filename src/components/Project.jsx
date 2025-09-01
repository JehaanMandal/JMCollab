import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProjects,
  addProject,
  deleteProject,
} from "../features/project/projectSlice";
import { motion, Reorder } from "framer-motion";
import { account } from "../lib/appwrite";
import { useNavigate } from "react-router-dom";

const Toast = ({ message, onClose }) => (
  <motion.div
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 20, opacity: 1 }}
    exit={{ y: -50, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="fixed top-0 right-0 m-5 bg-gradient-to-r from-cyan-400 via-pink-400 to-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-2xl z-50 backdrop-blur-lg text-sm sm:text-base"
  >
    {message}
    <button
      onClick={onClose}
      className="ml-2 sm:ml-3 font-bold text-white hover:text-gray-200"
    >
      ✖
    </button>
  </motion.div>
);

const ConfirmModal = ({ show, onConfirm, onCancel, message }) =>
  show && (
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
  );

const Project = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: projects } = useSelector((state) => state.projects);

  const [userId, setUserId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    project: null,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("not-started");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    account
      .get()
      .then((u) => {
        setUserId(u.$id);
        dispatch(fetchProjects());
      })
      .catch(() => setUserId(null));
  }, [dispatch]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleDelete = async (project) => {
    await dispatch(deleteProject(project.$id));
    showToast(`Project "${project.name}" deleted!`);
    setConfirmDelete({ show: false, project: null });
  };

  const handleViewDetails = (project) => {
    navigate(`/projects/${project.$id}`, { state: { project } });
  };

  const handleSubmit = async () => {
    if (!name || !userId) return showToast("Project name is required");

    const projectData = {
      name,
      description,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
      userId,
    };

    showToast(`Adding project "${name}"...`);

    try {
      await dispatch(addProject(projectData)).unwrap();
      showToast(`Project "${name}" added!`);
      setName("");
      setDescription("");
      setDeadline("");
      setStatus("not-started");
    } catch (err) {
      console.error(err);
      showToast("Failed to add project!");
    }
  };

  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      a.createdAt && b.createdAt
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : b.$id.localeCompare(a.$id)
    );

  const statusOptions = [
    { label: "Not Started", value: "not-started" },
    { label: "In Progress", value: "in-progress" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <div className="p-4 sm:p-6 min-h-screen max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <ConfirmModal
        show={confirmDelete.show}
        onConfirm={() => handleDelete(confirmDelete.project)}
        onCancel={() => setConfirmDelete({ show: false, project: null })}
        message={`Are you sure you want to delete "${confirmDelete.project?.name}"?`}
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-cyan-200 text-transparent bg-clip-text animate-gradient-x">
        Project Manager
      </h1>

 
      <div className="p-4 sm:p-6 bg-black/40 backdrop-blur-3xl border border-cyan-400/20 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
        <label className="text-gray-300 text-sm">Project Name</label>
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-cyan-400/30 p-2 sm:p-3 rounded-xl shadow-sm sm:shadow-md bg-black/30 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <label className="text-gray-300 text-sm">Description</label>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-cyan-400/30 p-2 sm:p-3 rounded-xl shadow-sm sm:shadow-md bg-black/30 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <label className="text-gray-300 text-sm">Deadline</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="border border-cyan-400/30 p-2 sm:p-3 rounded-xl shadow-sm sm:shadow-md bg-black/30 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <div className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="border border-cyan-400/30 p-2 sm:p-3 rounded-xl shadow-sm sm:shadow-md bg-black/30 text-white cursor-pointer flex justify-between items-center"
          >
            {statusOptions.find((s) => s.value === status)?.label}
            <span className="ml-2">{dropdownOpen ? "▲" : "▼"}</span>
          </div>
          {dropdownOpen && (
            <div className="absolute mt-1 w-full bg-black/80 border border-cyan-400/30 rounded-xl shadow-lg z-10">
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setStatus(option.value);
                    setDropdownOpen(false);
                  }}
                  className="p-2 cursor-pointer hover:bg-cyan-500/20 rounded-xl text-white"
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-2 sm:py-3 rounded-xl shadow-md sm:shadow-lg hover:scale-105 transition-transform"
        >
          Add Project
        </button>
      </div>

 
      <div className="flex flex-col">
        <label className="text-gray-300 text-sm mb-1">Search Projects</label>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 sm:mb-6 w-full p-2 sm:p-3 rounded-xl bg-black/30 text-white border border-cyan-400/30 shadow-sm sm:shadow-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
        />
      </div>

    
      <Reorder.Group
        axis="y"
        values={filteredProjects}
        onReorder={() => {}}
        className="space-y-3 sm:space-y-4 mt-4"
      >
        {filteredProjects.map((project, index) => (
          <Reorder.Item
            key={project.$id}
            value={project}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="bg-black/40 backdrop-blur-3xl border border-cyan-400/20 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-md sm:shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm sm:text-base gap-2 sm:gap-4"
          >
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100">
                {project.name}{" "}
                <span className="text-gray-400 text-sm">
                  #{filteredProjects.length - index}
                </span>
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                Created By: {project.createdBy}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Status: {project.status}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Deadline:{" "}
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString("en-IN")
                  : "N/A"}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Description: {project.description || "No description"}
              </p>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
              <button
                onClick={() => handleViewDetails(project)}
                className="bg-blue-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-white text-xs sm:text-sm hover:scale-105 transition"
              >
                View Details
              </button>
              {userId === project.userId && (
                <button
                  onClick={() => setConfirmDelete({ show: true, project })}
                  className="bg-red-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-white text-xs sm:text-sm hover:scale-105 transition"
                >
                  Delete
                </button>
              )}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};

export default Project;
