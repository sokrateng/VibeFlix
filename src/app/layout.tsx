import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibeFlix - Project Catalog',
  description: 'Netflix-style catalog of vibe coding projects by sokrateng',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-[#141414] min-h-screen">{children}</body>
    </html>
  )
}
