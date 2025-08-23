'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, FileText, Play } from 'lucide-react';

type LectureDetail = {
  id: string;
  title: string;
  courseId: string;
  chapterId: string;
  videoUrl: string;
  presentationUrl: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
};

type GetByIdResponse = {
  status: number;
  success: boolean;
  message: string;
  data: LectureDetail | LectureDetail[]; // your API sometimes returns array
};

function normalizeDetail(data: GetByIdResponse['data']): LectureDetail | null {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data as LectureDetail;
}

export default function LectureDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const qs = useSearchParams();

  const id = params?.id;
  const tab = qs?.get('tab') || 'video'; // 'video' | 'presentation'

  const [detail, setDetail] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasVideo = Boolean(detail?.videoUrl);
  const hasPresentation = Boolean(detail?.presentationUrl);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get<GetByIdResponse>(`/lectures/get-lecture/${id}`);
        setDetail(normalizeDetail(res.data));
      } catch (e: any) {
        setErr(e?.message || 'Failed to load lecture');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // simple tab nav builder
  const tabs = useMemo(() => {
    const base = [{ key: 'video', label: 'Video', icon: <Play size={14} /> }];
    if (hasPresentation) base.push({ key: 'presentation', label: 'Presentation', icon: <FileText size={14} /> });
    return base;
  }, [hasPresentation]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-700 mb-4 hover:underline"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="bg-white border rounded shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {detail?.title || 'Lecture'}
              </h1>
              <p className="text-xs text-gray-500">
                {detail?.createdAt ? new Date(detail.createdAt).toLocaleString() : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {tabs.map((t) => {
                const isActive = tab === t.key;
                const next = new URLSearchParams(qs?.toString());
                next.set('tab', t.key);
                return (
                  <a
                    key={t.key}
                    href={`?${next.toString()}`}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border
                                ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    {t.icon} {t.label}
                  </a>
                );
              })}
            </div>
          </div>

          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {err && <div className="text-sm text-red-600">{err}</div>}

          {/* Content */}
          {!loading && !err && detail && (
            <>
              {/* VIDEO */}
              {tab === 'video' && (
                <div className="w-full">
                  {hasVideo ? (
                    <video
                      className="w-full max-h-[70vh] rounded border bg-black"
                      controls
                      src={detail.videoUrl}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No video attached for this lecture.</p>
                  )}
                </div>
              )}

              {/* PRESENTATION */}
              {tab === 'presentation' && (
                <div className="w-full">
                  {hasPresentation ? (
                    <>
                      {/* Try to embed PDFs; for other types show a link */}
                      {/\.(pdf)(\?|$)/i.test(detail.presentationUrl) ? (
                        <iframe
                          src={detail.presentationUrl}
                          className="w-full h-[70vh] rounded border bg-white"
                        />
                      ) : (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-3">
                            This presentation cannot be embedded. Open it in a new tab:
                          </p>
                          <a
                            href={detail.presentationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-gray-50"
                          >
                            <FileText size={16} />
                            Open Presentation
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No presentation provided.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
