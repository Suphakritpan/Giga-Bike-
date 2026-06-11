'use client'
import { useId } from 'react'

type BaseProps = {
  label: string
  /** Error message — also sets aria-invalid + red border. */
  error?: string
  /** Helper text below the input. */
  hint?: string
}

type InputProps    = BaseProps & React.InputHTMLAttributes<HTMLInputElement>    & { as?: 'input' }
type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' }
type SelectProps   = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>  & { as: 'select'; children: React.ReactNode }

type Props = InputProps | TextareaProps | SelectProps

/**
 * Labeled form field — label is always linked via htmlFor (a11y) and error
 * text is announced to screen readers. One component for input/textarea/select.
 *
 *   <Field label="อีเมล" type="email" value={email} onChange={...} required />
 *   <Field as="textarea" label="ข้อความ" rows={4} ... />
 *   <Field as="select" label="หัวข้อ" ...><option>...</option></Field>
 */
export function Field(props: Props) {
  const id = useId()
  const { label, error, hint } = props

  const shared = {
    id,
    className: 'input field-input',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  }

  let control: React.ReactNode
  if (props.as === 'textarea') {
    const { label: _l, error: _e, hint: _h, as: _a, ...rest } = props
    control = <textarea {...shared} {...rest} style={{ resize: 'vertical', ...rest.style }} />
  } else if (props.as === 'select') {
    const { label: _l, error: _e, hint: _h, as: _a, children, ...rest } = props
    control = <select {...shared} {...rest}>{children}</select>
  } else {
    const { label: _l, error: _e, hint: _h, as: _a, ...rest } = props
    control = <input {...shared} {...rest} />
  }

  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      {control}
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
      {!error && hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  )
}
