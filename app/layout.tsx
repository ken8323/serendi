import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Serendi',
  description: '未知の領域ガチャ — 知らない世界を、引く。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
