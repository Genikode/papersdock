import { Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';

const stats = [
  {
    label: 'Total Students',
    value: '903',
    icon: <Users className="text-blue-600 dark:text-blue-400" size={20} />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    label: 'Total Courses',
    value: '3',
    icon: <BookOpen className="text-green-600 dark:text-green-400" size={20} />,
    iconBg: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    label: 'Student Fee Paid',
    value: '0',
    icon: <CheckCircle className="text-purple-600 dark:text-purple-400" size={20} />,
    iconBg: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    label: 'Student UnPaid',
    value: '76',
    icon: <XCircle className="text-red-600 dark:text-red-400" size={20} />,
    iconBg: 'bg-red-100 dark:bg-red-900/20',
  },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((item, index) => (
        <div
          key={index}
          className="rounded-xl p-4 shadow-sm flex justify-between items-center
                     border bg-white
                     border-slate-200
                     dark:bg-slate-900 dark:border-slate-800"
        >
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {item.value}
            </p>
          </div>
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 ${item.iconBg}`}
          >
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
