// app/components/Banner.tsx
export default function Banner({
  title,
  title2,
  description,
}: {
  title: string;
  title2: string;
  description: string;
}) {
  return (
    <section
      className="
        relative overflow-hidden py-20 px-4 text-center
        bg-gradient-to-r from-[#EFF6FF] via-[#EAF0FF] to-[#E0E7FF]
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
      "
    >
      {/* decorative glow that adapts to theme */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(40rem_40rem_at_20%_20%,rgba(59,130,246,0.08),transparent_60%),radial-gradient(30rem_30rem_at_80%_60%,rgba(99,102,241,0.08),transparent_60%)]
          dark:bg-[radial-gradient(40rem_40rem_at_20%_20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(30rem_30rem_at_80%_60%,rgba(99,102,241,0.14),transparent_60%)]
        "
      />
      <div className="relative">
        <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
          {title}
          <span className="text-blue-600 dark:text-blue-400"> {title2}</span>
        </h1>
        <p className="max-w-3xl mx-auto text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
    </section>
  );
}
