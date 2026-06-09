'use client'

import type { CSSProperties, FormEvent } from 'react'
import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { resetPasswordSchema } from '@/lib/validations'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordFallback() {
  return (
    <main style={shellStyle}>
      <div style={cardStyle}>
        <div style={eyebrowStyle}>ROSS Password Flow</div>
        <h1 style={titleStyle}>Set Password</h1>
        <div style={{ ...successBoxStyle, color: '#dbe7f3' }}>
          Memuat halaman reset password...
        </div>
      </div>
    </main>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const tokenError = searchParams.get('error')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const formError = useMemo(() => {
    if (!newPassword && !confirmPassword) return ''
    const parsed = resetPasswordSchema.safeParse({ newPassword, confirmPassword })
    return parsed.success ? '' : parsed.error.issues[0]?.message ?? 'Input tidak valid.'
  }, [newPassword, confirmPassword])

  const isInvalidLink = tokenError === 'INVALID_TOKEN' || !token

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isInvalidLink) return

    const parsed = resetPasswordSchema.safeParse({ newPassword, confirmPassword })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Input tidak valid.')
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.resetPassword(token, parsed.data.newPassword)
      setSuccess(true)
      toast.success('Password berhasil disimpan.')
      window.setTimeout(() => {
        router.replace('/login?reason=password_reset')
      }, 1200)
    } catch (cause) {
      toast.error(mapApiErrorToToastMessage(cause))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={shellStyle}>
      <div style={cardStyle}>
        <div style={eyebrowStyle}>ROSS Password Flow</div>
        <h1 style={titleStyle}>Set Password</h1>
        <p style={bodyStyle}>
          Gunakan form ini untuk membuat password pertama akun Anda atau mengganti password lama melalui link verifikasi email.
        </p>

        {isInvalidLink ? (
          <div style={errorBoxStyle}>
            <ShieldAlert size={18} />
            <div>
              <div style={{ fontWeight: 800 }}>Link tidak valid</div>
              <div style={{ color: '#fecaca', marginTop: 4 }}>
                Token tidak ditemukan atau sudah kedaluwarsa. Minta link baru dari halaman forgot password.
              </div>
            </div>
          </div>
        ) : success ? (
          <div style={successBoxStyle}>
            <ShieldCheck size={18} />
            <span>Password berhasil disimpan. Anda akan diarahkan ke halaman login.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <label style={labelStyle}>
              Password baru
              <div style={inputWrapStyle}>
                <KeyRound size={16} style={inputIconStyle} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  disabled={isSubmitting}
                  style={{
                    ...inputStyle,
                    borderColor: formError ? '#ef4444' : 'rgba(96,165,250,0.25)',
                  }}
                />
              </div>
            </label>

            <label style={labelStyle}>
              Konfirmasi password
              <div style={inputWrapStyle}>
                <KeyRound size={16} style={inputIconStyle} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Ulangi password baru"
                  disabled={isSubmitting}
                  style={{
                    ...inputStyle,
                    borderColor: formError ? '#ef4444' : 'rgba(96,165,250,0.25)',
                  }}
                />
              </div>
            </label>

            {formError && <div style={inlineErrorStyle}>{formError}</div>}

            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </form>
        )}

        <div style={footerStyle}>
          <Link href="/login" style={linkStyle}>
            Kembali ke login
          </Link>
          <Link href="/forgot-password" style={linkStyle}>
            Minta link baru
          </Link>
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
    'radial-gradient(circle at top left, rgba(96,165,250,0.14), transparent 30%), linear-gradient(180deg, #08111f 0%, #0f172a 100%)',
  padding: '1.5rem',
}

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 500,
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
  background: 'linear-gradient(135deg, #60a5fa 0%, #22c55e 100%)',
  color: '#08111f',
  cursor: 'pointer',
}

const inlineErrorStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(239,68,68,0.35)',
  background: 'rgba(127,29,29,0.18)',
  padding: '0.85rem 1rem',
  color: '#fecaca',
  fontSize: '0.92rem',
}

const errorBoxStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'flex-start',
  borderRadius: 16,
  border: '1px solid rgba(239,68,68,0.35)',
  background: 'rgba(127,29,29,0.18)',
  padding: '1rem 1.1rem',
  color: '#fecaca',
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
}

const footerStyle: CSSProperties = {
  display: 'flex',
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
