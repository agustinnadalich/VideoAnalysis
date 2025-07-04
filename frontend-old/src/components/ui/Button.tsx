import { cn } from '../../lib/utils'

export function Button({
  children,
  className,
  disabled = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'rounded-xl px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        className
      )}
    >
      {children}
    </button>
  )
}
