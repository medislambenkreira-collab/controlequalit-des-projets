import React from 'react';

export function StatusBadge({ color, bg, label, icon }: { color: string; bg: string; label: string; icon?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${color}`}>
      {icon}{label}
    </span>
  );
}
