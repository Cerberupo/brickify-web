import React from 'react';
import { AppWrapper } from '@/layouts';
import { LoginPage } from './Login';

/**
 * Single React island that wraps LoginPage with AppWrapper providers.
 * Using this as client:only in Astro avoids SSR rendering of LoginPage with the wrong locale.
 */
export function LoginShell() {
  return (
    <AppWrapper hideHeader={true}>
      <LoginPage />
    </AppWrapper>
  );
}

export default LoginShell;
