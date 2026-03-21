import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibeFlix - Project Catalog',
  description: 'Cinematic developer portfolio showcase by sokrateng',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-surface min-h-screen antialiased">{children}</body>
    </html>
  )
}
