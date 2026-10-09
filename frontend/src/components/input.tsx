import type { InputHTMLAttributes } from 'react'
import styles from './input.module.css'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, className, ...rest }: Props) {
  return (
    <div className={styles.wrapper}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        id={id}
        className={[styles.input, error ? styles.hasError : '', className].filter(Boolean).join(' ')}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
