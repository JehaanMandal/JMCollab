import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user)
    return (
      <p className="text-center mt-20 text-gray-200 animate-pulse">
        Loading user...
      </p>
    );

  return (
    <div className="min-h-screen p-4 flex flex-col items-start md:items-center justify-start relative">
      <div className="bg-black/50 backdrop-blur-3xl border border-cyan-400/40 rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl hover:shadow-3xl transition-shadow w-full max-w-md sm:max-w-lg md:max-w-4xl mx-auto md:mx-0 mt-4 md:mt-0">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-left md:text-center bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text animate-gradient-x">
          Welcome, {user?.name || user?.email || "User"}
        </h1>

        <p className="text-gray-300 text-left md:text-center text-sm sm:text-base md:text-lg mt-4">
          Welcome to your all-in-one productivity platform, designed to help you
          effortlessly manage tasks, projects, and team collaborations in
          real-time. Keep track of deadlines, monitor progress, and stay updated
          with instant notifications that ensure you never miss a critical
          update. Collaborate seamlessly with your team through conversation
          threads, task replies, and shared project insights. Organize priorities,
          set milestones, and maintain a streamlined workflow with intuitive tools
          that bring clarity and focus to your daily tasks.
        </p>

        <div className="flex gap-3 sm:gap-4 md:gap-6 flex-wrap justify-center w-full mt-6">
          <Link
            to="/tasks"
            className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg hover:scale-105 hover:shadow-2xl transition-transform"
          >
            Tasks
          </Link>
          <Link
            to="/projects"
            className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg hover:scale-105 hover:shadow-2xl transition-transform"
          >
            Projects
          </Link>
          <Link
            to="/notifications"
            className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg hover:scale-105 hover:shadow-2xl transition-transform"
          >
            Notifications
          </Link>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-cyan-900 to-blue-900 animate-pulse-slow opacity-40"></div>
    </div>
  );
};

export default Dashboard;
