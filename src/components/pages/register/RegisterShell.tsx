import React from 'react';
import { AppWrapper } from '@/layouts';
import { RegisterPage } from './Register';

/**
 * Single React island that wraps RegisterPage with AppWrapper providers.
 * Using this as client:only in Astro avoids SSR rendering of RegisterPage with the wrong locale.
 */
export function RegisterShell() {
  return (
    <AppWrapper hideHeader={true}>
      <RegisterPage />
    </AppWrapper>
  );
}

export default RegisterShell;
