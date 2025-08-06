'use client';

import PageHeader from '@/components/PageHeader';
import TableComponent from '@/components/TableComponent';
import { Eye, Check, X } from 'lucide-react';
import { useState } from 'react';

const studentApplications = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    contact: '+1 (555) 123-4567',
    freeStudent: false,
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    contact: '+1 (555) 987-6543',
    freeStudent: true,
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'mike.brown@email.com',
    contact: '+1 (555) 456-7890',
    freeStudent: false,
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    contact: '+1 (555) 321-0987',
    freeStudent: true,
  },
  {
    id: 5,
    name: 'David Wilson',
    email: 'david.w@email.com',
    contact: '+1 (555) 654-3210',
    freeStudent: false,
  },
];

export default function StudentApproval() {
  const [data, setData] = useState(studentApplications);

  const toggleFreeStudent = (id: number) => {
    const updated = data.map((item) =>
      item.id === id ? { ...item, freeStudent: !item.freeStudent } : item
    );
    setData(updated);
  };

  const columns = [
    { header: 'Student ID', accessor: 'id' },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Student Email', accessor: 'email' },
    { header: 'Student Contact', accessor: 'contact' },
    {
      header: 'Free Student',
      accessor: 'freeStudent',
      render: (value: boolean, row: any) => (
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={() => toggleFreeStudent(row.id)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 relative" />
        </label>
      ),
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (_: any, row: any) => (
        <div className="flex gap-3 justify-center">
          <Eye className="w-4 h-4 cursor-pointer text-gray-600" />
          <Check className="w-4 h-4 cursor-pointer text-green-600" />
          <X className="w-4 h-4 cursor-pointer text-red-600" />
        </div>
      ),
    },
  ];

  return (
    <main className="bg-[#F9FAFB] text-gray-800 px-4 py-6">
      <PageHeader
        title="Student Approval"
        description="Review and approve student applications"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <Card title="Total Applications" value="5" icon="🎓" />
        <Card title="Pending Review" value="3" icon="📅" />
        <Card title="Approved" value="1" icon="🧍‍♂️" />
        <Card title="Rejected" value="1" icon="🧍‍♀️" />
      </div>

      <TableComponent columns={columns} data={data} />
    </main>
  );
}

function Card({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex justify-between items-center">
      <div>
        <h3 className="text-sm text-gray-500">{title}</h3>
        <p className="text-xl font-semibold text-gray-800">{value}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  );
}
