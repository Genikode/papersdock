// app/view-assignments/page.tsx
import ViewAssignments from './ViewAssignmentsClient';
// Option A: use Next's built-in PageProps type (if available in your version)
// import type { PageProps } from 'next';

// export default async function Page({ searchParams }: PageProps) {
export default async function Page({
  searchParams,
}: {
  // Option B: universal typing that works with both sync & async searchParams
  searchParams:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams; // works if it's already an object or a Promise

  const init = {
    q: typeof sp?.q === 'string' ? sp.q : '',
    page: Number(sp?.page ?? 1) || 1,
    limit: Number(sp?.limit ?? 10) || 10,
    courseId: typeof sp?.courseId === 'string' ? sp.courseId : null,
  };

  return (
    <ViewAssignments
      basePath="/view-assignments"
      initialSearchParams={init}
    />
  );
}
