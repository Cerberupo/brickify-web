import React from 'react';
import { AppWrapper } from '@/layouts';
import ResetPasswordPage from './Reset';

/**
 * Single React island that wraps ResetPasswordPage with AppWrapper providers.
 * Using this as client:only in Astro avoids SSR rendering with the wrong locale.
 */
type Props = { initialSearch?: string };

export function ResetShell({ initialSearch }: Props) {
  return (
    <AppWrapper hideHeader={true}>
      <ResetPasswordPage initialSearch={initialSearch} />
    </AppWrapper>
  );
}

export default ResetShell;
