'use client';
import { BadgeCheck, CheckCircle2, Clock4, MessageSquareText } from 'lucide-react';
import clsx from 'clsx';
import { Status } from './types';

export default function StatusBadge({ status, size='sm' }: { status: Status; size?: 'sm'|'md' }) {
  const map = {
    pending:  { label: 'pending',  Icon: Clock4,            classes: 'bg-amber-50 text-amber-700 ring-amber-200' },
    answered: { label: 'answered', Icon: MessageSquareText, classes: 'bg-blue-50 text-blue-700 ring-blue-200' },
    resolved: { label: 'resolved', Icon: CheckCircle2,      classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
  }[status];
  const Icon = map.Icon;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full ring-1',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      map.classes
    )}>
      <Icon size={size==='sm'?12:14} /><span className="capitalize">{map.label}</span>
    </span>
  );
}
