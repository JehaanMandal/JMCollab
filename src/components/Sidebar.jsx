import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaTasks, FaProjectDiagram, FaBell, FaUser, FaBars, FaTimes } from "react-icons/fa";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { to: "/tasks", label: "Tasks", icon: <FaTasks /> },
    { to: "/projects", label: "Projects", icon: <FaProjectDiagram /> },
    { to: "/notifications", label: "Notifications", icon: <FaBell /> },
    { to: "/profile", label: "Profile", icon: <FaUser /> },
  ];

  return (
    <>
     
      {!isOpen && (
        <div className="md:hidden fixed top-24 left-4 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col justify-between w-6 h-5 text-white"
          >
            <span className="block h-0.5 w-full bg-white"></span>
            <span className="block h-0.5 w-full bg-white"></span>
            <span className="block h-0.5 w-full bg-white"></span>
          </button>
        </div>
      )}

    
      <aside
        className={`fixed top-0 left-0 h-full w-64 p-6 gap-4 bg-black/50 backdrop-blur-3xl border border-cyan-400/30 shadow-2xl transform transition-transform duration-300 z-40
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex flex-col`}
      >
     
        {isOpen && (
          <div className="absolute top-4 right-4 md:hidden">
            <button onClick={() => setIsOpen(false)} className="text-white text-2xl">
              <FaTimes />
            </button>
          </div>
        )}

        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all
                ${isActive
                  ? "bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg hover:scale-105 hover:shadow-2xl transition-transform"
                  : "text-gray-200 hover:bg-cyan-900/30 hover:text-white hover:shadow-md"}
              `}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </aside>

     
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
