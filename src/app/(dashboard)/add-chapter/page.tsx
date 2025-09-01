'use client';

import { useEffect, useMemo, useState } from 'react';
import { UploadCloud, Save, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface CourseItem {
  id: string;
  title: string;
  fees?: string;
}

interface CoursesResponse {
  status: number;
  success: boolean;
  message: string;
  data: Array<CourseItem>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface SignedUrlResponse {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string; // presigned PUT url
}

export default function AddChapter() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [attachmentExtension, setAttachmentExtension] = useState('png');

  const [courses, setCourses] = useState<Array<CourseItem>>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --------------------------- load courses (robust) --------------------------- */
  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const res = await api.get<CoursesResponse>('/courses/get-all-courses', { page: 1, limit: 50 });
        // Some api clients return { data }, some return the body directly. Handle both.
        const body: any = res as any;
        const list: CourseItem[] =
          Array.isArray(body?.data) ? body.data :
          Array.isArray(body?.data?.data) ? body.data.data :
          [];
        setCourses(list);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  /* --------------------------- helpers --------------------------- */
  const attachmentOptions = useMemo(
    () => ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'],
    []
  );

  function inferExtensionFromFilename(name: string): string | null {
    const match = name.split('.').pop();
    if (!match) return null;
    return match.toLowerCase();
  }

  function inferExtensionFromMime(mime: string): string | null {
    if (!mime) return null;
    const map: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'image/png': 'png',
      'image/jpeg': 'jpg',
    };
    return map[mime] || null;
  }

  function sanitizeKeyPart(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')  // keep letters/numbers/dot/dash
      .replace(/-+/g, '-')           // collapse dashes
      .replace(/^-|-$/g, '');        // trim leading/trailing dashes
  }

  function deriveContentType(file: File, fallbackExt: string): string {
    if (file.type) return file.type;
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    return map[fallbackExt] || 'application/octet-stream';
  }

  function extractObjectUrl(presignedUrl: string): string {
    // Remove the querystring from the presigned URL to get the stable object URL
    return presignedUrl.split('?')[0];
  }

  /* --------------------------- file change --------------------------- */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] || null;
    setFile(nextFile);
    if (nextFile) {
      const inferredExt =
        inferExtensionFromFilename(nextFile.name) ||
        inferExtensionFromMime(nextFile.type) ||
        'pdf';
      setAttachmentExtension(inferredExt);
    }
  };

  /* --------------------------- submit --------------------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a chapter title.');
      return;
    }
    if (!courseId) {
      setError('Please select a course.');
      return;
    }
    if (!file) {
      setError('Please upload an attachment.');
      return;
    }

    setSubmitting(true);
    try {
      // Build a safe key for storage
      const cleanedName = sanitizeKeyPart(file.name) || `file.${attachmentExtension}`;
      const timestamp = Date.now();
      const key = `chapters/${timestamp}-${cleanedName}`;
      const contentType = deriveContentType(file, attachmentExtension);

      // 1) Get presigned PUT URL from backend
      const signed = await api.post<SignedUrlResponse>('/get-signed-url', { key, contentType });
      const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
      if (!signedUrl) throw new Error('Failed to get signed URL');

     
      const objectUrl = extractObjectUrl(signedUrl);

      

      // 2) Upload binary to storage via PUT
      await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file,
      })
     

      // 3) Use the object URL (without the query) as the persistent attachment URL
      const attachmentUrl = extractObjectUrl(objectUrl);

      // 4) Create chapter with persistent URL + extension
      await api.post('/chapters/create-chapter', {
        title,
        courseId,
        chapterImageUrl: attachmentUrl,       // <— persistent URL (no query)
        attachmentExtension,                  // keep extension you inferred/selected
      });

      router.replace('/view-chapter');
    } catch (e: any) {
      console.error('Create chapter error', e);
      setError(e?.message || 'Failed to create chapter');
    } finally {
      setSubmitting(false);
    }
  }

  /* --------------------------- UI --------------------------- */
  return (
    <main className="bg-[#F9FAFB] min-h-screen px-6 py-6">
           <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-700 mb-4 hover:underline"
        >
          <ArrowLeft size={16} /> Back
        </button>
      <h1 className="text-2xl font-bold text-gray-900">Add Chapter</h1>
      <p className="text-sm text-gray-600 mb-6">Create and upload chapter</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow px-6 py-6 max-w-3xl w-full">
        <h2 className="text-lg font-semibold mb-4">Chapter Details</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chapter title"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">{loadingCourses ? 'Loading courses…' : 'Select Course'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

       

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Upload Attachment</label>
          <div className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Choose a file to upload</p>
            <label className="cursor-pointer text-sm font-medium text-indigo-600">
              <input type="file" onChange={onFileChange} className="hidden" />
              {file ? 'Change File' : 'Choose File'}
            </label>
            {file && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium py-2 rounded-md flex justify-center items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {submitting ? 'Saving…' : 'Save Chapter'}
        </button>
      </form>
    </main>
  );
}
