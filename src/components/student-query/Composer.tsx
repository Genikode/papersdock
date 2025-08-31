'use client';
import { FormEvent, useState } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';

export default function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    onSend(t);
    setValue('');
  };
  return (
    <form onSubmit={submit} className="border-t bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border bg-white px-3 py-2">
          <input
            className="w-full border-none outline-none text-sm"
            placeholder="Type your message..."
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        </div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50" title="Attach">
          <Paperclip size={16} />
        </button>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-md border bg-white hover:bg-slate-50" title="Voice">
          <Mic size={16} />
        </button>
        <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95">
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
