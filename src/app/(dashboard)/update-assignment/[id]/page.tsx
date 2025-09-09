'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Save, UploadCloud, Link as LinkIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useParams, useRouter } from 'next/navigation';
import { BiArrowBack } from 'react-icons/bi';

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
interface AssignmentsListResponse {
  status: number;
  success: boolean;
  message: string;
  data: AssignmentDetail[];
}
interface AssignmentDetail {
  id: string;
  assignmentTitle: string;
  description?: string;
  courseId?: string;
  firstDeadline?: string;    // YYYY-MM-DD or datetime
  lastDeadline?: string;
  assignmentFile?: string;
  totalMarks?: number | string;
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
function toYMD(d?: string) {
  if (!d) return '';
  const date = new Date(d);
  // ensure yyyy-mm-dd
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function UpdateAssignment() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // form fields
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [firstDeadline, setFirstDeadline] = useState('');
  const [lastDeadline, setLastDeadline] = useState('');
  // const [totalMarks, setTotalMarks] = useState<number | ''>('');

  // current file
  const [currentFileUrl, setCurrentFileUrl] = useState<string>('');

  // new upload (optional)
  const [newFile, setNewFile] = useState<File | null>(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Load courses */
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

  /* Load assignment detail (try a direct endpoint first; if not available, fall back) */
async function loadAssignmentDetail() {
    if (!id) return;
    setLoadingDetail(true);
    try {
                const resAny = await api.get<AssignmentsListResponse>(`/assignments/get-assignment/${id}`);
          console.log('Fetched assignment detail:', resAny);
          const d = resAny?.data[0] ?? resAny;
          if (!d) throw new Error('Assignment not found');
          setTitle(d.assignmentTitle
 || '');
          setCourseId(d.courseId || '');
          setCurrentFileUrl(d.assignmentFile || '');
          setDescription(d.description || '');
          setFirstDeadline(toYMD(d.firstDeadline));
          setLastDeadline(toYMD(d.lastDeadline));
          // setTotalMarks(d.totalMarks);
        } catch (e: any) {
          setError(e?.message || 'Failed to load assignment');
        } finally {
          setLoadingDetail(false);
        }
      }
  useEffect(() => {
    loadAssignmentDetail();
  }, [id]);

  /* Get signed URL and upload file */

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
      let fileUrl = currentFileUrl || '';

      if (newFile) {
        const clean = sanitizeKeyPart(newFile.name) || 'assignment-file';
        const key = `assignments/${Date.now()}-${clean}`;
        const contentType = newFile.type || 'application/octet-stream';
        const signed = await getSignedUrl(key, contentType);
        if (!signed) throw new Error('Failed to get signed URL for file.');
        await fetch(signed, { method: 'PUT', headers: { 'Content-Type': contentType }, body: newFile });
        fileUrl = extractObjectUrl(signed);
      }

      await api.patch('/assignments/update-assignment', {
        id,
        title,
        description,
        courseId,
        firstDeadline, // YYYY-MM-DD
        lastDeadline,  // YYYY-MM-DD
        assignmentFile: fileUrl,
        // totalMarks: totalMarks === '' ? undefined : Number(totalMarks),
      });

      router.replace('/view-assignments');
    } catch (e: any) {
      setError(e?.message || 'Failed to update assignment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
<main className="min-h-screen bg-[#F9FAFB] text-gray-800 dark:bg-slate-950 dark:text-slate-100 transition-colors">
  <div className="mb-4" />
  <button
    onClick={() => window.history.back()}
    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 hover:dark:text-slate-100 transition-colors"
  >
    <BiArrowBack size={18} />
  </button>

  {/* Header */}
  <PageHeader
    title="Update Assignment"
    description="Modify assignment details and attachment"
  />

  <form onSubmit={handleSubmit} className="px-6 pb-10">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left */}
      <div className="lg:col-span-2 bg-white p-6 rounded-md shadow border border-gray-200 dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100 transition-colors">
          Assignment Details
        </h2>

        <div className="mb-4">
          <label className="block font-medium text-sm mb-1 text-gray-700 dark:text-slate-200 transition-colors">
            Title
          </label>
          <input
            type="text"
            className="w-full rounded px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-indigo-400/50 transition-colors"
            placeholder="Weekly Quiz 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium text-sm mb-1 text-gray-700 dark:text-slate-200 transition-colors">
            Course
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-indigo-400/50 transition-colors"
          >
            <option value="">{loadingCourses ? 'Loading…' : 'Select course'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block font-medium text-sm mb-1 text-gray-700 dark:text-slate-200 transition-colors">
              Deadline (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={firstDeadline}
              onChange={(e) => setFirstDeadline(e.target.value)}
              className="w-full rounded px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-indigo-400/50 transition-colors"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-medium text-sm mb-1 text-gray-700 dark:text-slate-200 transition-colors">
            Description
          </label>
          <textarea
            className="w-full rounded px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-indigo-400/50 transition-colors"
            rows={4}
            placeholder="Enter assignment description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-rose-400 mb-3 transition-colors">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded text-white font-semibold flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-[opacity,box-shadow]"
        >
          <Save size={18} /> {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Right: Current & New file */}
      <div className="bg-white p-6 rounded-md shadow border border-gray-200 space-y-4 dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 transition-colors">
          Attachment
        </h2>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-slate-100 transition-colors">
              Current File
            </h3>
            {currentFileUrl ? (
              <a
                href={currentFileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400 transition-colors"
              >
                <LinkIcon size={14} /> Open
              </a>
            ) : (
              <span className="text-xs text-gray-400 dark:text-slate-500 transition-colors">None</span>
            )}
          </div>
          {currentFileUrl && /\.(pdf)$/i.test(currentFileUrl) ? (
            <iframe
              className="w-full aspect-video rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors"
              src={currentFileUrl}
            />
          ) : (
            <p className="text-xs text-gray-500 dark:text-slate-400 transition-colors">
              {currentFileUrl ? 'Preview not available. Use Open link.' : 'No file uploaded.'}
            </p>
          )}
        </div>

        <div className="border border-gray-200 rounded-md p-6 text-center dark:border-slate-700 transition-colors">
          <UploadCloud className="mx-auto text-gray-400 dark:text-slate-400" size={28} />
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 mb-4 transition-colors">
            Re-upload assignment file (optional)
          </p>
          <label className="cursor-pointer inline-block font-medium text-indigo-600 hover:underline dark:text-indigo-400 transition-colors">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setNewFile(e.target.files?.[0] || null)}
            />
            {newFile ? newFile.name : 'Choose File'}
          </label>
        </div>
      </div>
    </div>
  </form>
</main>


  );
}
