'use client';
function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
}
export default function AvatarInitials({ name }: { name: string }) {
  return (
    <div className="grid place-items-center h-7 w-7 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold select-none">
      {initials(name)}
    </div>
  );
}
