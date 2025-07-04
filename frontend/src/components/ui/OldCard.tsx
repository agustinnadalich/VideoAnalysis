import { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children }: { children: ReactNode }) {
  return <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-100 to-slate-50">{children}</div>
}

Card.Content = function CardContent({ children }: { children: ReactNode }) {
  return <div className="px-6 py-4 space-y-2">{children}</div>
}

Card.Footer = function CardFooter({ children }: { children: ReactNode }) {
  return <div className="px-6 py-4 border-t bg-slate-50">{children}</div>
}
