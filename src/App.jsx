import React, { useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Task from "./components/Task";
import TaskDetail from "./components/TaskDetail";
import TaskComments from "./components/TaskComments";
import Project from "./components/Project";
import ProjectDetail from "./components/ProjectDetail";
import Notification from "./components/Notification";
import Profile from "./pages/Profile";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import { getCurrentUser } from "./features/auth/authSlice";
import { fetchTasks } from "./features/task/taskSlice";
import { fetchProjects } from "./features/project/projectSlice";
import { fetchNotifications } from "./features/notification/notificationSlice";

const AppRoutes = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (user && user.$id) {
      dispatch(fetchTasks(user.$id));
      dispatch(fetchProjects(user.$id));
      dispatch(fetchNotifications(user.$id));
    }
  }, [dispatch, user]);

  if (loading)
    return <p className="text-center mt-20 text-gray-400 animate-pulse">Loading...</p>;

  if (!user) {
    if (location.pathname !== "/login" && location.pathname !== "/register") {
      return <Navigate to="/login" replace />;
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  
  return (
    <div className="flex h-screen w-full relative bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="p-6 overflow-y-auto flex-1 relative">
          <Suspense fallback={<p className="text-gray-400">Loading...</p>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Task />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/tasks/:id/comments" element={<TaskComments />} />
              <Route path="/projects" element={<Project />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/notifications" element={<Notification />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-cyan-900 via-pink-900 to-blue-900 animate-pulse-slow opacity-50"></div>
    </div>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
