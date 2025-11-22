import React from 'react';
import { AppWrapper } from '@/layouts';
import { LoginPage } from './Login';

/**
 * Single React island that wraps LoginPage with AppWrapper providers.
 * Using this as client:only in Astro avoids SSR rendering of LoginPage with the wrong locale.
 */
type Props = { initialSearch?: string };

export function LoginShell({ initialSearch }: Props) {
  return (
    <AppWrapper hideHeader={true}>
      <LoginPage initialSearch={initialSearch} />
    </AppWrapper>
  );
}

export default LoginShell;
