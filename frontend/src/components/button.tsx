import type { ButtonHTMLAttributes } from 'react'
import styles from './button.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className, disabled, ...rest }: Props) {
  return (
    <button
      className={[styles.btn, styles[variant], className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? '...' : children}
    </button>
  )
}
