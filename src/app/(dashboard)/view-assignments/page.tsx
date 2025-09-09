// app/view-assignments/page.tsx
import ViewAssignments from './ViewAssignmentsClient';

type SP = Record<string, string | string[] | undefined>;

export default function Page({ searchParams }: { searchParams: SP }) {
  const init = {
    q: typeof searchParams?.q === 'string' ? searchParams.q : '',
    page: Number(searchParams?.page ?? 1) || 1,
    limit: Number(searchParams?.limit ?? 10) || 10,
    courseId: typeof searchParams?.courseId === 'string' ? searchParams.courseId : null,
  };

  return (
    <ViewAssignments
      basePath="/view-assignments"
      initialSearchParams={init}
    />
  );
}
