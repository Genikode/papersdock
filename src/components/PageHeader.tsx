'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  path?: string;
}

export default function PageHeader({
  title,
  description,
  buttonText,
  path,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white text-gray-900">{title}</h1>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      </div>

      {buttonText && path && (
        <button
          onClick={() => router.push(path)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium shadow"
        >
          <Plus size={16} />
          {buttonText}
        </button>
      )}
    </div>
  );
}
