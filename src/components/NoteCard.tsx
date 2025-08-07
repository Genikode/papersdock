import { FileText } from 'lucide-react';

interface Note {
  id: number;
  title: string;
  subject: string;
  course: string;
  format: string;
  pages: number;
  created: string;
}

interface Props {
  note: Note;
  onView: (note: Note) => void;
}

export default function NoteCard({ note, onView }: Props) {
  return (
    <div className="bg-white rounded shadow p-4 w-full max-w-sm">
      <h3 className="font-semibold text-sm">{note.title}</h3>
      <p className="text-xs text-gray-500">{note.subject}</p>
      <p className="text-sm my-1">{note.format} - {note.pages} pages</p>
      <p className="text-xs text-gray-400 mb-2">{note.created}</p>
      <button
        onClick={() => onView(note)}
        className="flex items-center gap-1 text-sm text-indigo-600 font-medium"
      >
        <FileText size={16} />
        View
      </button>
    </div>
  );
}
