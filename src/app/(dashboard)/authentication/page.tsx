'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function SignUpForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    course: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log(form);
    // call API or validation here
  };

  return (
<>
 <PageHeader
          title="Sign Up"
          description="Create a new account"
        />
    <main className=" flex  bg-[#F9FAFB] px-4">
       
      <div className="bg-white p-8 rounded-md shadow-md w-full max-w-md">
      
        {/* Form Fields */}
        {[
          { label: 'Name', name: 'name', type: 'text', placeholder: 'Enter your full name' },
          { label: 'Email', name: 'email', type: 'email', placeholder: 'Enter your email' },
          { label: 'Contact', name: 'contact', type: 'text', placeholder: 'Enter your mobile number' }
        ].map((field) => (
          <div className="mb-4" key={field.name}>
            <label className="text-sm font-medium">
              <span className="text-red-500">*</span> {field.label}:
            </label>
            <input
              {...field}
              value={(form as any)[field.name]}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2"
            />
          </div>
        ))}

        {/* Password */}
        <div className="mb-4">
          <label className="text-sm font-medium">
            <span className="text-red-500">*</span> Password:
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label className="text-sm font-medium">
            <span className="text-red-500">*</span> Re-type Password:
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Course Dropdown */}
        <div className="mb-6">
          <label className="text-sm font-medium">
            <span className="text-red-500">*</span> Course:
          </label>
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-3 py-2"
          >
            <option value="">Select your course</option>
            <option value="AS">AS</option>
            <option value="A2">A2</option>
            <option value="Composite">Composite</option>
            <option value="P2 Crash Course">P2 Crash Course</option>
            <option value="P4 Crash Course">P4 Crash Course</option>
            <option value="Crash Composite">Crash Composite</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 rounded-md font-semibold"
        >
          Create Account
        </button>
      </div>
    </main>
    </>
  );
}
