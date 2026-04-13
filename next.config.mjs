/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Schaltet die speicherintensive TS-Prüfung beim Build aus
    ignoreBuildErrors: true,
  },
  eslint: {
    // Schaltet den speicherintensiven Linter beim Build aus
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
