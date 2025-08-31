'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TableComponent, { TableColumn } from '@/components/TableComponent';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/lib/api';

/* =========================
   API Types
========================= */
type UserApiItem = {
  id: string;
  name: string;
  email: string;
  contact?: string;
  parentsContact?: string;
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

  // modals (Make Free)
  const [makeFreeId, setMakeFreeId] = useState<string | null>(null);

  // modals (Access)
  const [accessUser, setAccessUser] = useState<UserApiItem | null>(null);
  const [accessSelections, setAccessSelections] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);

  // NEW: Edit User modal
  const [editUser, setEditUser] = useState<UserApiItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState(''); // optional; send only if non-empty
  const [editContact, setEditContact] = useState('');
  const [editRoleId, setEditRoleId] = useState('');     // text input; replace with roles dropdown if available
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

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

  // ==== Edit User ====
  function openEditModal(user: UserApiItem) {
    setEditUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditPassword(''); // blank by default; send only if changed
    setEditContact(user.contact || '');
    setEditRoleId('');   // no roleId available in list; keep editable text
    setEditCourseIds(parseAllowedCourses(user.allowedCourses));
  }

  function toggleCourseInEdit(id: string) {
    setEditCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function saveEditedUser() {
    if (!editUser) return;
    setSavingEdit(true);
    try {
      // Build body with required keys; include password only if provided
      const body: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        contact: editContact.trim(),
        roleId: "72820b17-a80f-4707-9ed8-e15d92902a2b",     // keep as free text unless you have a roles API
        courseIds: editCourseIds,
      };
      if (editPassword.trim()) {
        body.password = editPassword.trim();
      }

      await api.patch(`/users/update-user/${editUser.id}`, body);
      setEditUser(null);
      setSavingEdit(false);
      fetchUsers();
    } catch {
      setSavingEdit(false);
      // keep modal open on error
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
        header: 'Parents Contact',
        accessor: 'parentsContact',
        render: (v: string) => (v ? v : <span className="text-xs text-gray-400">—</span>),
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
              Access
            </button>
            <button
              className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-indigo-50"
              onClick={() => openEditModal(row)}
              title="Edit User"
            >
              Edit
            </button>
            <button
              className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs hover:bg-green-50"
              onClick={() => setMakeFreeId(row.id)}
              title="Make student free"
            >
             Free
            </button>
          </div>
        ),
      },
    ],
    [courseMap]
  );

  /* Toolbar with filters + search */
  const toolbarLeft = (
    <div className="flex flex-wrap items-center gap-2">
   
     

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
      <PageHeader title="Student Approval" description="Review students, grant access, edit users, and mark fee exemptions" />

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

      {/* Edit User Modal */}
      {editUser && (
        <Modal title={`Edit User — ${editUser.name}`} onClose={() => setEditUser(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Updated Student"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="updatedstudent@example.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password (optional)</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2 text-sm"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="newpassword123"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Contact</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                placeholder="9876543210"
              />
            </div>
          
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Course Access</label>
              <div className="max-h-56 overflow-auto border rounded p-3">
                {courses.length === 0 && <p className="text-sm text-gray-500">No courses found.</p>}
                {courses.map((c) => {
                  const checked = editCourseIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCourseInEdit(c.id)}
                      />
                      <span className="text-sm">{c.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button className="px-3 py-1 border rounded" onClick={() => setEditUser(null)}>
              Cancel
            </button>
            <button
              className="px-3 py-1 rounded text-white bg-indigo-600 disabled:opacity-60"
              onClick={saveEditedUser}
              disabled={savingEdit}
            >
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
