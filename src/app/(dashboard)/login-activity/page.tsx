'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import { api } from '@/lib/api';

/* =========================
   Types (match your API)
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
export default function LoginActivityPage() {
  const router = useRouter();

  // filters
  const [courseFilter, setCourseFilter] = useState<string>(''); // courseId

  // server-search + pagination
  const [searchTerm, setSearchTerm] = useState<string>(''); // TableComponent debounces this for us
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  // data (master list from server; we’ll apply course filter client-side)
  const [serverRows, setServerRows] = useState<UserApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  // courses (fetch all pages with page=1&limit=50)
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  /* Load ALL courses using page=1&limit=50 (iterate totalPages) */
  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const LIMIT = 50;
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

  /* Fetch users from server (filter to roleName === 'student'), server-mode search + pagination */
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get<UsersResponse>('/users/get-all-users', {
        isBlocked: 'N',
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined, // server-side search (debounced by TableComponent)
      });

      // Keep only students
      const students = (res.data || []).filter(
        (u) => (u.roleName || '').toLowerCase() === 'student'
      );

      setServerRows(students);
      setTotalItems(res.pagination?.total ?? students.length);
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
  }, [searchTerm, currentPage, itemsPerPage]);

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

  /* Columns */
  const columns: TableColumn[] = useMemo<TableColumn[]>(
    () => [
      { header: 'S.No', accessor: 'sNo' },
      { header: 'Username', accessor: 'name' },
      { header: 'User Email', accessor: 'email' },
      { header: 'Phone', accessor: 'contact' },
      {
        header: 'Action',
        accessor: 'actions',
        render: (_: any, row: UserApiItem) => (
          <button
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border
                       bg-white dark:bg-slate-900
                       border-slate-300 dark:border-slate-700
                       text-slate-800 dark:text-slate-200
                       hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => router.push(`/login-activity/${row.id}?userName=${row.name}`)}
            title="View Login History"
          >
            Login History
          </button>
        ),
      },
    ],
    [router]
  );

  /* Toolbar: Course filter (kept left), we’ll use TableComponent’s own search box */
  const toolbarLeft = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-slate-600 dark:text-slate-400">Course</label>
      <select
        value={courseFilter}
        onChange={(e) => {
          setCourseFilter(e.target.value);
          setCurrentPage(1);
        }}
        className="border rounded px-2 py-1 text-sm min-w-[200px]
                   bg-white dark:bg-slate-900
                   border-slate-300 dark:border-slate-700
                   text-slate-900 dark:text-slate-100"
      >
        <option value="">{loadingCourses ? 'Loading…' : 'All courses'}</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <main className="bg-[#F9FAFB] dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100">
      <PageHeader
        title="Login Activity"
        description="Browse users and open their login history."
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm">
        {loading && (
          <p className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Loading users…</p>
        )}

        <TableComponent
          columns={columns}
          data={tableData}
          serverMode
          /* search (server-side) */
          searchTerm={searchTerm}
          onSearchTermChange={(v) => {
            setCurrentPage(1);
            setSearchTerm(v);
          }}
          /* pagination (server-side) */
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
          totalItems={totalItems}
          /* filters */
          toolbarLeft={toolbarLeft}
          /* debounce to reduce calls */
          searchDebounceMs={300}
          /* compact windowed pagination already handled inside component */
        />
      </div>
    </main>
  );
}
