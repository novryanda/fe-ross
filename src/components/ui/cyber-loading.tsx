'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface CyberLoadingProps {
  title?: string
  messages?: string[]
}

export function CyberStyles() {
  return (
    <style>{`
      :root {
        --cyan: #00f0ff;
        --green: #39ff14;
        --red: #ff003c;
        --dark: #0a0e17;
      }

      .loading-screen-global {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: var(--dark);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: monospace;
        color: #c0d8e8;
      }

      .robot-eye-global {
        width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--cyan); position: relative;
        animation: eyePulseGlobal 1.5s ease-in-out infinite; margin-bottom: 30px;
        box-shadow: 0 0 30px rgba(0,240,255,0.4), inset 0 0 20px rgba(0,240,255,0.1);
      }

      .robot-eye-global::before {
        content: ''; position: absolute; width: 20px; height: 20px; background: var(--cyan);
        border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%);
        box-shadow: 0 0 15px var(--cyan); animation: pupilMoveGlobal 2s ease-in-out infinite;
      }

      @keyframes eyePulseGlobal { 0%, 100% { box-shadow: 0 0 30px rgba(0,240,255,0.4), inset 0 0 20px rgba(0,240,255,0.1) } 50% { box-shadow: 0 0 50px rgba(0,240,255,0.7), inset 0 0 30px rgba(0,240,255,0.3) } }
      @keyframes pupilMoveGlobal { 0%, 100% { transform: translate(-50%, -50%) } 25% { transform: translate(-30%, -50%) } 50% { transform: translate(-50%, -30%) } 75% { transform: translate(-70%, -50%) } }

      .loading-bar-wrap-global { width: 300px; height: 4px; background: rgba(0,240,255,0.1); border-radius: 2px; overflow: hidden; border: 1px solid rgba(0,240,255,0.2); margin-bottom: 20px; }
      .loading-bar-global { height: 100%; width: 0; background: linear-gradient(90deg, var(--cyan), var(--green)); border-radius: 2px; animation: loadFillGlobal 3.5s ease-in-out forwards; box-shadow: 0 0 10px var(--cyan); }
      @keyframes loadFillGlobal { 0% { width: 0 } 100% { width: 100% } }

      .loading-text-global { font-size: 13px; color: var(--cyan); letter-spacing: 2px; }
      .loading-text-global span { animation: blinkGlobal 0.6s step-end infinite; }
      @keyframes blinkGlobal { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }

      .boot-lines-global { font-size: 11px; color: rgba(0,240,255,0.5); margin-top: 20px; text-align: left; width: 300px; height: 100px; overflow: hidden; }
      .boot-line-global { opacity: 0; animation: bootFadeGlobal 0.3s forwards; margin-bottom: 4px; }
      @keyframes bootFadeGlobal { from { opacity: 0; transform: translateX(-10px) } to { opacity: 1; transform: translateX(0) } }
    `}</style>
  )
}

export function CyberLoading({ 
  title = "INITIALIZING ROSS SYSTEM", 
  messages = [
    '[OK] Initializing kernel modules...',
    '[OK] Loading ROSS framework v4.2.1...',
    '[OK] Establishing secure tunnel...',
    '[OK] System ready.'
  ] 
}: CyberLoadingProps) {
  const [lines, setLines] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    let current = 0
    const interval = setInterval(() => {
      if (current < messages.length) {
        setLines(prev => [...prev, messages[current]])
        current++
      } else {
        clearInterval(interval)
      }
    }, 350)
    return () => clearInterval(interval)
  }, [messages])

  if (!mounted) return null

  return createPortal(
    <div className="loading-screen-global">
      <CyberStyles />
      <div className="robot-eye-global" />
      <div className="loading-bar-wrap-global">
        <div className="loading-bar-global" />
      </div>
      <div className="loading-text-global">{title}<span>_</span></div>
      <div className="boot-lines-global">
        {lines.map((line, i) => (
          <div key={i} className="boot-line-global">{line}</div>
        ))}
      </div>
    </div>,
    document.body
  )
}
