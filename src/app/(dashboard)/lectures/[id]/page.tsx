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
  const threshold = 140;
  const widthDelta = Math.abs(window.outerWidth - window.innerWidth);
  const heightDelta = Math.abs(window.outerHeight - window.innerHeight);
  if (widthDelta > threshold || heightDelta > threshold) return true;

  const start = performance.now();
  try {
    // @ts-ignore
    Function('')();
  } catch {}
  const elapsed = performance.now() - start;
  return elapsed > 100;
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

  // ---- Playback rate state / controls ----
  const [rate, setRate] = useState<number>(1);
  const speeds = [0.5, 1, 1.25, 1.5, 2];

  const applyPlaybackRate = (r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
  };

  // Keep UI in sync if playbackRate changes from elsewhere
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onRate = () => setRate(v.playbackRate || 1);
    v.addEventListener('ratechange', onRate);
    return () => v.removeEventListener('ratechange', onRate);
  }, [videoRef.current]);

  // Initialize current rate once metadata is ready
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setRate(v.playbackRate || 1);
  };

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

  // DevTools guard
  useEffect(() => {
    const check = () => {
      const open = isDevtoolsLikelyOpen();
      setDevtoolsOpen(open);
      if (open && videoRef.current) {
        try { videoRef.current.pause(); } catch {}
      }
    };

    check();

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

  // simple tab list (if you render tabs elsewhere)
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
        className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${
          devtoolsOpen ? 'pointer-events-none select-none' : ''
        }`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* DevTools overlay blocker */}
        {devtoolsOpen && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow p-5 text-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Developer Tools Detected
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                For content protection, viewing is disabled while browser developer tools are open.
                Please close DevTools and return to the page.
              </p>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className={`max-w-5xl mx-auto p-4 sm:p-6 ${devtoolsOpen ? 'blur-sm' : ''}`}>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-4 hover:underline hover:text-slate-900 dark:hover:text-white pointer-events-auto"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {detail?.title || 'Lecture'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {detail?.createdAt ? new Date(detail.createdAt).toLocaleString() : ''}
                </p>
              </div>
            </div>

            {loading && <div className="text-sm text-slate-500 dark:text-slate-400">Loading…</div>}
            {err && <div className="text-sm text-red-600 dark:text-red-400">{err}</div>}

            {!loading && !err && detail && (
              <>
                {/* VIDEO */}
                {tab === 'video' && (
                  <div className="w-full">
                    {hasVideo ? (
                      <>
                        <video
                          ref={videoRef}
                          className="w-full max-h-[70vh] rounded border border-slate-200 dark:border-slate-800 bg-black"
                          controls
                          controlsList="nodownload noplaybackrate"  // hide native speed menu; keep download blocked
                          disablePictureInPicture
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                          onLoadedMetadata={handleLoadedMetadata}
                          src={detail.videoUrl}
                          playsInline
                        />

                        {/* Custom speed controls */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Speed:</span>
                          {speeds.map((s) => (
                            <button
                              key={s}
                              onClick={() => applyPlaybackRate(s)}
                              className={`px-2 py-1 rounded border text-xs
                                          border-slate-300 dark:border-slate-700
                                          hover:bg-slate-50 dark:hover:bg-slate-800
                                          ${
                                            rate === s
                                              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                                          }`}
                              aria-pressed={rate === s}
                            >
                              {s}x
                            </button>
                          ))}
                          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">(current: {rate.toFixed(2)}×)</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No video attached for this lecture.
                      </p>
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
                            className="w-full h-[70vh] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          />
                        ) : (
                          <div className="text-sm">
                            <p className="text-slate-600 dark:text-slate-300 mb-3">
                              This presentation cannot be embedded. Open it in a new tab:
                            </p>
                            <a
                              href={detail.presentationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded border
                                         border-slate-300 dark:border-slate-700
                                         bg-white dark:bg-slate-900
                                         text-slate-900 dark:text-slate-100
                                         hover:bg-slate-50 dark:hover:bg-slate-800"
                              onContextMenu={(e) => e.preventDefault()}
                            >
                              <FileText size={16} />
                              Open Presentation
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No presentation provided.</p>
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
