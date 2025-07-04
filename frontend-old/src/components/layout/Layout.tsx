// src/components/layout/Layout.tsx
import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="p-4 bg-white shadow">VideoAnalysis</header>
      <main className="p-6">{children}</main>
    </div>
  )
}
