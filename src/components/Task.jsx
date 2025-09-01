import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, addTask, deleteTask } from "../features/task/taskSlice";
import { account, databases, DATABASE_ID, TASKS_COLLECTION_ID, realtime } from "../lib/appwrite";
import TaskDetail from "./TaskDetail";
import TaskComments from "./TaskComments";
import { motion, AnimatePresence, Reorder } from "framer-motion";


const Toast = ({ message, onClose }) => (
  <motion.div
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 20, opacity: 1 }}
    exit={{ y: -50, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="fixed left-1/2 transform -translate-x-1/2 z-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-2xl bg-gradient-to-r from-cyan-400 via-pink-400 to-blue-500 text-white backdrop-blur-lg text-sm sm:text-base mt-28 sm:mt-12"
  >
    <div className="flex items-center justify-between gap-4">
      <span>{message}</span>
      <button onClick={onClose} className="font-bold text-white hover:opacity-70">✖</button>
    </div>
  </motion.div>
);


const ConfirmModal = ({ show, onConfirm, onCancel, message }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 flex justify-center items-center z-50 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="p-6 rounded-2xl border border-cyan-400 flex flex-col gap-4 max-w-sm w-full text-white bg-black/50 backdrop-blur-md"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <p className="text-center">{message}</p>
          <div className="flex justify-center gap-4 mt-2">
            <button onClick={onConfirm} className="px-4 py-2 bg-red-500 rounded-lg hover:scale-105 transition">
              Delete
            </button>
            <button onClick={onCancel} className="px-4 py-2 bg-gray-800 rounded-lg hover:scale-105 transition">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);


const Task = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector(state => state.tasks);
  const [userId, setUserId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, task: null });
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [search, setSearch] = useState("");

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  
  useEffect(() => {
    account.get()
      .then(u => { setUserId(u.$id); dispatch(fetchTasks()); })
      .catch(() => setUserId(null));

    const subscription = realtime.subscribe(
      `databases.${DATABASE_ID}.collections.${TASKS_COLLECTION_ID}.documents`,
      (response) => {
        const event = response.events[0];
        const doc = response.payload;

    
        const exists = tasks.find(t => t.$id === doc.$id);

        if (event.endsWith(".create") && !exists) {
          dispatch({ type: "tasks/addTaskOptimistic", payload: doc });
        } else if (event.endsWith(".update")) {
          dispatch({ type: "tasks/updateTaskOptimistic", payload: doc });
        } else if (event.endsWith(".delete")) {
          dispatch({ type: "tasks/removeTaskOptimistic", payload: doc.$id });
        }
      }
    );

    return () => subscription();
  }, [dispatch, tasks]);


  const handleDelete = async (task) => {
    dispatch({ type: "tasks/removeTaskOptimistic", payload: task.$id });
    showToast(`Task "${task.title}" deleted!`);
    try {
      await dispatch(deleteTask(task.$id));
    } catch {
      dispatch(fetchTasks());
      showToast("Failed to delete task!");
    }
    setConfirmDelete({ show: false, task: null });
  };

  const handleSubmit = async () => {
    if (!newTask.title.trim()) return showToast("Task title is required");

    const tempTask = {
      $id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      userId,
      createdBy: "You",
      $createdAt: new Date().toISOString(),
    };
    dispatch({ type: "tasks/addTaskOptimistic", payload: tempTask });

    try {
      const createdTask = await dispatch(addTask(newTask)).unwrap();
      showToast(`Task "${createdTask.title}" added!`);
    } catch {
      showToast("Failed to add task!");
    }

    setNewTask({ title: "", description: "" });
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => task.title.toLowerCase().includes(search.toLowerCase()))
      .slice()
      .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
  }, [tasks, search]);

  
  return (
    <div className="p-4 sm:p-6 min-h-screen max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <ConfirmModal
        show={confirmDelete.show}
        onConfirm={() => handleDelete(confirmDelete.task)}
        onCancel={() => setConfirmDelete({ show: false, task: null })}
        message={`Are you sure you want to delete "${confirmDelete.task?.title}"?`}
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-cyan-200 text-transparent bg-clip-text animate-gradient-x">
        CollabDesk
      </h1>

      <div className="p-4 sm:p-6 bg-black/40 backdrop-blur-3xl border border-cyan-400/20 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">
        <label className="text-gray-300 text-sm">Title</label>
        <input
          type="text"
          placeholder="Title: Task Name"
          value={newTask.title}
          onChange={e => setNewTask({ ...newTask, title: e.target.value })}
          className="border border-cyan-400/30 p-2 sm:p-3 rounded-xl shadow-sm sm:shadow-md bg-black/30 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <label className="text-gray-300 text-sm">Description</label>
        <textarea
          placeholder="Description: Task Details"
          value={newTask.description}
          onChange={e => setNewTask({ ...newTask, description: e.target.value })}
          className="border border-cyan-400/30 p-2 sm:p-3 rounded-xl shadow-sm sm:shadow-md bg-black/30 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
        />

        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-2 sm:py-3 rounded-xl shadow-md sm:shadow-lg hover:scale-105 transition-transform"
        >
          Add Task
        </button>
      </div>

      <div className="flex flex-col">
        <label className="text-gray-300 text-sm mb-1">Search Tasks</label>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 sm:mb-6 w-full p-2 sm:p-3 rounded-xl bg-black/30 text-white border border-cyan-400/30 shadow-sm sm:shadow-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
        />
      </div>

      <Reorder.Group axis="y" values={filteredTasks} onReorder={() => {}} className="space-y-3 sm:space-y-4 mt-4">
        <AnimatePresence>
          {filteredTasks.map((task, index) => (
            <Reorder.Item
              key={task.$id} value={task}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="bg-black/40 backdrop-blur-3xl border border-cyan-400/20 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-md sm:shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm sm:text-base gap-2 sm:gap-4"
            >
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {task.title} <span className="text-gray-400 text-sm">#{filteredTasks.length - index}</span>
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm">Created By: {task.createdBy}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Created At: {task.$createdAt ? new Date(task.$createdAt).toLocaleString() : "N/A"}</p>
                
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold
                  ${task.status === "pending" ? "bg-yellow-500 text-black" : 
                  task.status === "in-progress" ? "bg-blue-500 text-white" :
                  task.status === "completed" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                  {task.status === "pending" ? "Pending" : task.status === "in-progress" ? "In Progress" : "Completed"}
                </span>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                <button
                  onClick={() => setSelectedTask(task)}
                  className="bg-blue-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-white text-xs sm:text-sm hover:scale-105 transition"
                >
                  View Details
                </button>
                {userId === task.userId && (
                  <button
                    onClick={() => setConfirmDelete({ show: true, task })}
                    className="bg-red-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-white text-xs sm:text-sm hover:scale-105 transition"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setSelectedTask({ ...task, openChat: true })}
                  className="bg-cyan-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-white text-xs sm:text-sm hover:scale-105 transition"
                >
                  Chat
                </button>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {selectedTask && !selectedTask.openChat && (
        <TaskDetail task={selectedTask} onClose={(updated) => {
          setSelectedTask(null);
          if(updated) showToast("Task updated successfully!");
        }} />
      )}

      {selectedTask && selectedTask.openChat && (
        <TaskComments task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
};

export default Task;
