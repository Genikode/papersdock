'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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
  data: LectureDetail | LectureDetail[];
};

function normalizeDetail(data: GetByIdResponse['data']): LectureDetail | null {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data as LectureDetail;
}

/** Heuristic devtools detector (no deps). */
function isDevtoolsLikelyOpen() {
  // Large delta often means docked DevTools is open (side/bottom).
  const threshold = 140; // tweak if needed
  const widthDelta = Math.abs(window.outerWidth - window.innerWidth);
  const heightDelta = Math.abs(window.outerHeight - window.innerHeight);
  if (widthDelta > threshold || heightDelta > threshold) return true;

  // Heads-up: undocked DevTools won't change outer vs inner. Add a small timing trick:
  const start = performance.now();
  // 'debugger;' slows a tiny bit more when devtools is open & paused/stepped
  // We won't actually pause—just a no-op try/catch to avoid halting.
  try {
    // @ts-ignore
    Function('')();
  } catch {}
  const elapsed = performance.now() - start;
  // If DevTools is doing heavy work, this sometimes spikes a bit
  return elapsed > 100; // conservative; keep small to avoid false positives
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
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);

  const hasVideo = Boolean(detail?.videoUrl);
  const hasPresentation = Boolean(detail?.presentationUrl);

  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Block right-click + common shortcuts
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (key === 'f12') { e.preventDefault(); e.stopPropagation(); }
      if (ctrlOrCmd && e.shiftKey && ['i','j','c'].includes(key)) { e.preventDefault(); e.stopPropagation(); }
      if (ctrlOrCmd && ['u','s','p'].includes(key)) { e.preventDefault(); e.stopPropagation(); }
    };
    const onDragStart = (e: DragEvent) => e.preventDefault();

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('dragstart', onDragStart);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('dragstart', onDragStart);
    };
  }, []);

  // DevTools guard: detect on entry, on visibility/focus, resize, route tab changes, and back/forward.
  useEffect(() => {
    const check = () => {
      const open = isDevtoolsLikelyOpen();
      setDevtoolsOpen(open);
      if (open && videoRef.current) {
        try { videoRef.current.pause(); } catch {}
      }
    };

    check(); // initial (covers coming back from another page with DevTools already open)

    const onVisibility = () => document.visibilityState === 'visible' && check();
    const onFocus = () => check();
    const onResize = () => check();
    const onPageShow = () => check();
    const onPopState = () => check();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('resize', onResize);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
    };
  }, [tab]);

  // simple tab nav
  const tabs = useMemo(() => {
    const base = [{ key: 'video', label: 'Video', icon: <Play size={14} /> }];
    if (hasPresentation) base.push({ key: 'presentation', label: 'Presentation', icon: <FileText size={14} /> });
    return base;
  }, [hasPresentation]);

  const setTab = (newTab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    router.replace(url.pathname + '?' + url.searchParams.toString());
  };

  return (
    <Suspense fallback={<div>Loading lectures...</div>}>
      <main
        className={`min-h-screen bg-gray-50 ${devtoolsOpen ? 'pointer-events-none select-none' : ''}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* DevTools overlay blocker */}
        {devtoolsOpen && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-xl border shadow p-5 text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Developer Tools Detected</h2>
              <p className="text-sm text-gray-600">
                For content protection, viewing is disabled while browser developer tools are open.
                Please close DevTools and return to the page.
              </p>
            </div>
          </div>
        )}

        {/* Main content (still rendered so state persists), visually blurred when blocked */}
        <div className={`max-w-5xl mx-auto p-4 sm:p-6 ${devtoolsOpen ? 'blur-sm' : ''}`}>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-700 mb-4 hover:underline pointer-events-auto"
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
            </div>

            {/* Tabs */}
         
            {loading && <div className="text-sm text-gray-500">Loading…</div>}
            {err && <div className="text-sm text-red-600">{err}</div>}

            {!loading && !err && detail && (
              <>
                {/* VIDEO */}
                {tab === 'video' && (
                  <div className="w-full">
                    {hasVideo ? (
                      <video
                        ref={videoRef}
                        className="w-full max-h-[70vh] rounded border bg-black"
                        controls
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
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
                        {/\.(pdf)(\?|$)/i.test(detail.presentationUrl) ? (
                          <iframe
                            sandbox="allow-scripts allow-same-origin"
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
                              onContextMenu={(e) => e.preventDefault()}
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
    </Suspense>
  );
}
