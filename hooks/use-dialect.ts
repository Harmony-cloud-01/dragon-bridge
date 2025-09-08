// hooks/use-dialect.ts
'use client';

import { useContext } from 'react';
import { DialectContext } from '@/components/dialect-provider';
import type { DialectContextType } from '@/components/dialect-provider';

export function useDialect(): DialectContextType {
  const context = useContext(DialectContext);
  if (!context) {
    throw new Error("useDialect must be used within a DialectProvider");
  }
  return context;
}
