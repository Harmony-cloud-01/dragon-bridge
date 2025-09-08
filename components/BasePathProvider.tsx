// components/BasePathProvider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { withBasePath } from '@/lib/base-path';

interface BasePathContextType {
  withBasePath: (path: string) => string;
}

const BasePathContext = createContext<BasePathContextType>({
  withBasePath: (path) => path,
});

export function useBasePath() {
  return useContext(BasePathContext);
}

export function BasePathProvider({ children }: { children: ReactNode }) {
  return (
    <BasePathContext.Provider value={{ withBasePath }}>
      {children}
    </BasePathContext.Provider>
  );
}
