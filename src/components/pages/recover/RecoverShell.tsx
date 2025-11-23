import React from 'react';
import { AppWrapper } from '@/layouts';
import RecoverPasswordPage from './Recover';

/**
 * Single React island that wraps RecoverPasswordPage with AppWrapper providers.
 * Using this as client:only in Astro avoids SSR rendering with the wrong locale.
 */
export function RecoverShell() {
  return (
    <AppWrapper hideHeader={true}>
      <RecoverPasswordPage />
    </AppWrapper>
  );
}

export default RecoverShell;
