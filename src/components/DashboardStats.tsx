import {
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Students',
    value: '903',
    icon: <Users className="text-blue-500" size={20} />,
    iconBg: 'bg-blue-100',
  },
  {
    label: 'Total Courses',
    value: '3',
    icon: <BookOpen className="text-green-600" size={20} />,
    iconBg: 'bg-green-100',
  },
  {
    label: 'Student Fee Paid',
    value: '0',
    icon: <CheckCircle className="text-purple-600" size={20} />,
    iconBg: 'bg-purple-100',
  },
  {
    label: 'Student UnPaid',
    value: '76',
    icon: <XCircle className="text-red-500" size={20} />,
    iconBg: 'bg-red-100',
  },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((item, index) => (
        <div
          key={index}
          className="bg-white border rounded-xl p-4 shadow-sm flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
          </div>
          <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${item.iconBg}`}>
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
