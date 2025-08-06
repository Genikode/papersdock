"use client";
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Login Form */}
      <div className="flex flex-col justify-center px-8 sm:px-20">
        <button className="text-sm text-gray-600 mb-8">&larr; Back to home</button>

        <div className="flex flex-col items-center mb-6">
            <div className="bg-gradient-to-tr from-indigo-500 from-10% to-blue-900 to-55% border p-3 shadow-md mb-4">

          <Image src="/logo.webp" alt="Logo" width={100} height={100} />
            </div>
          <h2 className="text-xl font-bold mt-4">Login</h2>
          <p className="text-gray-500 text-sm">Info related portal</p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="text-sm font-medium">Email*</label>
            <div className="mt-1 border rounded-md overflow-hidden">
              <input
                type="email"
                placeholder="mail@website.com"
                className="w-full px-4 py-2 outline-none"
              />
            </div>
          </div>

         <div>
  <label className="text-sm font-medium">Password*</label>
  <div className="mt-1 border rounded-md overflow-hidden flex items-center">
    <input
      type={showPassword ? 'text' : 'password'}
      placeholder="Min. 8 character"
      className="w-full px-4 py-2 outline-none"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="px-3 text-gray-400"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
</div>

          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="text-blue-600">Forget password?</a>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-md"
          >
            Login
          </button>

          <p className="text-sm text-center">
            Not registered yet? <a className="text-blue-600" href="#">Contact Coordinator</a>
          </p>
        </form>

        <p className="text-xs text-center text-gray-400 mt-10">&copy;2024 PapersDock. All rights reserved.</p>
      </div>

      {/* Right: Visual Banner */}
      <div className="hidden md:flex items-center justify-center relative bg-gradient-to-r from-[#2A3D7C] to-[#3C2376] text-white">
        <Image
          src="/login-bg.png"
          alt="Login Visual"
          layout="fill"
          objectFit="cover"
          className="absolute z-0 opacity-30"
        />

        <div className="z-10 text-center max-w-md px-6">
       <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md text-white shadow-lg relative ">
  {/* Top section */}
  <div className="flex justify-between items-start">
    <div>
      <h2 className="text-4xl font-bold">98.7%</h2>
      <p className="text-sm text-white/80 mt-1">Success Rate</p>
    </div>
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-md">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="white"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 17l6-6 4 4 8-8"
        />
      </svg>
    </div>
  </div>

  {/* Bottom cards */}
  <div className="mt-6 flex gap-3">
    {/* Students */}
    <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A3 3 0 018 16h8a3 3 0 012.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold text-sm">10,247</p>
        <p className="text-xs text-white/80">Students</p>
      </div>
    </div>

    {/* A* Rate */}
    <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white shadow">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2a5 5 0 0010 0zM6 13v7a2 2 0 002 2h8a2 2 0 002-2v-7" />
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold text-sm">87.3%</p>
        <p className="text-xs text-white/80">A* Rate</p>
      </div>
    </div>
  </div>
</div>


          <h2 className="text-2xl font-bold leading-snug m-6">Master Computer Science<br />With Excellence.</h2>
          <p className="text-sm mb-4">
            Join thousands of students achieving A* grades through our
            innovative learning platform and expert guidance.
          </p>

          <div className="flex justify-center gap-3 text-xs">
            <span className="bg-white/20 text-white rounded-full px-3 py-1">⚡ #1 Platform</span>
            <span className="bg-white/20 text-white rounded-full px-3 py-1">⭐ 4.9/5 Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
}
