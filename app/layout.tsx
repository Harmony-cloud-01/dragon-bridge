// app/layout.tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { PWARegister } from "@/components/pwa-register"
import { OfflineBanner } from "@/components/offline-banner"
import { I18nProvider } from "@/components/i18n-provider"
import { BasePathProvider } from "@/components/BasePathProvider"
import { LiteModeProvider } from "@/components/lite-mode"
import { LiteModeToggle } from "@/components/lite-mode-toggle"

// Base path for GitHub Pages
const isProduction = process.env.NODE_ENV === 'production'
const basePath = isProduction ? '/dragon-bridge' : ''

export const metadata: Metadata = {
  title: 'Dragon Bridge - Mandarin Teacher',
  description: 'Practice characters, dialects, and pronunciation',
  generator: 'v0.dev',
  metadataBase: new URL(isProduction ? 'https://harmony-cloud-01.github.io' : 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
        <meta name="theme-color" content="#0d9488" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <BasePathProvider>
          <LiteModeProvider>
            <I18nProvider>
              {children}
              <OfflineBanner />
              <PWARegister />
              <LiteModeToggle />
            </I18nProvider>
          </LiteModeProvider>
        </BasePathProvider>
      </body>
    </html>
  )
}
