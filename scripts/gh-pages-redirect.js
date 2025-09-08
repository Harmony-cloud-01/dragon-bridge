// scripts/gh-pages-redirect.js
// This script handles client-side routing for GitHub Pages
if (typeof window !== 'undefined') {
  // GitHub Pages SPA redirect
  const path = window.location.pathname;
  if (path.startsWith('/mandarin-app/')) {
    const internalPath = path.replace('/mandarin-app', '');
    window.history.replaceState(null, '', internalPath || '/');
  }
}
