'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Phone, User2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

type Role = { id: string; roleName: string; description?: string };
type Course = { id: string; title: string; fees?: string };

export default function AuthPage() {
  const router = useRouter();

  /* ------- tabs ------- */
  const [tab, setTab] = useState< 'login' | 'register'>('register'); // default to register since you asked for create-user flow

  /* ------- shared UI ------- */
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ------- login state (placeholder: route to /login) ------- */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  /* ------- register state ------- */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');

  const [roles, setRoles] = useState<Role[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [roleId, setRoleId] = useState('');
  const selectedRole = useMemo(() => roles.find(r => r.id === roleId) || null, [roles, roleId]);
  const isStudent = true;

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  /* ------- fetch roles ------- */
  useEffect(() => {
    async function loadRoles() {
      setLoadingRoles(true);
      setErrorMsg(null);
      try {
        // NOTE: this endpoint returns roles INSIDE "message" array in your sample
        const res: any = await api.get<any>('/roles/get-roles');
        const list: Role[] =
          Array.isArray(res?.data) ? res.data :
          Array.isArray(res?.message) ? res.message :
          [];
        setRoles(list);
      } catch (e: any) {
        setRoles([]);
        setErrorMsg(e?.message || 'Failed to load roles');
      } finally {
        setLoadingRoles(false);
      }
    }
    loadRoles();
  }, []);

  /* ------- fetch courses ------- */
  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      setErrorMsg(null);
      try {
        const res: any = await api.get<any>('/courses/get-all-courses', { page: 1, limit: 100 });
        const list: Course[] = Array.isArray(res?.data) ? res.data : [];
        setCourses(list);
      } catch (e: any) {
        setCourses([]);
        setErrorMsg(e?.message || 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  /* ------- register submit ------- */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) return setErrorMsg('Please enter a name.');
    if (!email.trim()) return setErrorMsg('Please enter an email.');
    if (!password.trim()) return setErrorMsg('Please enter a password.');
    // if (!roleId) return setErrorMsg('Please select a role.');
    if (isStudent && selectedCourseIds.length === 0) {
      return setErrorMsg('Students must be assigned at least one course.');
    }

    setSubmitting(true);
    try {
      const body: any = {
        name,
        email,
        password,
        contact: contact || '000000000', // fallback if you want
        roleId: '72820b17-a80f-4707-9ed8-e15d92902a2b',
      };
      if (isStudent) {
        body.courseIds = selectedCourseIds;
      }

      await api.post('/users/create-user', body);

      setSuccessMsg('User created successfully!');
      // Optionally reset or route to login
      setName('');
      setEmail('');
      setContact('');
      setPassword('');
      setRoleId('');
      setSelectedCourseIds([]);
      // router.replace('/login'); // if you want
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  /* ------- login submit (routes to your existing login page) ------- */
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // You already have a dedicated /login screen with eye toggle etc.
    // If you prefer real login here, wire your actual login endpoint.
    router.push('/login');
  }

  /* ------- course multi-select ------- */
  function toggleCourse(id: string) {
    setSelectedCourseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] text-white">
      {/* Background art */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <Image
          src="/login-bg.png"
          alt="bg"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Image src="/logo.webp" alt="logo" width={28} height={28} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">PapersDock</h1>
              <p className="text-xs text-white/60">A-Level Computer Science LMS</p>
            </div>
          </div>

          <div className="hidden md:flex gap-2 rounded-full bg-white/10 p-1">
         
            <button
              onClick={() => setTab('register')}
              className={`px-4 py-1.5 text-sm rounded-full transition ${
                tab === 'register' ? 'bg-white text-gray-900' : 'text-white/80'
              }`}
            >
              Create user
            </button>
          </div>
        </div>

        {/* Shell */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 md:p-8">
            {/* Mobile tabs */}
            <div className="md:hidden mb-6 flex gap-2 rounded-full bg-white/10 p-1">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 px-4 py-1.5 text-sm rounded-full transition ${
                  tab === 'login' ? 'bg-white text-gray-900' : 'text-white/80'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 px-4 py-1.5 text-sm rounded-full transition ${
                  tab === 'register' ? 'bg-white text-gray-900' : 'text-white/80'
                }`}
              >
                Create user
              </button>
            </div>

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-2xl font-bold">Welcome back</h2>
                <p className="text-sm text-white/70 mb-4">
                  Sign in to manage your LMS dashboard.
                </p>

                <Field
                  label="Email"
                  icon={<Mail size={16} />}
                  input={
                    <input
                      type="email"
                      className="bg-transparent outline-none w-full"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  }
                />
                <Field
                  label="Password"
                  icon={<Lock size={16} />}
                  input={
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="bg-transparent outline-none w-full"
                      placeholder="********"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  }
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="text-white/70 hover:text-white"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100"
                >
                  Continue
                </button>

                <p className="text-xs text-white/60 text-center">
                  Need an account? Use the <span className="text-white">Create user</span> tab.
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-2xl font-bold">Create user</h2>
                <p className="text-sm text-white/70 mb-4">
                  Add an account and assign role/courses.
                </p>

                {errorMsg && (
                  <p className="text-sm bg-red-500/20 border border-red-400/30 text-red-200 px-3 py-2 rounded-lg">
                    {errorMsg}
                  </p>
                )}
                {successMsg && (
                  <p className="text-sm bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle2 size={16} /> {successMsg}
                  </p>
                )}

                <Field
                  label="Full name"
                  icon={<User2 size={16} />}
                  input={
                    <input
                      className="bg-transparent outline-none w-full"
                      placeholder="Student: Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  }
                />

                <Field
                  label="Email"
                  icon={<Mail size={16} />}
                  input={
                    <input
                      type="email"
                      className="bg-transparent outline-none w-full"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  }
                />

                <Field
                  label="Password"
                  icon={<Lock size={16} />}
                  input={
                    <input
                      type="password"
                      className="bg-transparent outline-none w-full"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  }
                />

                <Field
                  label="Contact"
                  icon={<Phone size={16} />}
                  input={
                    <input
                      className="bg-transparent outline-none w-full"
                      placeholder="090078601"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  }
                />

                {/* Role */}
             

                {/* Courses (only for students) */}
                {isStudent && (
                  <div>
                    <Label>Assign Courses (required)</Label>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 max-h-48 overflow-auto space-y-2">
                      {loadingCourses && <p className="text-sm text-white/70">Loading courses…</p>}
                      {!loadingCourses && courses.length === 0 && (
                        <p className="text-sm text-white/60">No courses available.</p>
                      )}
                      {courses.map(c => {
                        const checked = selectedCourseIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className="flex items-center justify-between gap-3 bg-white/5 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="accent-white"
                                checked={checked}
                                onChange={() => toggleCourse(c.id)}
                              />
                              <span className="text-sm">{c.title}</span>
                            </div>
                            {c.fees && <span className="text-xs text-white/60">${c.fees}</span>}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      Tip: You can assign multiple courses.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100 disabled:opacity-60"
                >
                  {submitting ? 'Creating…' : 'Create user'}
                </button>
              </form>
            )}
          </div>

          {/* Right side highlight */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 flex flex-col justify-center">
            <h3 className="text-3xl font-semibold mb-3">Modern, minimal, fast.</h3>
            <p className="text-white/70 mb-6">
              Manage users, courses and content from one elegant place. Secure by default with API key + bearer token support.
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Badge title="Secure" desc="x-api-key & Bearer token" />
              <Badge title="Scalable" desc="Server-driven lists" />
              <Badge title="S3 Uploads" desc="Presign + PUT flow" />
              <Badge title="TypeScript" desc="Strict & robust" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- tiny UI bits ---------- */
function Field({
  label,
  icon,
  input,
  trailing,
}: {
  label: string;
  icon?: React.ReactNode;
  input: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
        {icon && <span className="shrink-0 text-white/80">{icon}</span>}
        <div className="flex-1">{input}</div>
        {trailing}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs mb-1 text-white/70">{children}</label>;
}

function Badge({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <p className="font-medium">{title}</p>
      <p className="text-white/60 text-xs mt-1">{desc}</p>
    </div>
  );
}
