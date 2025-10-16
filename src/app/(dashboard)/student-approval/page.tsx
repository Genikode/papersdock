'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useDebounce } from 'use-debounce';
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
  remarks: string;
};

type UsersResponse = {
  status: number;
  success: boolean;
  message: string;
  data: UserApiItem[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
};

type CourseItem = { id: string; title: string };
type ReasonItem = { id: string; title: string };
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch] = useDebounce(searchTerm, 700); // ✅ single debounce source

  // pagination (server-mode)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0); // ✅ always from server

  // data (master list from server; we’ll apply course filter client-side for the current page only)
  const [serverRows, setServerRows] = useState<UserApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  // courses
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [reason, setReason] = useState<ReasonItem[]>([
    { id: '1', title: 'Fees Not Paid' },
    { id: '2', title: 'Assignment Not Submitted' },

  ]);

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [removeReason, setRemoveReason] = useState(false);

  // modals (Make Free)
  const [makeFreeId, setMakeFreeId] = useState<string | null>(null);

  // modals (Access)
  const [accessUser, setAccessUser] = useState<UserApiItem | null>(null);
  const [accessSelections, setAccessSelections] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);

  // Edit User modal
  const [editUser, setEditUser] = useState<UserApiItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState(''); // optional; send only if non-empty
  const [editContact, setEditContact] = useState('');
  const [editParentsContact, setEditParentsContact] = useState('');
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [reasonSelection, setReasonSelection] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete user confirmation modal
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>('');
  const [savingDelete, setSavingDelete] = useState(false);
  const [savingGrant, setSavingGrant] = useState(false);
  // Build id -> title map
  const courseMap = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c.title])),
    [courses]
  );

  /* Load ALL courses (iterate total pages) */
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

  /* Fetch users from server (server pagination + server search) */
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get<UsersResponse>('/users/get-all-users', {
        
         
        page: currentPage,
        limit: itemsPerPage,          // ✅ uses selected per-page
        search: debouncedSearch || undefined, // ✅ debounced search
        isApproved: approvedFilter || undefined,
        isFeesPaid: feesFilter || undefined,
      });

      const students = (res.data || []).filter((u) => u.roleName === 'student'
      );
      setServerRows(students);

      // ✅ ALWAYS use server total for pagination — not the filtered length
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
  }, [approvedFilter, feesFilter, debouncedSearch, currentPage, itemsPerPage]);

  /* Apply course filter CLIENT-SIDE on current page rows */
  const filteredByCourse = useMemo(() => {
    if (!courseFilter) return serverRows;
    return serverRows.filter((u) => {
      const ids = parseAllowedCourses(u.allowedCourses);
      return ids.includes(courseFilter);
    });
  }, [serverRows, courseFilter]);

  /* Derive table data with S.No AFTER local course filter (for current page view) */
  const tableData = useMemo(
    () =>
      filteredByCourse.map((u, idx) => ({
        ...u,
        sNo: (currentPage - 1) * itemsPerPage + idx + 1,
      })),
    [filteredByCourse, currentPage, itemsPerPage]
  );

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
    setEditPassword(''); // blank by default
    setEditContact(user.contact || '');
    setEditParentsContact(user.parentsContact || '');
    setEditCourseIds(parseAllowedCourses(user.allowedCourses));
  }

  function toggleCourseInEdit(id: string) {
    setEditCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
function toggleReason(title: string) {
   setReasonSelection((prev) =>
      prev.includes(title) ? prev.filter((x) => x !== title) : [...prev, title]
    );
  }
  async function saveEditedUser() {
    if (!editUser) return;
    setSavingEdit(true);
    try {
      const body: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        contact: editContact.trim(),
        courseIds: editCourseIds,
        parentsContact: editParentsContact.trim(),
      };
      if (editPassword.trim()) body.password = editPassword.trim();

      await api.patch(`/users/update-user/${editUser.id}`, body);
      setSavingGrant(false);
      setSavingDelete(false);
      setEditUser(null);
      setSavingEdit(false);
      fetchUsers();
    } catch {
      setSavingEdit(false);
    }
  }

  // ==== Delete User ====
  function confirmDelete(user: UserApiItem) {
    setDeleteUserId(user.id);
    setDeleteUserName(user.name || user.email || 'this user');
  }

  async function handleGiveAccess(id: string) {
     try {
  
      await api.patch(`/users/give-user-access/${id}`,{"reason":"Approved by Admin"});

    } catch {
      console.log('error in access');

    }
  }
  async function handleRemoveAccess(id: string,reason: string[]) {
     try {
      const res = await api.patch(`/users/revoke-user-access/${id}`,
        {"remarks":reason[0]});
      setReasonSelection([])
     setRemoveReason(false)
      // setSavingDelete(false);
      
    } catch {
      console.log('error in access');

    }
  }
  async function deleteUser(id: string) {
    try {
      await api.delete(`/users/delete-user/${id}`);
      setDeleteUserId(null);
      setDeleteUserName('');
      if (serverRows.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchUsers();
      }
    } catch {
      setDeleteUserId(null);
      setDeleteUserName('');
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
        render: (v: string) =>
          v ? v : <span className="text-xs text-gray-400 dark:text-slate-500">—</span>,
      },
      {
        header: 'Courses',
        accessor: 'allowedCourses',
        render: (v: string) => {
          const ids = parseAllowedCourses(v);
          if (!ids.length)
            return <span className="text-xs text-gray-400 dark:text-slate-500">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {ids.map((id) => (
                <span
                  key={id}
                  className="text-xs rounded-full px-2 py-0.5
                             bg-gray-100 text-gray-700 border border-gray-200
                             dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                >
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
              className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs
                         hover:bg-indigo-50
                         dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/60"
              onClick={() => openEditModal(row)}
              title="Edit User"
            >
              Edit
            </button>

            <button
              className={`inline-flex items-center gap-1 border px-2 py-1 rounded text-xs
                          dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/60
                          ${
                            row.isSecurityBypassed === 'Y'
                              ? 'border-green-500 bg-green-500 text-white dark:bg-green-600 dark:border-green-600'
                              : ''
                          }`}
              onClick={() => setMakeFreeId(row.id)}
              title="Mark Free"
            >
              Free
            </button>

            <button
              className="inline-flex items-center gap-1 border px-2 py-1 rounded text-xs
                         text-red-600 border-red-500 hover:bg-red-50
                         dark:text-red-400 dark:border-red-600 dark:hover:bg-red-950/30"
              onClick={() => confirmDelete(row)}
              title="Delete User"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [courseMap]
  );

  /* Toolbar with course filter + our own debounced search */
  const toolbarLeft = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-gray-600 dark:text-slate-400 ml-1">Course</label>
      <select
        value={courseFilter}
        onChange={(e) => {
          setCourseFilter(e.target.value);
          setCurrentPage(1);
        }}
        className="min-w-[180px] text-sm px-2 py-1 rounded border border-gray-300 bg-white text-gray-800
                   focus:outline-none focus:ring-2 focus:ring-indigo-500
                   dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
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
        className="ml-2 w-56 text-sm px-3 py-1 rounded border border-gray-300 bg-white text-gray-800
                   placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                   dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-indigo-400"
      />
    </div>
  );

  return (
    <main className="bg-gray-50 dark:bg-slate-950 p-6 text-gray-800 dark:text-slate-100">
      <PageHeader
        title="Student Approval"
        description="Review students, grant access, edit users, and mark fee exemptions"
      />

      <div className="bg-white dark:bg-slate-900 rounded-md shadow-md border border-gray-200 dark:border-slate-800">
        {loading && (
          <p className="px-4 py-2 text-sm text-gray-500 dark:text-slate-400">Loading students…</p>
        )}

        <TableComponent
          columns={columns}
          data={tableData}
          serverMode
          /* server-side pagination (limit works now because totalItems is server total) */
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
          totalItems={totalItems}            // ✅ server total
          /* custom toolbar (filters + our own search) */
          toolbarLeft={toolbarLeft}
          hideSearch                       // ✅ use our own debounced search input
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
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Select courses to allow for this student. Current selections are pre-checked.
            </p>
            <div className="max-h-72 overflow-auto border rounded p-3 border-gray-200 dark:border-slate-700">
              {courses.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-slate-400">No courses found.</p>
              )}
              {courses.map((c) => {
                const checked = accessSelections.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 py-1">
                    <input type="checkbox" checked={checked} onChange={() => toggleCourseInAccess(c.id)} />
                    <span className="text-sm text-gray-800 dark:text-slate-100">{c.title}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-3 py-1 border rounded border-gray-300 text-gray-800 hover:bg-gray-50
                           dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/60"
                onClick={() => setAccessUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                           dark:bg-indigo-600 dark:hover:bg-indigo-500"
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
        <Modal title={`Edit User — ${editUser.name}`} statusUser={editUser.remarks} onClose={() => setEditUser(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-slate-300">Name</label>
              <input
                className="w-full text-sm px-3 py-2 rounded border border-gray-300 bg-white text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-indigo-500
                           dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Updated Student"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-slate-300">Email</label>
              <input
                className="w-full text-sm px-3 py-2 rounded border border-gray-300 bg-white text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-indigo-500
                           dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="updatedstudent@example.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-slate-300">Password (optional)</label>
              <input
                type="password"
                className="w-full text-sm px-3 py-2 rounded border border-gray-300 bg-white text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-indigo-500
                           dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="newpassword123"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-slate-300">Contact</label>
              <input
                className="w-full text-sm px-3 py-2 rounded border border-gray-300 bg-white text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-indigo-500
                           dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-slate-300">Parent Contact</label>
              <input
                className="w-full text-sm px-3 py-2 rounded border border-gray-300 bg-white text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-indigo-500
                           dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-indigo-400"
                value={editParentsContact}
                onChange={(e) => setEditParentsContact(e.target.value)}
                placeholder="9876543210"
              />
            </div>
    <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-gray-700 dark:text-slate-300">Access Permision</label>
              <div className="max-h-56 overflow-auto border rounded p-3 border-gray-200 dark:border-slate-700">
                     <button
                  className={`px-3 py-1 border rounded border-gray-300 text-gray-800 hover:bg-gray-50
                       dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/60 ${savingGrant ? 'bg-green-500 dark:bg-green-500' : ''}`}
                  onClick={() => {
                  setSavingGrant(true);
                  handleGiveAccess(editUser.id);
                  }}
                >
                  Give Access
                </button>
                  <button
              className={`px-3 py-1 border rounded border-gray-300 text-gray-800 hover:bg-gray-50
                         dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/60 ${savingDelete ? 'bg-red-500 text-white dark:bg-red-600' : ''}`}
              onClick={() => {
                setSavingDelete(true);
                setRemoveReason(true);
              }}
            >
              Remove Access
            </button>
            {loadingReason && <p className="text-sm text-gray-500 dark:text-slate-400">Loading reasons…</p>}
            {removeReason && (
              <div className="mt-2 mb-4 ">
                <p>Reason for removal:</p>
                {reason.map((c) => {
                  const checked = reasonSelection.includes(c.title);
                  return (
                    <label key={c.id} className="flex items-center gap-2 py-1">
                      <input type="checkbox" checked={checked} onChange={() => toggleReason(c.title)} />
                      <span className="text-sm text-gray-800 dark:text-slate-100">{c.title}</span>
                    </label>
                  );
                })}
              <div className="flex justify-end gap-2 mt-2">
        
            <button
              className="px-3 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                         dark:bg-indigo-600 dark:hover:bg-indigo-500"
              onClick={() => handleRemoveAccess(editUser.id,reasonSelection)}
            >
              Remove Access
            </button>
          </div>
              </div>
            )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-gray-700 dark:text-slate-300">Course Access</label>
              <div className="max-h-56 overflow-auto border rounded p-3 border-gray-200 dark:border-slate-700">
                {courses.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-slate-400">No courses found.</p>
                )}
                {courses.map((c) => {
                  const checked = editCourseIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 py-1">
                      <input type="checkbox" checked={checked} onChange={() => toggleCourseInEdit(c.id)} />
                      <span className="text-sm text-gray-800 dark:text-slate-100">{c.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-3 py-1 border rounded border-gray-300 text-gray-800 hover:bg-gray-50
                         dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/60"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                         dark:bg-indigo-600 dark:hover:bg-indigo-500"
              onClick={saveEditedUser}
              disabled={savingEdit}
            >
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete User Confirmation */}
      {deleteUserId && (
        <ConfirmationModal
          title="Delete User"
          description={`Are you sure you want to delete ${deleteUserName}? This action cannot be undone.`}
          onCancel={() => {
            setDeleteUserId(null);
            setDeleteUserName('');
          }}
          onConfirm={() => deleteUser(deleteUserId)}
        />
      )}
    </main>
  );
}

