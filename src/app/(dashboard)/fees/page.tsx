'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { api } from '@/lib/api';
import { Download, Trash2, UploadCloud, CreditCard, CalendarDays, FileText, ChevronRight } from 'lucide-react';

/* ---------------- Types from API ---------------- */
type FeeHistoryItem = {
  id: string;
  month: number; // 1..12
  year: string; // "2025"
  invoiceUrl?: string;
  feeExpiryDate?: string;
  dueDate?: string;
  status: 'Paid' | 'Pending' | 'Rejected' | string;
  feesAmount?: string;
  approvedAt?: string;
};

type FeeHistoryResponse = {
  status: number;
  success: boolean;
  message: string;
  data: FeeHistoryItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type SignedUrlResponse = {
  status: number;
  success: boolean;
  message: string;
  signedUrl: string;
};

/* ---------------- Helpers ---------------- */
const MONTH_LABEL = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function isPast(year: number, month: number) {
  const now = new Date();
  const end = new Date(year, month, 0); // last day of given month
  return end.getTime() < now.getTime();
}

function sanitizeKeyPart(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferExt(file: File): string {
  const byName = file.name.split('.').pop()?.toLowerCase();
  if (byName) return byName;
  const t = file.type;
  if (t === 'application/pdf') return 'pdf';
  if (t.startsWith('image/')) return t.split('/')[1];
  return 'bin';
}

function contentTypeForExt(ext: string) {
  const m: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return m[ext] || 'application/octet-stream';
}

function badgeClasses(status: string) {
  if (status === 'Paid') return 'bg-green-100 text-green-800 ring-1 ring-green-200';
  if (status === 'Rejected') return 'bg-red-100 text-red-800 ring-1 ring-red-200';
  if (status === 'Pending') return 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200';
  if (status === 'Upcoming') return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

function fmtDate(d?: string) {
  if (!d) return undefined;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

/* ---------------- Page ---------------- */
export default function StudentFeesPage() {
  // Academic window: Aug..Dec (2025) then Jan..Jun (2026)
  const START_YEAR = 2025;
  const SECOND_YEAR = START_YEAR + 1;

  const academicMonths = useMemo(
    () => [
      ...[8, 9, 10, 11, 12].map((m) => ({ year: START_YEAR, month: m })), // 2025
      ...[1, 2, 3, 4, 5, 6].map((m) => ({ year: SECOND_YEAR, month: m })), // 2026
    ],
    []
  );

  // data
  const [mapByYM, setMapByYM] = useState<Record<string, FeeHistoryItem>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // search + pagination (client-side)
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // viewer
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  // upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ month: number; year: number; existingId?: string }>({ month: 0, year: 0 });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // paying state
  const [payingKey, setPayingKey] = useState<string | null>(null);

  async function loadYear(y: number) {
    const res = await api.get<FeeHistoryResponse>(`/fee/get-fee-history/${y}`, { page: 1, limit: 100 });
    return res.data ?? [];
  }

  async function refresh() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [y1, y2] = await Promise.all([loadYear(START_YEAR), loadYear(SECOND_YEAR)]);
      const all = [...y1, ...y2];
      const map: Record<string, FeeHistoryItem> = {};
      all.forEach((item) => {
        const key = `${Number(item.year)}-${item.month}`;
        map[key] = item;
      });
      setMapByYM(map);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to load fee history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Build display rows (fill gaps as Upcoming/Pending)
  type Row = {
    monthLabel: string;
    month: number;
    year: number;
    status: string;
    amount: string;
    invoiceUrl?: string;
    id?: string;
    dueDate?: string;
    feeExpiryDate?: string;
  };

  const rows: Row[] = useMemo(() => {
    return academicMonths.map(({ year, month }) => {
      const key = `${year}-${month}`;
      const it = mapByYM[key];
      if (it) {
        return {
          month,
          year,
          monthLabel: MONTH_LABEL[month],
          status: it.status || '-',
          amount: it.feesAmount ? ` ${it.feesAmount}` : '-',
          invoiceUrl: it.invoiceUrl,
          id: it.id,
          dueDate: it.dueDate,
          feeExpiryDate: it.feeExpiryDate,
        };
      }
      const computed = isPast(year, month) ? 'Pending' : 'Upcoming';
      return { month, year, monthLabel: MONTH_LABEL[month], status: computed, amount: '-' };
    });
  }, [academicMonths, mapByYM]);

  // Apply search (by month label or status)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.monthLabel.toLowerCase().includes(q) || r.status.toLowerCase().includes(q));
  }, [rows, search]);

  // Pagination (client)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  /* ---------- Upload invoice flow ---------- */
  function openUpload(row: Row) {
    setUploadTarget({ month: row.month, year: row.year, existingId: row.id });
    setUploadFile(null);
    setUploadOpen(true);
    setInfoMsg(null);
    setErrorMsg(null);
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !uploadTarget.month || !uploadTarget.year) return;

    setUploading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      // 1) presign
      const ext = inferExt(uploadFile);
      const key = `fee/invoices/${uploadTarget.year}-${String(uploadTarget.month).padStart(2, '0')}-${Date.now()}-${sanitizeKeyPart(uploadFile.name)}`;
      const contentType = contentTypeForExt(ext);
      const signed = await api.post<SignedUrlResponse>('/get-signed-url', { key, contentType });
      const signedUrl = (signed as any)?.signedUrl ?? (signed as any)?.data?.signedUrl;
      if (!signedUrl) throw new Error('Failed to get signed URL');

      // 2) upload
      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: uploadFile,
      });
      const objectUrl = signedUrl.split('?')[0];

      // 3) notify backend
      await api.post('/fee/upload-fee-invoice', {
        month: String(uploadTarget.month),
        year: String(uploadTarget.year),
        invoiceUrl: objectUrl,
      });

      setUploadOpen(false);
      setInfoMsg('Invoice uploaded successfully.');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to upload invoice');
    } finally {
      setUploading(false);
    }
  }

  /* ---------- Delete invoice flow ---------- */
  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await api.delete(`/fee/delete-fee-invoice/${deleteId}`);
      setDeleteId(null);
      setInfoMsg('Invoice deleted.');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  }

  /* ---------- Pay (NTL) online ---------- */
  async function handlePay(row: Row) {
    const key = `${row.year}-${row.month}`;
    setPayingKey(key);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await api.post<{ status: number; success: boolean; message: string; redirectUrl?: string }>(
        '/payments/pay-fee',
        { month: row.month, year: row.year }
      );
      const redirectUrl = (res as any)?.redirectUrl ?? (res as any)?.data?.redirectUrl ?? undefined;

      if (Number((res as any)?.status) === 200 && redirectUrl) {
        window.location.href = redirectUrl; // same tab
        return;
      }
      throw new Error((res as any)?.message || 'Failed to start payment');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Payment initiation failed.');
    } finally {
      setPayingKey(null);
    }
  }

  return (
    <main className="bg-[#F9FAFB] min-h-screen p-6 text-gray-800">
      <PageHeader title="Fee Records" description="Manage and track your fee payments" />

      {/* Alerts */}
      {(errorMsg || infoMsg) && (
        <div
          className={`mb-3 text-sm px-3 py-2 rounded border ${errorMsg ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
        >
          {errorMsg || infoMsg}
        </div>
      )}

      {/* Search */}
      <div className="flex justify-end mb-3">
        <input
          placeholder="Search months or status..."
          className="border rounded px-3 py-2 text-sm w-full sm:w-80"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Cards Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && (
          Array.from({ length: perPage }).map((_, i) => (
            <div key={`sk-${i}`} className="rounded-lg border bg-white p-4 animate-pulse">
              <div className="h-5 w-36 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
              <div className="mt-4 h-24 rounded bg-slate-100" />
              <div className="mt-3 flex gap-2">
                <div className="h-9 w-24 rounded bg-slate-200" />
                <div className="h-9 w-28 rounded bg-slate-200" />
              </div>
            </div>
          ))
        )}

        {!loading && paginated.map((r) => {
          const rowKey = `${r.year}-${r.month}`;
          const canSubmit = r.status !== 'Paid';
          const canDelete = !!r.id && !!r.invoiceUrl && r.status !== 'Paid';
          const canPayOnline = r.status !== 'Paid';

          const due = fmtDate(r.dueDate);
          const exp = fmtDate(r.feeExpiryDate);

          return (
            <div key={rowKey} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_#eceef1]">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <CalendarDays size={18} />
                    <h3 className="text-base font-semibold">
                      {r.monthLabel} <span className="text-slate-500">{r.year}</span>
                    </h3>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                    {due && (
                      <span title="Due Date" className="inline-flex items-center gap-1">
                        <FileText size={14} /> Due {due}
                      </span>
                    )}
                    {exp && <span>• Expires {exp}</span>}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${badgeClasses(r.status)}`}>{r.status}</span>
              </div>

              {/* Content */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="mt-0.5 font-medium">{r.amount === '-' ? '-' : `PKR${r.amount}`}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Invoice</div>
                  <div className="mt-0.5 font-medium">
                    {r.invoiceUrl ? 'Uploaded' : '—'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 grid grid-cols-2 gap-2 items-center sm:flex sm:flex-wrap">
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 w-full sm:w-auto"
                  onClick={() => handlePay(r)}
                  disabled={!canPayOnline || payingKey === rowKey}
                  title={canPayOnline ? 'Pay online' : 'Already paid'}
                >
                  <CreditCard size={16} />
                  {payingKey === rowKey ? 'Redirecting…' : 'Pay Now'}
                </button>

                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50 w-full sm:w-auto"
                  onClick={() => openUpload(r)}
                  disabled={!canSubmit}
                  title={canSubmit ? (r.invoiceUrl ? 'Replace invoice' : 'Submit invoice') : 'Already paid'}
                >
                  <UploadCloud size={16} />
                  {r.invoiceUrl && canSubmit ? 'Replace Invoice' : 'Submit Invoice'}
                </button>

                {r.invoiceUrl && (
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50 w-full sm:w-auto"
                    onClick={() => setInvoiceUrl(r.invoiceUrl!)}
                  >
                    <Download size={16} /> View
                  </button>
                )}

              
              </div>

              {/* Learn more / chevron for visual affordance on mobile */}
         
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!loading && paginated.length === 0 && (
        <div className="mt-6 rounded-lg border bg-white p-6 text-center text-sm text-slate-600">
          No records match your search.
        </div>
      )}

      {/* Footer: page size + pager */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <select
            className="border rounded px-2 py-1"
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>items</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            &lt; Previous
          </button>
          <span className="px-2 py-1 border rounded bg-white">{page}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next &gt;
          </button>
        </div>
      </div>

      {/* Invoice preview (PDF/image fallback) */}
      {invoiceUrl && (
        <Modal title="Invoice" onClose={() => setInvoiceUrl(null)}>
          <div className="p-3">
            <div className="h-[70vh]">
              <object data={invoiceUrl} type="application/pdf" className="w-full h-full">
                <iframe src={invoiceUrl} className="w-full h-full" title="invoice" />
              </object>
            </div>
            <div className="mt-2 text-right">
              <a href={invoiceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-sm">
                Open in new tab
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload modal */}
      {uploadOpen && (
        <Modal title={`Submit Invoice — ${MONTH_LABEL[uploadTarget.month]} ${uploadTarget.year}`} onClose={() => setUploadOpen(false)}>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="border rounded p-4 text-center">
              <UploadCloud className="mx-auto text-gray-400" size={28} />
              <p className="text-sm text-gray-600 mt-2 mb-3">Upload a PDF or image (PNG/JPG/WEBP)</p>
              <label className="cursor-pointer inline-block text-indigo-600 font-medium">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile ? uploadFile.name : 'Choose File'}
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setUploadOpen(false)} className="px-4 py-1.5 border rounded">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="px-4 py-1.5 rounded text-white bg-[#0B1537] disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : uploadTarget.existingId ? 'Replace Invoice' : 'Submit Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal title="Delete Invoice" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete this invoice?</p>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-1.5 border rounded" onClick={() => setDeleteId(null)}>
              Cancel
            </button>
            <button className="px-4 py-1.5 rounded text-white bg-red-600 disabled:opacity-50" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
