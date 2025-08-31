'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Mic,
  StopCircle,
  PlayCircle,
  X,
} from 'lucide-react';

type PaperKey = 'AS' | 'BS' | 'CS';

const PAPERS: Record<PaperKey, { label: string; chapters: string[] }> = {
  AS: { label: 'AS', chapters: ['A1', 'A2', 'A3', 'A4'] },
  BS: { label: 'BS', chapters: ['B1', 'B2', 'B3'] },
  CS: { label: 'CS', chapters: ['C1', 'C2'] },
};

export default function AddQueryPage() {
  // form state
  const [title, setTitle] = useState('');
  const [paper, setPaper] = useState<PaperKey | ''>('');
  const [chapter, setChapter] = useState('');
  const [details, setDetails] = useState('');

  // image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // audio choose/record
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // derived
  const chaptersForPaper = paper ? PAPERS[paper].chapters : [];
  const canSubmit = title.trim() && paper && chapter && details.trim();

  useEffect(() => {
    // clear chapter when paper changes
    setChapter('');
  }, [paper]);

  // ----- image handlers -----
  const onPickImage = (file?: File) => {
    const f = file ?? imageInputRef.current?.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return alert('Please choose an image file');
    setImageFile(f);
    const url = URL.createObjectURL(f);
    setImagePreview(url);
  };

  const onDropImage: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    onPickImage(f);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // ----- audio choose -----
  const onPickAudio = (file?: File) => {
    const f = file ?? null;
    if (!f) return;
    if (!f.type.startsWith('audio/')) return alert('Please choose an audio file');
    setAudioFile(f);
    const url = URL.createObjectURL(f);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(url);
  };

  // ----- audio record -----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `query-${Date.now()}.webm`, { type: blob.type });
        setAudioFile(file);
        const url = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      alert('Microphone permission denied or not available.');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const removeAudio = () => {
    setAudioFile(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  // ----- submit -----
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    // build form data for API
    const form = new FormData();
    form.append('title', title.trim());
    form.append('paper', paper);
    form.append('chapter', chapter);
    form.append('details', details.trim());
    if (imageFile) form.append('image', imageFile);
    if (audioFile) form.append('audio', audioFile);

    // TODO: call your API endpoint, e.g.:
    // const res = await fetch('/api/queries', { method: 'POST', body: form });
    // Handle response...

    alert('Submitted! (Wire this up to your API)');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Add Queries</h1>
        <p className="mt-1 text-sm text-slate-500">Add your query</p>

        <form
          onSubmit={onSubmit}
          className="mt-5 rounded-lg border bg-white p-4 sm:p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-slate-900">Query Details</h2>

          {/* Title */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Query Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter query title"
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ring-indigo-300 focus:ring-2"
            />
          </div>

          {/* Paper + Chapter */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Select Paper
              </label>
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value as PaperKey)}
                className="w-full appearance-none rounded-md border bg-white px-3 py-2 text-sm outline-none ring-indigo-300 focus:ring-2"
              >
                <option value="">Select the paper</option>
                {Object.entries(PAPERS).map(([key, v]) => (
                  <option key={key} value={key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Select Chapter
              </label>
              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                disabled={!paper}
                className="w-full appearance-none rounded-md border bg-white px-3 py-2 text-sm outline-none ring-indigo-300 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">{paper ? 'Select the chapter' : 'Choose paper first'}</option>
                {chaptersForPaper.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Details */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Write Details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter details of your question"
              rows={4}
              className="w-full resize-y rounded-md border bg-white px-3 py-2 text-sm outline-none ring-indigo-300 focus:ring-2"
            />
          </div>

          {/* Upload content */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Upload content</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Image box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={onDropImage}
                className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border bg-slate-50 p-4 text-center"
              >
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="h-28 w-40 rounded object-cover ring-1 ring-slate-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow ring-1 ring-slate-200"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="text-slate-400" size={24} />
                    <div className="text-sm font-medium text-slate-700">Upload image</div>
                    <div className="text-xs text-slate-500">PNG, JPG up to ~5MB</div>
                  </>
                )}

                <div className="mt-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={() => onPickImage()}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
                  >
                    <UploadCloud size={16} />
                    Choose Image
                  </button>
                </div>
              </div>

              {/* Audio box */}
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border bg-slate-50 p-4 text-center">
                {audioUrl ? (
                  <div className="flex items-center gap-2">
                    <audio src={audioUrl} controls className="max-w-[220px]" />
                    <button
                      type="button"
                      onClick={removeAudio}
                      className="rounded-full bg-white p-1 shadow ring-1 ring-slate-200"
                      aria-label="Remove audio"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Mic className="text-slate-400" size={24} />
                    <div className="text-sm font-medium text-slate-700">Upload audio</div>
                    <div className="text-xs text-slate-500">Choose or record audio</div>
                  </>
                )}

                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">
                    <UploadCloud size={16} />
                    <span>Choose Audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickAudio(f);
                      }}
                    />
                  </label>

                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
                    >
                      <Mic size={16} />
                      Record
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <StopCircle size={16} />
                      Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlayCircle size={16} />
              Upload Query
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
