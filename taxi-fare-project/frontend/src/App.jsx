import { useState, useEffect, useCallback, useRef } from 'react'
import Nav from './components/Nav'
import HomePage from './pages/HomePage'
import PredictPage from './pages/PredictPage'
import AboutPage from './pages/AboutPage'
import './App.css'

const PAGES = ['home', 'predict', 'about']

// ── Page transition shell ─────────────────────────────────────────────────────
function PageShell({ children, pageKey, isActive, direction }) {
  const [render, setRender]   = useState(isActive)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isActive) {
      setRender(true)
      timerRef.current = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      )
    } else {
      setVisible(false)
      timerRef.current = setTimeout(() => setRender(false), 450)
    }
    return () => {
      clearTimeout(timerRef.current)
      cancelAnimationFrame(timerRef.current)
    }
  }, [isActive])

  if (!render) return null

  return (
    <div
      className={`page-shell page-shell--${direction} ${visible ? 'page-shell--in' : 'page-shell--out'}`}
      data-page={pageKey}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

// ── Gold-bar transition overlay ───────────────────────────────────────────────
function TransitionOverlay({ active }) {
  return (
    <div className={`t-overlay ${active ? 't-overlay--active' : ''}`} aria-hidden="true">
      <div className="t-bar" style={{ '--i': 0 }} />
      <div className="t-bar" style={{ '--i': 1 }} />
      <div className="t-bar" style={{ '--i': 2 }} />
    </div>
  )
}

// ── Keyboard navigation hint ──────────────────────────────────────────────────
function KeyboardHint() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(id)
  }, [])
  return (
    <div className={`kb-hint ${visible ? 'kb-hint--on' : ''}`} aria-hidden="true">
      <kbd>←</kbd><kbd>→</kbd>&nbsp; navigate pages
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState('home')
  const [transitioning, setTrans] = useState(false)
  const [direction, setDir]       = useState('forward')
  const [serverOnline, setServer] = useState(null)   // null=probing  true=ok  false=down
  const queueRef                  = useRef(null)
  const transRef                  = useRef(false)     // sync copy for event handlers

  // Keep ref in sync so keyboard handler always sees fresh value
  useEffect(() => { transRef.current = transitioning }, [transitioning])

  // ── Backend health probe (every 30 s) ─────────────────────────────────────
  useEffect(() => {
    const probe = async () => {
      try {
        const res  = await fetch('http://127.0.0.1:8000/health', {
          signal: AbortSignal.timeout(2500),
        })
        const data = await res.json()
        setServer(data.status === 'ok')
      } catch {
        setServer(false)
      }
    }
    probe()
    const id = setInterval(probe, 30_000)
    return () => clearInterval(id)
  }, [])

  // ── Scroll-to-top on page change ──────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [page])

  // ── Core navigation with animated transition ──────────────────────────────
  const navigate = useCallback((next) => {
    if (next === page || transRef.current) {
      queueRef.current = next
      return
    }
    const fi = PAGES.indexOf(page)
    const ti = PAGES.indexOf(next)
    setDir(ti > fi ? 'forward' : 'backward')
    setTrans(true)

    setTimeout(() => {
      setPage(next)
      setTimeout(() => {
        setTrans(false)
        if (queueRef.current && queueRef.current !== next) {
          const q = queueRef.current
          queueRef.current = null
          navigate(q)
        }
      }, 260)
    }, 190)
  }, [page]) // eslint-disable-line

  // ── Arrow-key navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowRight') {
        navigate(PAGES[(PAGES.indexOf(page) + 1) % PAGES.length])
      }
      if (e.key === 'ArrowLeft') {
        navigate(PAGES[(PAGES.indexOf(page) - 1 + PAGES.length) % PAGES.length])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, navigate])

  return (
    <div className="app" data-page={page}>
      <Nav page={page} setPage={navigate} serverOnline={serverOnline} />

      <TransitionOverlay active={transitioning} />

      <div className="pages-container">
        {PAGES.map((p) => (
          <PageShell key={p} pageKey={p} isActive={page === p} direction={direction}>
            {p === 'home'    && <HomePage    setPage={navigate} serverOnline={serverOnline} />}
            {p === 'predict' && <PredictPage setPage={navigate} />}
            {p === 'about'   && <AboutPage   setPage={navigate} />}
          </PageShell>
        ))}
      </div>

      <KeyboardHint />
    </div>
  )
}