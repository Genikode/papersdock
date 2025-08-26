'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Save, UploadCloud } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';

interface CourseItem {
  id: string;
  title: string;
}
interface CoursesResponse {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
}

interface SignedUrlResponse {
  status: number;
  success: boolean;
  message: string;
  signedUrl?: string;
  data?: { signedUrl?: string };
}

function sanitizeKeyPart(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function extractObjectUrl(presigned: string) {
  return presigned.split('?')[0];
}

export default function AddAssignment() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [firstDeadline, setFirstDeadline] = useState(''); // YYYY-MM-DD
  const [lastDeadline, setLastDeadline] = useState('');   // YYYY-MM-DD
  const [totalMarks, setTotalMarks] = useState<number | ''>('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page: 1, limit: 200 });
        setCourses(res?.data ?? []);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  async function getSignedUrl(key: string, contentType: string) {
    const res = await api.post<SignedUrlResponse>('/get-signed-url', { key, contentType });
    return (res as any)?.signedUrl ?? (res as any)?.data?.signedUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError('Please enter assignment title.');
    if (!courseId) return setError('Please select a course.');
    if (!firstDeadline || !/^\d{4}-\d{2}-\d{2}$/.test(firstDeadline)) {
      return setError('First deadline must be YYYY-MM-DD.');
    }
  

    setSubmitting(true);
    try {
      let fileUrl = '';

      if (assignmentFile) {
        const clean = sanitizeKeyPart(assignmentFile.name) || 'assignment-file';
        const key = `assignments/${Date.now()}-${clean}`;
        const contentType = assignmentFile.type || 'application/octet-stream';
        const signed = await getSignedUrl(key, contentType);
        if (!signed) throw new Error('Failed to get signed URL for assignment file.');
        await fetch(signed, { method: 'PUT', headers: { 'Content-Type': contentType }, body: assignmentFile });
        fileUrl = extractObjectUrl(signed);
      }

      await api.post('/assignments/create-assignment', {
        title,
        description,
        courseId,
        firstDeadline,  // YYYY-MM-DD
        lastDeadline,   // YYYY-MM-DD
        assignmentFile: fileUrl,       // empty string allowed if optional
        totalMarks: totalMarks === '' ? undefined : Number(totalMarks),
      });

      router.replace('/view-assignments');
    } catch (e: any) {
      setError(e?.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-gray-800">
      <PageHeader title="Create Assignment" description="Design assignments and quizzes for students" />

      <form onSubmit={handleSubmit} className="px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 bg-white p-6 rounded-md shadow border">
            <h2 className="text-lg font-semibold mb-4">Assignment Details</h2>

            <div className="mb-4">
              <label className="block font-medium text-sm mb-1">Title</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Weekly Quiz 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium text-sm mb-1">Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">{loadingCourses ? 'Loading…' : 'Select course'}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-medium text-sm mb-1">Deadline (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={firstDeadline}
                  onChange={(e) => setFirstDeadline(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            
              <div>
                <label className="block font-medium text-sm mb-1">Total Marks (optional)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded px-3 py-2"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-medium text-sm mb-1">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Enter assignment description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded text-white font-semibold flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 disabled:opacity-60"
            >
              <Save size={18} /> {submitting ? 'Saving…' : 'Save Assignment'}
            </button>
          </div>

          {/* Right: Upload */}
          <div className="bg-white p-6 rounded-md shadow border">
            <h2 className="text-lg font-semibold mb-4">Upload Attachment</h2>

            <div className="border rounded-md p-6 text-center">
              <UploadCloud className="mx-auto text-gray-400" size={28} />
              <p className="text-sm text-gray-600 mt-2 mb-4">Upload assignment file (PDF/PPT/Docs, etc.)</p>
              <label className="cursor-pointer inline-block text-blue-600 font-medium">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                />
                {assignmentFile ? assignmentFile.name : 'Choose File'}
              </label>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
