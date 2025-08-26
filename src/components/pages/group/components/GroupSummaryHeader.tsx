import React from 'react';
import { cn } from '@/lib/utils';
import ReferencePeopleAvatars from '@/components/common/ReferencePeopleAvatars';

export function GroupSummaryHeader(props: {
  name: string;
  description?: string | null;
  statusLabel: React.ReactNode;
  statusClassName?: string;
  groupMembersLabel: React.ReactNode;
  totalMembers: number;
  entries: any[];
  actions?: React.ReactNode;
}) {
  const { name, description, statusLabel, statusClassName, groupMembersLabel, totalMembers, entries, actions } = props;
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      {/* Left: Group name, status, and description */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-lg font-semibold truncate">{name}</h2>
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusClassName)}>
            {statusLabel}
          </span>
        </div>
        {description ? (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2 break-words">{description}</p>
        ) : null}
      </div>

      {/* Tablet (md): avatars above actions, right-aligned */}
      <div className="hidden md:flex lg:hidden flex-col items-end md:ml-4">
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {groupMembersLabel} ({totalMembers})
        </div>
        <div className="mt-1">
          <ReferencePeopleAvatars entries={entries as any[]} size={28} overlap />
        </div>
        {actions ? (
          <div className="mt-2 flex gap-2">{actions}</div>
        ) : null}
      </div>

      {/* Desktop (lg+): split into center members block and right actions block */}
      {/* Center: Members label + avatars */}
      <div className="hidden lg:flex flex-col items-start lg:ml-6">
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {groupMembersLabel} ({totalMembers})
        </div>
        <div className="mt-1">
          <ReferencePeopleAvatars entries={entries as any[]} size={28} overlap />
        </div>
      </div>
      {/* Right: Actions */}
      {actions ? (
        <div className="hidden lg:flex self-end gap-2 ml-auto pb-0.5">{actions}</div>
      ) : null}

      {/* Mobile actions below summary */}
      {actions ? (
        <div className="md:hidden flex justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
