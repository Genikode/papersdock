'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/lib/api';
import { PlusCircle, Edit2, Trash2, Save } from 'lucide-react';

/* =========================
   Month Name Helper
========================= */
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getMonthName = (num?: number) =>
  num && num >= 1 && num <= 12 ? monthNames[num - 1] : '—';

/* =========================
   Types
========================= */
type CourseItem = {
  id: string;
  title: string;
  fees?: string;
  createdAt?: string;
  startMonth?: number;
  endMonth?: number;
};

type CoursesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
           Page
========================= */
export default function CoursesPage() {
  // table state
  const [rows, setRows] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<null | CourseItem>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // add form
  const [addTitle, setAddTitle] = useState('');
  const [addFees, setAddFees] = useState('');
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endMonth, setEndMonth] = useState<number>(12);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // edit form
  const [editTitle, setEditTitle] = useState('');
  const [editFees, setEditFees] = useState('');
  const [editStartMonth, setEditStartMonth] = useState<number>(1);
  const [editEndMonth, setEditEndMonth] = useState<number>(12);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  /* fetch list */
  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await api.get<CoursesResponse>('/courses/get-all-courses', {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || '',
      });
      setRows(res.data || []);
      setTotalItems(res.pagination?.total ?? (res.data?.length ?? 0));
    } catch {
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, [currentPage, itemsPerPage, searchTerm]);

  /* table rows */
  const tableData = useMemo(
    () =>
      rows.map((r, idx) => ({
        ...r,
        sNo: (currentPage - 1) * itemsPerPage + idx + 1,
      })),
    [rows, currentPage, itemsPerPage]
  );

  /* columns */
  const columns: TableColumn[] = useMemo<TableColumn[]>(
    () => [
      { header: 'S.No', accessor: 'sNo' },
      { header: 'Title', accessor: 'title' },
      {
        header: 'Fees',
        accessor: 'fees',
        render: (v?: string) => (v ? `PKR ${v}` : '—'),
      },
      {
        header: 'Start Month',
        accessor: 'startMonth',
        render: (v?: number) => getMonthName(v),
      },
      {
        header: 'End Month',
        accessor: 'endMonth',
        render: (v?: number) => getMonthName(v),
      },
      {
        header: 'Actions',
        accessor: 'actions',
        render: (_: any, row: any) => (
          <div className="flex items-center gap-2">
            <button
              className="hover:text-blue-600"
              title="Update"
              onClick={() => {
                const item = row as CourseItem;
                setShowEdit(item);
                setEditTitle(item.title || '');
                setEditFees(item.fees || '');
                setEditStartMonth(item.startMonth || 1);
                setEditEndMonth(item.endMonth || 12);
                setEditError(null);
              }}
            >
              <Edit2 size={16} />
            </button>
            <button
              className="hover:text-red-600"
              title="Delete"
              onClick={() => setDeleteId((row as CourseItem).id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  /* add course */
  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!addTitle.trim()) {
      setAddError('Please enter a course title.');
      return;
    }
    setSavingAdd(true);
    try {
      await api.post('/courses/create-course', {
        title: addTitle.trim(),
        fees: addFees ? addFees.trim() : undefined,
        startMonth,
        endMonth,
      });
      setShowAdd(false);
      setAddTitle('');
      setAddFees('');
      setStartMonth(1);
      setEndMonth(12);
      setCurrentPage(1);
      fetchCourses();
    } catch (err: any) {
      setAddError(err?.message || 'Failed to create course');
    } finally {
      setSavingAdd(false);
    }
  }

  /* update course */
  async function handleEditCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!showEdit) return;
    setEditError(null);
    if (!editTitle.trim()) {
      setEditError('Please enter a course title.');
      return;
    }
    setSavingEdit(true);
    try {
      await api.patch(`/courses/update-course/${showEdit.id}`, {
        title: editTitle.trim(),
        fees: editFees ? Number(editFees) : undefined,
        startMonth: editStartMonth,
        endMonth: editEndMonth,
      });
      setShowEdit(null);
      fetchCourses();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update course');
    } finally {
      setSavingEdit(false);
    }
  }

  /* delete */
  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/courses/delete-course/${deleteId}`);
      setDeleteId(null);
      if (rows.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchCourses();
      }
    } catch {
      setDeleteId(null);
    }
  }

  /* toolbar */
  const toolbarLeft = (
    <div className="w-full flex flex-wrap items-center gap-2">
      <button
        onClick={() => {
          setShowAdd(true);
          setAddError(null);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm
                   border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900
                   text-slate-900 dark:text-slate-100
                   hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <PlusCircle size={16} />
        Add Course
      </button>
    </div>
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PageHeader title="Courses" description="Create, update, and manage courses" />

      <div className="rounded-md shadow-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {loading && (
          <p className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
            Loading courses…
          </p>
        )}
        <TableComponent
          columns={columns}
          data={tableData}
          serverMode
          toolbarLeft={toolbarLeft}
          searchTerm={searchTerm}
          onSearchTermChange={(v) => {
            setCurrentPage(1);
            setSearchTerm(v);
          }}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setCurrentPage(1);
            setItemsPerPage(n);
          }}
          totalItems={totalItems}
        />
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Course" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="e.g. Advanced Node.js Masterclass"
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fees</label>
              <input
                type="text"
                value={addFees}
                onChange={(e) => setAddFees(e.target.value)}
                placeholder="e.g. 99"
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Month</label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              >
                {monthNames.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Month</label>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              >
                {monthNames.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {addError && <p className="text-sm text-red-700">{addError}</p>}

            <button
              type="submit"
              disabled={savingAdd}
              className="w-full rounded py-2 text-sm inline-flex items-center justify-center gap-2
                         bg-slate-900 text-white hover:opacity-90 disabled:opacity-60
                         dark:bg-slate-100 dark:text-slate-900"
            >
              <Save size={16} />
              {savingAdd ? 'Saving…' : 'Save Course'}
            </button>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Update Course" onClose={() => setShowEdit(null)}>
          <form onSubmit={handleEditCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Updated title"
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fees</label>
              <input
                type="text"
                value={editFees}
                onChange={(e) => setEditFees(e.target.value)}
                placeholder="e.g. 99"
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Month</label>
              <select
                value={editStartMonth}
                onChange={(e) => setEditStartMonth(Number(e.target.value))}
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              >
                {monthNames.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Month</label>
              <select
                value={editEndMonth}
                onChange={(e) => setEditEndMonth(Number(e.target.value))}
                className="w-full rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              >
                {monthNames.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {editError && <p className="text-sm text-red-700">{editError}</p>}

            <button
              type="submit"
              disabled={savingEdit}
              className="w-full rounded py-2 text-sm inline-flex items-center justify-center gap-2
                         bg-slate-900 text-white hover:opacity-90 disabled:opacity-60
                         dark:bg-slate-100 dark:text-slate-900"
            >
              <Save size={16} />
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <ConfirmationModal
          title="Delete Course"
          description="Are you sure you want to delete this course?"
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}
    </main>
  );
}
