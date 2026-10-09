import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

type Tone = 'primary' | 'secondary' | 'danger' | 'ghost'

const tones: Record<Tone, string> = {
  primary: 'bg-stone-900 text-white hover:bg-stone-700',
  secondary: 'border border-stone-300 bg-white hover:bg-stone-100',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
}

export function Button({ tone = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    />
  )
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-stone-500 ${className}`}
      {...props}
    />
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid content-start gap-1 text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
        active ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
      }`}
    >
      {children}
    </button>
  )
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{children}</span>
}

export function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null
  return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-line text-red-700">{error}</p>
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-16" role="status" aria-label="Loading">
      <div className="size-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
    </div>
  )
}

export function Card({ title, children, actions }: { title?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-stone-500 uppercase">{title}</h2>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
