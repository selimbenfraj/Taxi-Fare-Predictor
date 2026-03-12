import { useEffect, useState } from 'react'

const STATS = [
  { value: '98.3%', label: 'Model Accuracy' },
  { value: '< 80ms', label: 'Response Time' },
  { value: '50M+', label: 'Trips Trained On' },
  { value: '±$2.1', label: 'Avg. Margin' },
]

const FEATURES = [
  {
    icon: '⬡',
    title: 'LightGBM Engine',
    desc: 'Gradient-boosted decision trees trained on 50M+ NYC TLC trip records for maximum accuracy.',
  },
  {
    icon: '◎',
    title: 'Confidence Intervals',
    desc: 'Every prediction ships with a dynamic margin that scales with trip complexity.',
  },
  {
    icon: '⟁',
    title: 'Real-Time Inference',
    desc: 'FastAPI backend delivers predictions in under 80ms — faster than hailing the cab.',
  },
]

export default function HomePage({ setPage }) {
  const [mounted, setMounted] = useState(false)
  const [ticker, setTicker] = useState(0)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
    const id = setInterval(() => setTicker((t) => t + 1), 2800)
    return () => clearInterval(id)
  }, [])

  const fares = ['$12.40', '$34.80', '$8.20', '$57.10', '$22.60', '$91.30']

  return (
    <main className="home">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-glow" />

        <div className={`hero-content ${mounted ? 'mounted' : ''}`}>
          <div className="hero-eyebrow">
            <span className="dot-pulse" />
            NYC · MACHINE LEARNING · FARE INTELLIGENCE
          </div>

          <h1 className="hero-title">
            KNOW YOUR<br />
            <span className="hero-title-gold">FARE</span><br />
            BEFORE YOU RIDE
          </h1>

          <p className="hero-desc">
            Powered by LightGBM and trained on 50 million NYC taxi trips.
            Get instant, accurate fare estimates with confidence intervals —
            no surprises, no guesswork.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => setPage('predict')}>
              PREDICT MY FARE →
            </button>
            <button className="btn-ghost" onClick={() => setPage('about')}>
              HOW IT WORKS
            </button>
          </div>
        </div>

        {/* Floating fare ticker */}
        <div className={`fare-ticker ${mounted ? 'mounted' : ''}`}>
          <div className="ticker-label">LIVE ESTIMATES</div>
          <div className="ticker-fare" key={ticker}>
            {fares[ticker % fares.length]}
          </div>
          <div className="ticker-sub">Manhattan → JFK · Now</div>
          <div className="ticker-bar">
            <div className="ticker-bar-fill" key={`bar-${ticker}`} />
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="stats-band">
        {STATS.map((s, i) => (
          <div className="stat-item" key={i}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="features">
        <div className="section-header">
          <span className="section-tag">UNDER THE HOOD</span>
          <h2 className="section-title">BUILT FOR PRECISION</h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Band ─────────────────────────────────────────────────── */}
      <section className="cta-band">
        <div className="cta-band-inner">
          <h2 className="cta-title">READY TO ESTIMATE?</h2>
          <p className="cta-sub">Enter your trip details and get a fare in milliseconds.</p>
          <button className="btn-primary large" onClick={() => setPage('predict')}>
            OPEN PREDICTOR →
          </button>
        </div>
      </section>
    </main>
  )
}
