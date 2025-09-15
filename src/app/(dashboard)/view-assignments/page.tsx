// src/app/(dashboard)/view-assignments/page.tsx
import ViewAssignments from './ViewAssignmentsClient';

// Type it exactly as "Promise or undefined" to match Next's PageProps
type SP = Promise<Record<string, string | string[] | undefined>> | undefined;

export default async function Page({ searchParams }: { searchParams?: SP }) {
  const sp = (await searchParams) ?? {};

  const init = {
    // q: typeof sp.q === 'string' ? sp.q : '',
    page: Number(sp.page ?? 1) || 1,
    limit: Number(sp.limit ?? 10) || 10,
    courseId: typeof sp.courseId === 'string' ? sp.courseId : null,
  };

  return (
    <ViewAssignments
      basePath="/view-assignments"
      initialSearchParams={init}
    />
  );
}
