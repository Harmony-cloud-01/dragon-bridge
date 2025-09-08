// lib/base-path.ts
export const getBasePath = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('github.io')) {
      // Derive repo name from path: /<repo>/...
      const seg = window.location.pathname.split('/').filter(Boolean)[0]
      return seg ? `/${seg}` : ''
    }
  }
  return process.env.NODE_ENV === 'production' ? '/dragon-bridge' : '';
};

export const withBasePath = (path: string): string => {
  const basePath = getBasePath();
  if (path.startsWith(basePath)) {
    return path;
  }
  return `${basePath}${path.startsWith('/') ? path : '/' + path}`;
};
