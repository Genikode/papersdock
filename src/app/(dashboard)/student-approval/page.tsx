'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/lib/api';
import { CheckCircle } from 'lucide-react';

/* =========================
   API Types
========================= */
type UserApiItem = {
  id: string;
  name: string;
  email: string;
  contact?: string;
  isApproved: 'Y' | 'N';
  isFeesPaid: 'Y' | 'N';
  isSecurityBypassed?: 'Y' | 'N';
  isBlocked: 'Y' | 'N';
  allowedCourses: string; // JSON string array of courseIds
  roleName: string;
};

type UsersResponse = {
  status: number;
  success: boolean;
  message: string;
  data: UserApiItem[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
};

type CourseItem = { id: string; title: string };
type CoursesResponse = {
  status: number;
  success: boolean;
  message: string;
  data: CourseItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

/* =========================
   Helpers
========================= */
function parseAllowedCourses(jsonStr?: string): string[] {
  if (!jsonStr) return [];
  try {
    const arr = JSON.parse(jsonStr);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/* =========================
           Page
========================= */
export default function StudentApprovalPage() {
  // filters
  const [approvedFilter, setApprovedFilter] = useState<'' | 'Y' | 'N'>('');
  const [feesFilter, setFeesFilter] = useState<'' | 'Y' | 'N'>('');
  const [courseFilter, setCourseFilter] = useState<string>(''); // courseId

  // search + pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  // data (master list from server; we'll apply course filter client-side)
  const [serverRows, setServerRows] = useState<UserApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  // courses (fetch all pages with page=1&limit=2)
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // modals
  const [makeFreeId, setMakeFreeId] = useState<string | null>(null);
  const [accessUser, setAccessUser] = useState<UserApiItem | null>(null);
  const [accessSelections, setAccessSelections] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);

  // Build id -> title map
  const courseMap = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c.title])),
    [courses]
  );

  /* Load ALL courses using page=1&limit=2 (iterate totalPages) */
  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const LIMIT = 2;
        const first = await api.get<CoursesResponse>('/courses/get-all-courses', {
          page: 1,
          limit: LIMIT,
        });

        const all: CourseItem[] = [...(first.data || [])];
        const totalPages = first.pagination?.totalPages ?? 1;

        for (let p = 2; p <= totalPages; p++) {
          const res = await api.get<CoursesResponse>('/courses/get-all-courses', {
            page: p,
            limit: LIMIT,
          });
          if (Array.isArray(res.data)) all.push(...res.data);
        }

        setCourses(all);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  /* Fetch users from server (no courseId filter here; backend likely ignores it) */
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get<UsersResponse>('/users/get-all-users', {
        isBlocked: 'N',
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        isApproved: approvedFilter || undefined,
        isFeesPaid: feesFilter || undefined,
      });

      const list = res.data || [];
      setServerRows(list);

      // total from server (before our local course filter)
      setTotalItems(res.pagination?.total ?? list.length);
    } catch {
      setServerRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedFilter, feesFilter, searchTerm, currentPage, itemsPerPage]);

  /* Apply course filter CLIENT-SIDE */
  const filteredByCourse = useMemo(() => {
    if (!courseFilter) return serverRows;
    return serverRows.filter((u) => {
      const ids = parseAllowedCourses(u.allowedCourses);
      return ids.includes(courseFilter);
    });
  }, [serverRows, courseFilter]);

  /* Derive table data with S.No AFTER local course filter */
  const tableData = useMemo(
    () =>
      filteredByCourse.map((u, idx) => ({
        ...u,
        sNo: (currentPage - 1) * itemsPerPage + idx + 1,
      })),
    [filteredByCourse, currentPage, itemsPerPage]
  );

  /* Adjust the visible total to reflect local course filter */
  const visibleTotal = filteredByCourse.length;

  /* Actions */
  async function makeStudentFree(id: string) {
    try {
      await api.patch(`/fee/make-student-free/${id}`);
      setMakeFreeId(null);
      fetchUsers();
    } catch {
      setMakeFreeId(null);
    }
  }

  function openAccessModal(user: UserApiItem) {
    setAccessUser(user);
    setAccessSelections(parseAllowedCourses(user.allowedCourses));
  }

  function toggleCourseInAccess(id: string) {
    setAccessSelections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function saveCourseAccess() {
    if (!accessUser) return;
    setSavingAccess(true);
    try {
      await api.patch(`/fee/allow-courses/${accessUser.id}`, {
        courseIds: accessSelections,
      });
      setAccessUser(null);
      setAccessSelections([]);
      fetchUsers();
    } catch {
      // keep modal open if fails
    } finally {
      setSavingAccess(false);
    }
  }

  /* Columns */
  const columns: TableColumn[] = useMemo<TableColumn[]>(
    () => [
      { header: 'S.No', accessor: 'sNo' },
      { header: 'Name', accessor: 'name' },
      { header: 'Email', accessor: 'email' },
      { header: 'Contact', accessor: 'contact' },
      {
        header: 'Approved',
        accessor: 'isApproved',
        render: (v: 'Y' | 'N') => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              v === 'Y' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {v === 'Y' ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        header: 'Fees Paid',
        accessor: 'isFeesPaid',
        render: (v: 'Y' | 'N') => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              v === 'Y' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {v === 'Y' ? 'Paid' : 'Unpaid'}
          </span>
        ),
      },
      {
        header: 'Courses',
        accessor: 'allowedCourses',
        render: (v: string) => {
          const ids = parseAllowedCourses(v);
          if (!ids.length) return <span className="text-xs text-gray-400">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {ids.map((id) => (
                <span key={id} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                  {courseMap[id] ?? id}
                </span>
              ))}
            </div>
          );
        },
      },
      { header: 'Role', accessor: 'roleName' },
      {
        header: 'Action',
        accessor: 'actions',
        render: (_: any, row: UserApiItem) => (
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-gray-50"
              onClick={() => openAccessModal(row)}
            >
              🎓 Access
            </button>
            {row.isFeesPaid === 'N' ? (
              <button
                className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-green-50"
                onClick={() => setMakeFreeId(row.id)}
                title="Make student free"
              >
                <CheckCircle size={14} /> Make Free
              </button>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        ),
      },
    ],
    [courseMap]
  );

  /* Toolbar with filters + search */
  const toolbarLeft = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-gray-600">Approved</label>
      <select
        value={approvedFilter}
        onChange={(e) => {
          setApprovedFilter(e.target.value as '' | 'Y' | 'N');
          setCurrentPage(1);
        }}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">All</option>
        <option value="Y">Yes</option>
        <option value="N">No</option>
      </select>

      <label className="text-sm text-gray-600 ml-1">Fees</label>
      <select
        value={feesFilter}
        onChange={(e) => {
          setFeesFilter(e.target.value as '' | 'Y' | 'N');
          setCurrentPage(1);
        }}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">All</option>
        <option value="Y">Paid</option>
        <option value="N">Unpaid</option>
      </select>

      <label className="text-sm text-gray-600 ml-1">Course</label>
      <select
        value={courseFilter}
        onChange={(e) => {
          setCourseFilter(e.target.value);
          setCurrentPage(1);
        }}
        className="border rounded px-2 py-1 text-sm min-w-[180px]"
      >
        <option value="">{loadingCourses ? 'Loading…' : 'All courses'}</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>

      <input
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search students…"
        className="border rounded px-3 py-1 text-sm ml-2 w-56"
      />
    </div>
  );

  return (
    <main className="bg-[#F9FAFB] p-6 text-gray-800">
      <PageHeader title="Student Approval" description="Review students, grant access, and mark fee exemptions" />

      <div className="bg-white rounded-md shadow-md">
        {loading && <p className="px-4 py-2 text-sm text-gray-500">Loading students…</p>}

        <TableComponent
          columns={columns}
          data={tableData}
          serverMode
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
          /* show the count that matches the course filter */
          totalItems={visibleTotal}
          toolbarLeft={toolbarLeft}
          hideSearch
          searchTerm={searchTerm}
          onSearchTermChange={(v) => {
            setSearchTerm(v);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Confirm Make Free */}
      {makeFreeId && (
        <ConfirmationModal
          title="Make Student Free"
          description="This will mark the student as fee-exempt for billing. Continue?"
          onCancel={() => setMakeFreeId(null)}
          onConfirm={() => makeStudentFree(makeFreeId)}
        />
      )}

      {/* Give Course Access Modal */}
      {accessUser && (
        <Modal title={`Give Course Access — ${accessUser.name}`} onClose={() => setAccessUser(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Select courses to allow for this student. Current selections are pre-checked.
            </p>
            <div className="max-h-72 overflow-auto border rounded p-3">
              {courses.length === 0 && <p className="text-sm text-gray-500">No courses found.</p>}
              {courses.map((c) => {
                const checked = accessSelections.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCourseInAccess(c.id)}
                    />
                    <span className="text-sm">{c.title}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="px-3 py-1 border rounded" onClick={() => setAccessUser(null)}>
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded text-white bg-indigo-600 disabled:opacity-60"
                onClick={saveCourseAccess}
                disabled={savingAccess}
              >
                {savingAccess ? 'Saving…' : 'Save Access'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
