'use client'
import { Suspense, useMemo, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Activity, ShieldCheck, Terminal, Clock, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { getApiMode } from '@/lib/auth/session'
import { mapApiErrorToToastMessage } from '@/lib/api/errors'
import { CyberLoading } from '@/components/ui/cyber-loading'

const MOCK_QUICK_LOGINS = [
  { label: 'Admin', email: 'admin@ross.id', color: '#8b5cf6' },
  { label: 'Buzzer', email: 'bytewraith@ross.id', color: '#00f0ff' },
  { label: 'Viewer', email: 'jordan.lee@ross.id', color: '#39ff14' },
] as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e17' }}>
      <div className="skeleton" style={{ width: 420, height: 500, borderRadius: 12 }} />
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [booting, setBooting] = useState(false)
  const [granted, setGranted] = useState(false)
  const [clock, setClock] = useState('--:--:--')

  const isMock = getApiMode() === 'mock'
  const redirectTarget = useMemo(() => {
    const raw = searchParams.get('redirect')
    if (!raw) return '/dashboard'
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
    return raw
  }, [searchParams])

  const reasonMessage = useMemo(() => {
    const reason = searchParams.get('reason')
    if (reason === 'password_changed') return 'Password berhasil diubah. Silakan login dengan password baru.'
    return null
  }, [searchParams])

  const emailValid = EMAIL_REGEX.test(email)
  const formValid = emailValid && password.length > 0
  const submitting = isLoading || granted || booting

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date()
      setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!formValid || submitting) return
    setError('')

    try {
      await login(email, password, () => {
        setGranted(true)
        setBooting(true)
        toast.success(`Access Granted: System Initializing...`)
      })
      // When login returns, useAuth has called setUser(current).
      // The global auth-provider will automatically handle the router.replace
      // to the appropriate dashboard/role landing page.
    } catch (err: unknown) {
      const msg = mapApiErrorToToastMessage(err)
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: '#0a0e17', 
      color: '#c0d8e8',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <CyberStyles />

      {/* Background Systems */}
      <MatrixCanvas />
      <div className="grid-overlay" />
      <div className="scanline" />
      <HexFloaters />

      {/* Loading Screen Overlay */}
      {booting && (
        <CyberLoading 
          title="INITIALIZING ROSS SYSTEM"
          messages={[
            '[OK] Initializing kernel modules...',
            '[OK] Loading ROSS framework v4.2.1...',
            '[OK] Establishing secure tunnel...',
            '[OK] Verifying threat intelligence...',
            '[OK] Mounting encrypted filesystem...',
            '[OK] System ready. Awaiting auth...'
          ]}
        />
      )}

      {/* Main Form Content */}
      <div className="main-wrap" style={{ opacity: booting ? 0 : 1, transition: 'opacity 0.6s' }}>
        <div className="login-card">
          <div className="corner corner--tl" />
          <div className="corner corner--tr" />
          <div className="corner corner--bl" />
          <div className="corner corner--br" />

          <div className="logo-section">
            <img 
              src="/ross1.jpg-removebg-preview.png" 
              className="logo-img" 
              alt="ROSS Logo" 
            />
          </div>

          {reasonMessage && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              background: 'rgba(57,255,20,0.06)',
              border: '1px solid rgba(57,255,20,0.25)',
              borderRadius: 6,
              color: '#39ff14',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Check size={14} />
              <span>{reasonMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Operator Identifier</label>
              <div className="input-wrap">
                <Mail className="field-icon" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email address..." 
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label>Access Key</label>
              <div className="input-wrap">
                <Lock className="field-icon" size={16} />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter secure key..." 
                  disabled={submitting}
                />
                <button 
                  type="button" 
                  className="pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  [{showPass ? 'HIDE' : 'SHOW'}]
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label className="remember">
                <input 
                  type="checkbox" 
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span className="check-box" />
                Maintain session
              </label>
              <a href="#" className="clearance-link">Request Clearance</a>
            </div>

            {error && (
              <div className="error-alert">
                <Terminal size={14} />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className={`submit-btn ${granted ? 'granted' : ''}`}
              disabled={!formValid || submitting}
            >
              {granted ? '◈ ACCESS GRANTED ◈' : submitting ? '◈ AUTHENTICATING... ◈' : '◈ AUTHENTICATE ◈'}
            </button>
          </form>

          {isMock && (
            <div className="mock-section">
              <div className="mock-label">MOCK MODE — QUICK ACCESS</div>
              <div className="mock-grid">
                {MOCK_QUICK_LOGINS.map(q => (
                  <button
                    key={q.label}
                    type="button"
                    className="mock-btn"
                    onClick={() => {
                      setEmail(q.email)
                      setPassword('password123')
                    }}
                    style={{ borderColor: `${q.color}40`, color: q.color }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="status-bar">
            <div className="status-left">
              <div className="status-dot" /> 
              {granted ? 'ENCRYPTED CHANNEL' : 'SYSTEM ONLINE'}
            </div>
            <div className="status-clock">
              <Clock size={10} style={{ marginRight: 4 }} />
              {clock}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops = Array(columns).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${fontSize}px monospace`
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = Math.random() > 0.95 ? '#39ff14' : '#00f0ff'
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} id="matrix" style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15 }} />
}

function HexFloaters() {
  const [floaters, setFloaters] = useState<{ id: number; left: string; delay: string; duration: string; text: string }[]>([])

  useEffect(() => {
    const spawn = () => {
      const id = Date.now()
      const hex = Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0')
      const newFloater = {
        id,
        left: `${Math.random() * 100}%`,
        delay: '0s',
        duration: `${6 + Math.random() * 8}s`,
        text: `0x${hex}`
      }
      setFloaters(prev => [...prev.slice(-15), newFloater])
    }
    const interval = setInterval(spawn, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div id="hexContainer" style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
      {floaters.map(f => (
        <div 
          key={f.id} 
          className="hex-float" 
          style={{ left: f.left, animationDuration: f.duration, animationDelay: f.delay }}
        >
          {f.text}
        </div>
      ))}
    </div>
  )
}

function CyberStyles() {
  return (
    <style>{`
      .grid-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;
        background-image: linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px);
        background-size: 40px 40px;
      }

      .scanline {
        position: fixed; top: 0; left: 0; width: 100%; height: 4px; z-index: 2; pointer-events: none;
        background: linear-gradient(90deg, transparent, var(--cyan), transparent); opacity: 0.15;
        animation: scanDown 4s linear infinite;
      }

      @keyframes scanDown { 0% { top: -4px } 100% { top: 100% } }

      .hex-float {
        position: absolute; z-index: 1; font-family: monospace;
        font-size: 11px; color: var(--cyan); opacity: 0; animation: hexDrift 8s linear infinite;
      }

      @keyframes hexDrift {
        0% { opacity: 0; transform: translateY(100vh); }
        10% { opacity: 0.25; } 80% { opacity: 0.25; }
        100% { opacity: 0; transform: translateY(-20vh); }
      }

      .login-card {
        background: linear-gradient(135deg, rgba(10,14,23,0.9), rgba(15,25,40,0.9));
        border: 1px solid var(--border); border-radius: 12px; padding: 40px 35px;
        backdrop-filter: blur(20px); position: relative; width: 420px;
        box-shadow: 0 0 60px rgba(0,240,255,0.05), inset 0 1px 0 rgba(0,240,255,0.1);
        animation: cardIn 0.8s ease-out;
      }

      @keyframes cardIn { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: translateY(0) } }

      .corner { position: absolute; width: 16px; height: 16px; border-color: var(--cyan); z-index: 2; }
      .corner--tl { top: 8px; left: 8px; border-top: 2px solid; border-left: 2px solid; }
      .corner--tr { top: 8px; right: 8px; border-top: 2px solid; border-right: 2px solid; }
      .corner--bl { bottom: 8px; left: 8px; border-bottom: 2px solid; border-left: 2px solid; }
      .corner--br { bottom: 8px; right: 8px; border-bottom: 2px solid; border-right: 2px solid; }

      .logo-section { text-align: center; margin-bottom: 3rem; }
      .logo-img { height: 240px; width: auto; filter: drop-shadow(0 0 20px rgba(0,240,255,0.4)); animation: logoPulse 4s ease-in-out infinite; }
      @keyframes logoPulse { 0%, 100% { filter: drop-shadow(0 0 15px rgba(0,240,255,0.3)); transform: scale(1) } 50% { filter: drop-shadow(0 0 25px rgba(0,240,255,0.5)); transform: scale(1.02) } }
      .logo-title { font-family: sans-serif; font-size: 24px; font-weight: 900; letter-spacing: 6px; color: #fff; margin-top: 10px; }
      .logo-sub { font-family: monospace; font-size: 10px; letter-spacing: 4px; color: var(--cyan); opacity: 0.7; text-transform: uppercase; }

      .field { margin-bottom: 1.25rem; }
      .field label { display: block; font-family: monospace; font-size: 11px; letter-spacing: 1px; color: var(--cyan); margin-bottom: 6px; text-transform: uppercase; }
      .field label::before { content: '> '; color: var(--green); }
      
      .input-wrap { position: relative; }
      .input-wrap input {
        width: 100%; padding: 12px 14px 12px 42px; background: rgba(0,240,255,0.03);
        border: 1px solid rgba(0,240,255,0.12); border-radius: 6px; color: #e0f0ff;
        font-family: monospace; font-size: 14px; outline: none; transition: all 0.3s;
      }
      .input-wrap input:focus { border-color: var(--cyan); background: rgba(0,240,255,0.06); box-shadow: 0 0 15px rgba(0,240,255,0.1); }
      .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--cyan); opacity: 0.5; }
      .pass-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--cyan); font-family: monospace; font-size: 10px; cursor: pointer; opacity: 0.5; }

      .submit-btn {
        width: 100%; padding: 14px; background: linear-gradient(135deg, rgba(0,240,255,0.1), rgba(57,255,20,0.05));
        border: 1px solid rgba(0,240,255,0.3); border-radius: 6px; color: var(--cyan);
        font-family: sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 3px;
        cursor: pointer; transition: all 0.4s; text-transform: uppercase;
      }
      .submit-btn:hover:not(:disabled) { border-color: var(--cyan); background: rgba(0,240,255,0.15); box-shadow: 0 0 25px rgba(0,240,255,0.2); }
      .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .submit-btn.granted { color: var(--green); border-color: var(--green); box-shadow: 0 0 30px rgba(57,255,20,0.3); }

      .remember { display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: monospace; font-size: 12px; color: rgba(0,240,255,0.5); }
      .remember input { display: none; }
      .check-box { width: 14px; height: 14px; border: 1px solid rgba(0,240,255,0.3); border-radius: 3px; display: flex; align-items: center; justify-content: center; }
      .remember input:checked ~ .check-box { border-color: var(--cyan); background: rgba(0,240,255,0.1); }
      .remember input:checked ~ .check-box::after { content: '✓'; color: var(--cyan); font-size: 10px; }

      .clearance-link { font-family: monospace; font-size: 11px; color: var(--cyan); text-decoration: none; opacity: 0.6; }
      
      .status-bar { margin-top: 1.5rem; display: flex; justify-content: space-between; border-top: 1px solid rgba(0,240,255,0.05); padding-top: 0.75rem; font-family: monospace; font-size: 10px; color: rgba(0,240,255,0.4); }
      .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: blink 2s infinite; margin-right: 6px; }
      .status-left { display: flex; align-items: center; }

      .mock-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed rgba(0,240,255,0.1); }
      .mock-label { font-family: monospace; font-size: 9px; color: rgba(0,240,255,0.3); text-align: center; margin-bottom: 0.75rem; }
      .mock-grid { display: flex; gap: 0.5rem; }
      .mock-btn { flex: 1; padding: 0.5rem; border: 1px solid; border-radius: 4px; background: transparent; font-family: monospace; font-size: 10px; cursor: pointer; transition: all 0.2s; }
      .mock-btn:hover { background: rgba(255,255,255,0.05); }

      .error-alert { margin-bottom: 1rem; padding: 0.75rem; background: rgba(255,0,60,0.1); border: 1px solid var(--red); border-radius: 6px; color: var(--red); font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }

      .glitch { position: relative; }
      .glitch::before, .glitch::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      .glitch::before { animation: glitch1 3s infinite; clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%); transform: translate(-2px); color: var(--red); opacity: 0.5; }
      .glitch::after { animation: glitch2 3s infinite; clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%); transform: translate(2px); color: var(--green); opacity: 0.5; }
      @keyframes glitch1 { 0%, 92%, 100% { transform: translate(-2px) } 93% { transform: translate(4px) } 95% { transform: translate(-3px) } 97% { transform: translate(2px) } }
      @keyframes glitch2 { 0%, 92%, 100% { transform: translate(2px) } 94% { transform: translate(-4px) } 96% { transform: translate(3px) } 98% { transform: translate(-1px) } }
    `}</style>
  )
}
