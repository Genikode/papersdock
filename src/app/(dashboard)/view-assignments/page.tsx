'use client';

import PageHeader from "@/components/PageHeader";
import TableComponent from "@/components/TableComponent";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ViewAssignments() {
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    dueDate: string;

    status: string;
  } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const assignments = [
    {
      id: "123123",
      title: "Mathematics",
      description: "Mathematics Quiz - Algebra Basics",
      category: "AS",
      dueDate: "2024-01-25",
    
      status: "Active",
    },
    {
      id: "32424",
      title: "Physics",
      description: "Physics Assignment - Motion and Forces",
      category: "A2",
      dueDate: "2024-01-22",
  
      status: "Active",
    },
    {
      id: "3255365",
      title: "Computer",
      description: "Computer Science - Data Structures",
      category: "Composite",
      dueDate: "2024-01-20",
  
      status: "Completed",
    },
    {
      id: "345234",
      title: "Calculus",
      description: "Calculus Integration Problems",
      category: "P2 Crash Course",
      dueDate: "2024-02-05",
  
      status: "Draft",
    },
    {
      id: "234234",
      title: "Quantum",
      description: "Quantum Mechanics Quiz",
      category: "P4 Crash Course",
      dueDate: "2024-02-10",
     
      status: "Active",
    },
  ];

  const columns = [
    { header: "Assignment ID", accessor: "id" },
    { header: "Title", accessor: "title" },
    { header: "Description", accessor: "description" },
    {
      header: "Category",
      accessor: "category",
      render: (value: string) => (
        <span className="border rounded-full px-2 py-0.5 text-xs bg-white text-gray-700">
          {value}
        </span>
      ),
    },
    { header: "Due Date", accessor: "dueDate" },
  
    {
      header: "Status",
      accessor: "status",
      render: (value: string) => {
        const color =
          value === "Active"
            ? "bg-green-100 text-green-800"
            : value === "Completed"
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-600";
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      header: "View Submissions",
      accessor: "view",
      render: (_: unknown, row: {
        id: string;
        title: string;
        description: string;
        category: string;
        dueDate: string;
        progress: string;
        status: string;
      }) => (
        <button
          className="border px-3 py-1 rounded text-sm hover:bg-gray-100"
          onClick={() => {
            setSelectedAssignment(row);
            setShowViewModal(true);
          }}
        >
          View
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (
        _: unknown,
        row: {
          id: string;
          title: string;
          description: string;
          category: string;
          dueDate: string;
          progress: string;
          status: string;
        }
      ) => (
        <div className="flex gap-2">
          <Eye className="w-4 h-4 cursor-pointer" />
          <Pencil className="w-4 h-4 cursor-pointer" />
          <Trash2 className="w-4 h-4 cursor-pointer text-red-500" />
        </div>
      ),
    },
  ];

  return (
    <main className="bg-[#F9FAFB] text-gray-800">
      <PageHeader title="All Assignments" description="Track all assignment activities" />

      <TableComponent columns={columns} data={assignments} />

      {/* Modal Placeholder */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md w-[400px]">
            <h2 className="text-xl font-semibold mb-4">Assignment Details</h2>
            <p><strong>Title:</strong> {selectedAssignment?.title}</p>
            <p><strong>Description:</strong> {selectedAssignment?.description}</p>
            <p><strong>Due Date:</strong> {selectedAssignment?.dueDate}</p>
          
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
