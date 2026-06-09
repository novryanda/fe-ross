'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { forgotPasswordSchema } from '@/lib/validations'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const emailError = useMemo(() => {
    if (!email) return ''
    const parsed = forgotPasswordSchema.safeParse({ email })
    return parsed.success ? '' : parsed.error.issues[0]?.message ?? 'Email tidak valid.'
  }, [email])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Email tidak valid.'
      setError(message)
      toast.error(message)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined
      await authApi.requestPasswordReset(parsed.data.email, redirectTo)
      setSubmitted(true)
      toast.success('Jika email terdaftar, link reset password akan segera dikirim.')
    } catch (cause) {
      const message = mapApiErrorToToastMessage(cause)
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={shellStyle}>
      <div style={cardStyle}>
        <div style={eyebrowStyle}>ROSS Account Recovery</div>
        <h1 style={titleStyle}>Forgot Password</h1>
        <p style={bodyStyle}>
          Masukkan email akun Anda. Jika email terdaftar, kami akan mengirimkan link verifikasi untuk membuat password baru.
        </p>

        {submitted ? (
          <div style={successBoxStyle}>
            <ShieldCheck size={18} />
            <span>
              Permintaan sudah diproses. Cek inbox dan folder spam email Anda.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <label style={labelStyle}>
              Email
              <div style={inputWrapStyle}>
                <Mail size={16} style={inputIconStyle} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@domain.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  style={{
                    ...inputStyle,
                    borderColor: error || emailError ? '#ef4444' : 'rgba(96,165,250,0.25)',
                  }}
                />
              </div>
            </label>

            {(error || emailError) && (
              <div style={errorStyle}>{error || emailError}</div>
            )}

            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset Password'}
            </button>
          </form>
        )}

        <div style={footerStyle}>
          <Link href="/login" style={linkStyle}>
            Kembali ke login
          </Link>
          <span style={{ color: '#6b7c93' }}>
            Link berlaku terbatas demi keamanan.
          </span>
        </div>
      </div>
    </main>
  )
}

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'radial-gradient(circle at top, rgba(34,197,94,0.12), transparent 35%), linear-gradient(180deg, #08111f 0%, #0f172a 100%)',
  padding: '1.5rem',
}

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 460,
  background: 'rgba(8, 17, 31, 0.92)',
  border: '1px solid rgba(96,165,250,0.2)',
  borderRadius: 24,
  padding: '2rem',
  boxShadow: '0 24px 80px rgba(2, 8, 23, 0.45)',
  color: '#dbe7f3',
}

const eyebrowStyle: CSSProperties = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: '#60a5fa',
  marginBottom: '0.9rem',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '2rem',
  color: '#f8fbff',
}

const bodyStyle: CSSProperties = {
  margin: '0.9rem 0 1.5rem',
  lineHeight: 1.7,
  color: '#a9bdd2',
}

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  fontWeight: 700,
  color: '#dbe7f3',
}

const inputWrapStyle: CSSProperties = {
  position: 'relative',
}

const inputIconStyle: CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#60a5fa',
}

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid rgba(96,165,250,0.25)',
  background: 'rgba(15, 23, 42, 0.92)',
  color: '#f8fbff',
  padding: '0.95rem 1rem 0.95rem 2.75rem',
  outline: 'none',
}

const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: 999,
  padding: '0.95rem 1.2rem',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #22c55e 0%, #60a5fa 100%)',
  color: '#08111f',
  cursor: 'pointer',
}

const errorStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(239,68,68,0.35)',
  background: 'rgba(127,29,29,0.18)',
  padding: '0.85rem 1rem',
  color: '#fecaca',
  fontSize: '0.92rem',
}

const successBoxStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'flex-start',
  borderRadius: 16,
  border: '1px solid rgba(34,197,94,0.3)',
  background: 'rgba(20, 83, 45, 0.18)',
  padding: '1rem 1.1rem',
  color: '#bbf7d0',
  lineHeight: 1.6,
}

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  marginTop: '1.25rem',
  fontSize: '0.9rem',
  flexWrap: 'wrap',
}

const linkStyle: CSSProperties = {
  color: '#93c5fd',
  textDecoration: 'none',
  fontWeight: 700,
}
