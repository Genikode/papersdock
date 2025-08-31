'use client';
import clsx from 'clsx';
import AvatarInitials from './AvatarInitials';
import { Message } from './types';

export default function MessageBubble({ m }: { m: Message }) {
  const mine = m.author === 'instructor';
  return (
    <div className={clsx('flex items-start gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && <AvatarInitials name={m.name} />}
      <div className={clsx(
        'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
        mine ? 'bg-slate-900 text-white rounded-br-md' : 'bg-white text-slate-900 border rounded-bl-md'
      )}>
        <div className={clsx('mb-1 text-[11px]', mine ? 'text-slate-300' : 'text-slate-500')}>
          <span className="font-medium">{m.name}</span> &nbsp; {new Date(m.createdAt).toLocaleString()}
        </div>
        <div>{m.text}</div>
      </div>
      {mine && <AvatarInitials name={m.name} />}
    </div>
  );
}
