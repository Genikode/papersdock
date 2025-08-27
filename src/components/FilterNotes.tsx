'use client';

import { BookOpen } from 'lucide-react';
import Image from 'next/image';

interface FilteredResourceBoxProps {
  tag: string;
  title: string;
  category: string;
  type: string;
  imageUrl: string;
  
}

export default function FilteredResourceBox({
  tag,
  title,
  category,
  type,
  imageUrl,
}: FilteredResourceBoxProps) {
  return (
    <div className="bg-white border rounded-xl w-full max-w-[300px] overflow-hidden shadow-sm">
      {/* Top Image with Tag */}
      <div className="relative h-36 w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
      
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4 text-sm">
        <span className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-[2px] rounded-full mb-1">
          {type}
        </span>
        <p className="text-gray-700 text-[13px] mb-3 font-medium leading-tight">
          {category}
        </p>

        <button className="w-full bg-[#1f2937] hover:bg-[#111827] text-white text-sm font-medium flex items-center justify-center gap-2 px-4 py-2 rounded-md">
          <BookOpen size={16} />
          View Notes
        </button>
      </div>
    </div>
  );
}
