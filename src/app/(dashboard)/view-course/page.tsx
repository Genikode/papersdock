'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/lib/api';
import { PlusCircle, Edit2, Trash2, Save } from 'lucide-react';

/* =========================
   Types (match your API)
========================= */
type CourseItem = {
  id: string;
  title: string;
  fees?: string;
  createdAt?: string;
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
  // table state (server-driven)
  const [rows, setRows] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<null | CourseItem>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // add form
  const [addTitle, setAddTitle] = useState('');
  const [addFees, setAddFees] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // edit form
  const [editTitle, setEditTitle] = useState('');
  const [editFees, setEditFees] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  /* fetch list */
  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await api.get<CoursesResponse>('/courses/get-all-courses', {
        page: currentPage,
        limit: itemsPerPage, // the sample shows limit=2; we pass the actual per-page the user selects
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm]);

  /* table rows with S.No (do not show ID) */
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
        render: (v?: string) => (v ? `PKR${v}` : '—'),
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
                setShowEdit(row as CourseItem);
                setEditTitle((row as CourseItem).title || '');
                setEditFees((row as CourseItem).fees || '');
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
        fees: (addFees || '').trim() || undefined,
      });
      setShowAdd(false);
      setAddTitle('');
      setAddFees('');
      // refresh (back to page 1 to show newly added on top if backend orders that way)
      setCurrentPage(1);
      fetchCourses();
    } catch (err: any) {
      setAddError(err?.message || 'Failed to create course');
    } finally {
      setSavingAdd(false);
    }
  }

  /* update course (per your body only needs title) */
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
        fees: (editFees || '').trim() || undefined,
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
      // if last on page, go back one page
      if (rows.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchCourses();
      }
    } catch {
      setDeleteId(null);
    }
  }

  /* toolbar: just the Add button (search stays in TableComponent) */
  const toolbarLeft = (
    <div className="w-full flex flex-wrap items-center gap-2">
      <button
        onClick={() => {
          setShowAdd(true);
          setAddError(null);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded border hover:bg-gray-50 text-sm"
      >
        <PlusCircle size={16} />
        Add Course
      </button>
    </div>
  );

  return (
    <main className="bg-[#F9FAFB] min-h-screen p-4 sm:p-6 text-gray-800">
      <PageHeader title="Courses" description="Create, update, and manage courses" />

      <div className="bg-white rounded-md shadow-md">
        {loading && <p className="px-4 py-2 text-sm text-gray-500">Loading courses…</p>}
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

      {/* Add Course Modal */}
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
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fees</label>
              <input
                type="text"
                value={addFees}
                onChange={(e) => setAddFees(e.target.value)}
                placeholder="e.g. 99"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <button
              type="submit"
              disabled={savingAdd}
              className="w-full bg-gray-900 text-white rounded py-2 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save size={16} />
              {savingAdd ? 'Saving…' : 'Save Course'}
            </button>
          </form>
        </Modal>
      )}

      {/* Edit Course Modal */}
      {showEdit && (
        <Modal title="Update Course" onClose={() => setShowEdit(null)}>
          <form onSubmit={handleEditCourse} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Updated title"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              {/* Intentionally not editing fees here to match your PATCH body spec */}
                     <div>
              <label className="block text-sm font-medium mb-1">Fees</label>
              <input
                type="text"
                value={editFees}
                onChange={(e) => setEditFees(e.target.value)}
                placeholder="e.g. 99"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            </div>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <button
              type="submit"
              disabled={savingEdit}
              className="w-full bg-gray-900 text-white rounded py-2 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
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
