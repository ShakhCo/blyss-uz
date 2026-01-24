'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const colorScheme = searchParams.get('colorScheme');

  useEffect(() => {
    const root = document.documentElement;

    if (colorScheme === 'light') {
      root.setAttribute('data-color-scheme', 'light');
    } else if (colorScheme === 'dark') {
      root.setAttribute('data-color-scheme', 'dark');
    } else {
      // Remove the attribute to respect system preference
      root.removeAttribute('data-color-scheme');
    }
  }, [colorScheme]);

  return <>{children}</>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
    </Suspense>
  );
}
