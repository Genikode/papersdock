'use client';

import React, { Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Download } from 'lucide-react';

/* ---------------- Helpers ---------------- */
const MONTH = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function monthName(n: number) {
  return MONTH[n] ?? String(n);
}

/* ------------- Wrapper to satisfy App Router (useSearchParams needs Suspense) ------------- */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F9FAFB] p-6">Loading…</main>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}

/* ---------------- Page (client) ---------------- */
function PaymentSuccessInner() {
  const router = useRouter();
  const qs = useSearchParams();

  // Read params (with a tolerant fallback for ?year2025)
  const studentId = qs.get('studentId') ?? '—';
  const monthNum = Number(qs.get('month')) || new Date().getMonth() + 1;

  let yearNum = Number(qs.get('year'));
  if (!yearNum) {
    // Tolerate a key like "year2025" (no '=' sign)
    for (const [k] of (qs as any).entries()) {
      const m = /^year(\d{4})$/.exec(k);
      if (m) {
        yearNum = Number(m[1]);
        break;
      }
    }
  }
  if (!yearNum) yearNum = new Date().getFullYear();

  // Optional params you might pass (e.g. amount, txnId)
  const amount = qs.get('amount') ?? '';
  const txnId = qs.get('txnId') ?? '';

  const paidAt = useMemo(() => new Date(), []);
  const invoiceNo = useMemo(
    () =>
      `INV-${String(yearNum).slice(-2)}${String(monthNum).padStart(2, '0')}-${(studentId || '')
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(-6)
        .toUpperCase()}-${paidAt.getTime().toString().slice(-5)}`,
    [studentId, monthNum, yearNum, paidAt]
  );

  const invoiceRef = useRef<HTMLDivElement>(null);

  /* ---------------- Download/Print Invoice ---------------- */
  const handleDownloadInvoice = () => {
    const html = invoiceRef.current?.innerHTML;
    const isMobileOrIpad = /Mobi|iPad/i.test(navigator.userAgent);
    const target = isMobileOrIpad ? '_self' : '_blank';

    if (!html) return;

    const w = window.open('', target);
    w?.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 24px; color: #111827; }
    .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 10px; padding: 24px; }
    .hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .brand { font-size: 18px; font-weight: 700; color: #111827; }
    .muted { color: #6B7280; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
    .box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #E5E7EB; }
    .right { text-align: right; }
    .total { font-weight: 700; }
    .foot { margin-top: 18px; font-size: 12px; color: #6B7280; }
    @media print {
      body { padding: 0; }
      .invoice { border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">${html}</div>
</body>
</html>`);
    w?.document.close();
    w?.focus();
    w?.print();
    // In some browsers, closing right after print is blocked; this is OK.
    try { w?.close(); } catch {}
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 text-green-700 p-2">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Payment Successful</h1>
              <p className="text-sm text-gray-500">
                Your payment for <span className="font-medium">{monthName(monthNum)} {yearNum}</span> was recorded.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <button
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Download size={16} /> Download Invoice
            </button>
          </div>

          {/* Visual confirmation / invoice preview */}
          <div ref={invoiceRef} className="mt-6">
            {/* Everything inside this wrapper becomes the PDF content */}
            <header className="flex items-center justify-between pb-4 border-b">
              <div>
                <div className="text-lg font-bold">Papers Dock</div>
                <div className="text-xs text-gray-500">papersdock.example</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">Invoice</div>
                <div className="text-xs text-gray-500">#{invoiceNo}</div>
              </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 rounded border p-3">
                <div className="text-xs text-gray-500">Billed To</div>
                <div className="text-sm font-medium mt-1 break-all">Student ID: {studentId}</div>
              </div>
              <div className="bg-gray-50 rounded border p-3">
                <div className="text-xs text-gray-500">Billing Period</div>
                <div className="text-sm font-medium mt-1">
                  {monthName(monthNum)} {yearNum}
                </div>
              </div>
            </section>

            <table className="w-full mt-4">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="text-left">Description</th>
                  <th className="right">Qty</th>
                  <th className="right">Price</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monthly Tuition Fee — {monthName(monthNum)} {yearNum}</td>
                  <td className="right">1</td>
                  <td className="right">{amount ? `$${amount}` : '-'}</td>
                  <td className="right">{amount ? `$${amount}` : '-'}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="right total">Total</td>
                  <td className="right total">{amount ? `$${amount}` : '-'}</td>
                </tr>
              </tbody>
            </table>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-50 rounded border p-3">
                <div className="text-xs text-gray-500">Payment Date</div>
                <div className="text-sm font-medium mt-1">
                  {paidAt.toLocaleDateString()} {paidAt.toLocaleTimeString()}
                </div>
              </div>
              <div className="bg-gray-50 rounded border p-3">
                <div className="text-xs text-gray-500">Transaction ID</div>
                <div className="text-sm font-medium mt-1">{txnId || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded border p-3">
                <div className="text-xs text-gray-500">Reference</div>
                <div className="text-sm font-medium mt-1">{invoiceNo}</div>
              </div>
            </section>

            <p className="mt-4 text-xs text-gray-500">
              This is a system-generated invoice for your records.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
