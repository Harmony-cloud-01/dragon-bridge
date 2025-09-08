// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // GitHub Pages base path for this repo
  basePath: process.env.NODE_ENV === 'production' ? '/dragon-bridge' : '',
  // Optional absolute prefix for GH Pages CDN; adjust org/user if needed
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? 'https://harmony-cloud-01.github.io/dragon-bridge/'
      : '',
}

export default nextConfig
