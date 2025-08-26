import React from 'react';
import { Button } from '@/components/ui';

export function GroupHeader({
  onBack,
  backLabel = 'Back to Dashboard',
  title = 'Group Details'
}: {
  onBack: () => void;
  backLabel?: React.ReactNode;
  title?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <Button
        variant="outline"
        onClick={onBack}
        className="mb-4"
      >
        ← {backLabel}
      </Button>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
