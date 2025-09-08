'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // GitHub Pages SPA redirect for client-side routing
    const path = window.location.pathname
    if (path.startsWith('/mandarin-app/')) {
      const internalPath = path.replace('/mandarin-app', '')
      router.replace(internalPath || '/')
    }
  }, [router])

  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
    </div>
  )
}
