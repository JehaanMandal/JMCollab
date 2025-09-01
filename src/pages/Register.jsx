import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, resetError } from "../features/auth/authSlice";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const Register = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(resetError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };

  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-cyan-900 via-black to-cyan-700 relative">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-black/30 backdrop-blur-md border border-cyan-400/20 p-10 rounded-3xl shadow-2xl w-11/12 max-w-md flex flex-col"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text animate-gradient-x">
          Create Account
        </h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 mb-4 text-center"
          >
            {error}
          </motion.p>
        )}

        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded-xl bg-black/50 placeholder-cyan-400 text-white border border-cyan-400/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded-xl bg-black/50 placeholder-cyan-400 text-white border border-cyan-400/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-4 mb-6 rounded-xl bg-black/50 placeholder-cyan-400 text-white border border-cyan-400/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition"
        />

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-bold p-4 rounded-xl shadow-lg hover:brightness-110 transition-all"
        >
          {loading ? "Creating account..." : "Register"}
        </motion.button>

        <p className="mt-6 text-sm text-center text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Login
          </Link>
        </p>
      </motion.form>

      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-cyan-900 via-black to-cyan-700 animate-pulse-slow opacity-40"></div>
    </div>
  );
};

export default Register;
