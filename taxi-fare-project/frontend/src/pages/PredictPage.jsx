import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const FIELDS = [
  { name: 'trip_distance',     label: 'Distance',    unit: 'mi',  icon: '◈', min: 0.1, max: 50,  step: 0.1 },
  { name: 'trip_duration_min', label: 'Duration',    unit: 'min', icon: '◷', min: 1,   max: 180, step: 1   },
  { name: 'passenger_count',   label: 'Passengers',  unit: 'pax', icon: '◉', min: 1,   max: 6,   step: 1   },
]

const HOUR_LABELS = ['12AM','1','2','3','4','5','6','7','8','9','10','11','12PM','1','2','3','4','5','6','7','8','9','10','11']
const DAY_LABELS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function AnimatedNumber({ value, decimals = 2 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (value == null) return
    const target = parseFloat(value)
    const duration = 900
    const startTime = performance.now()
    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setDisplay(target * eased)
      if (t < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
  }, [value])

  return <span>${display.toFixed(decimals)}</span>
}

function SliderRow({ config, value, onChange }) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100
  return (
    <div className="p-field">
      <div className="p-field-header">
        <span className="p-field-icon">{config.icon}</span>
        <span className="p-field-label">{config.label}</span>
        <span className="p-field-val">{value}<span className="p-field-unit"> {config.unit}</span></span>
      </div>
      <div className="p-slider-wrap">
        <div className="p-slider-fill" style={{ width: `${pct}%` }} />
        <input
          type="range" name={config.name}
          min={config.min} max={config.max} step={config.step} value={value}
          onChange={onChange} className="p-slider"
        />
      </div>
    </div>
  )
}

export default function PredictPage() {
  const [form, setForm] = useState({
    PULocationID: 263, DOLocationID: 161,
    passenger_count: 1, trip_distance: 2.5,
    trip_duration_min: 15, pickup_hour: 14,
    pickup_dayofweek: 2, RatecodeID: 1,
    payment_type: 1, pickup_month: 5, is_weekend: 0,
  })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  const handle = (e) => {
    const v = parseFloat(e.target.value) || 0
    const name = e.target.name
    const updates = { [name]: v }
    if (name === 'pickup_dayofweek') updates.is_weekend = v >= 5 ? 1 : 0
    setForm(f => ({ ...f, ...updates }))
    setResult(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await axios.post('http://127.0.0.1:8000/predict', form)
      setResult(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Estimate speed for display
  const speed = form.trip_duration_min > 0
    ? (form.trip_distance / (form.trip_duration_min / 60)).toFixed(1)
    : '0.0'

  return (
    <div className={`predict-page ${mounted ? 'mounted' : ''}`}>

      {/* ── Left Panel ───────────────────────────────────────── */}
      <aside className="p-panel p-panel-left">
        <div className="p-panel-label">TRIP PARAMETERS</div>

        <form onSubmit={submit} className="p-form">
          {/* Primary sliders */}
          <div className="p-section">
            {FIELDS.map(f => (
              <SliderRow key={f.name} config={f} value={form[f.name]} onChange={handle} />
            ))}
          </div>

          <div className="p-divider" />

          {/* Pickup Hour */}
          <div className="p-section">
            <div className="p-section-title">PICKUP TIME</div>
            <div className="p-hour-grid">
              {HOUR_LABELS.map((lbl, i) => (
                <button
                  key={i} type="button"
                  className={`p-hour-btn ${form.pickup_hour === i ? 'active' : ''}`}
                  onClick={() => { setForm(f => ({ ...f, pickup_hour: i })); setResult(null) }}
                >{lbl}</button>
              ))}
            </div>
          </div>

          <div className="p-divider" />

          {/* Day of Week */}
          <div className="p-section">
            <div className="p-section-title">DAY OF WEEK</div>
            <div className="p-day-grid">
              {DAY_LABELS.map((lbl, i) => (
                <button
                  key={i} type="button"
                  className={`p-day-btn ${form.pickup_dayofweek === i ? 'active' : ''} ${i >= 5 ? 'weekend' : ''}`}
                  onClick={() => { setForm(f => ({ ...f, pickup_dayofweek: i, is_weekend: i >= 5 ? 1 : 0 })); setResult(null) }}
                >{lbl}</button>
              ))}
            </div>
            {form.is_weekend === 1 && <div className="weekend-badge">WEEKEND RATES MAY APPLY</div>}
          </div>

          <div className="p-divider" />

          <button type="submit" disabled={loading} className="p-submit-btn">
            {loading
              ? <><span className="p-spinner" /> COMPUTING…</>
              : 'PREDICT FARE →'}
          </button>
        </form>
      </aside>

      {/* ── Right Panel ──────────────────────────────────────── */}
      <section className="p-panel p-panel-right">

        {/* Live trip summary */}
        <div className="p-summary">
          <div className="p-summary-title">TRIP SUMMARY</div>
          <div className="p-summary-grid">
            <div className="p-summary-item">
              <span className="p-s-val">{form.trip_distance}</span>
              <span className="p-s-lbl">miles</span>
            </div>
            <div className="p-summary-item">
              <span className="p-s-val">{form.trip_duration_min}</span>
              <span className="p-s-lbl">minutes</span>
            </div>
            <div className="p-summary-item">
              <span className="p-s-val">{speed}</span>
              <span className="p-s-lbl">mph avg</span>
            </div>
            <div className="p-summary-item">
              <span className="p-s-val">{form.passenger_count}</span>
              <span className="p-s-lbl">passenger{form.passenger_count > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="p-result-area">
          {!result && !error && !loading && (
            <div className="p-idle">
              <div className="p-idle-icon">◈</div>
              <div className="p-idle-text">Adjust parameters and hit<br /><strong>PREDICT FARE</strong></div>
            </div>
          )}

          {loading && (
            <div className="p-loading">
              <div className="p-loading-ring" />
              <div className="p-loading-text">RUNNING MODEL</div>
            </div>
          )}

          {error && (
            <div className="p-error">
              <div className="p-error-code">ERR · CONNECTION REFUSED</div>
              <div className="p-error-msg">Cannot reach FastAPI at 127.0.0.1:8000<br />Make sure your backend server is running.</div>
            </div>
          )}

          {result && (
            <div className="p-result">
              <div className="p-result-label">ESTIMATED FARE</div>
              <div className="p-result-price">
                <AnimatedNumber value={result.predicted_fare} />
              </div>

              <div className="p-range-row">
                <div className="p-range-end">${result.interval_low}</div>
                <div className="p-range-track">
                  <div className="p-range-fill" />
                  <div className="p-range-dot" />
                </div>
                <div className="p-range-end">${result.interval_high}</div>
              </div>
              <div className="p-range-caption">95% confidence interval</div>

              {result.avg_speed_mph && (
                <div className="p-meta-row">
                  <span>Avg speed</span>
                  <span>{result.avg_speed_mph} mph</span>
                </div>
              )}
              <div className="p-meta-row">
                <span>Margin</span>
                <span>±${result.margin ?? '2.50'}</span>
              </div>
              <div className="p-meta-row">
                <span>Currency</span>
                <span>USD</span>
              </div>
            </div>
          )}
        </div>

        {/* Decorative grid */}
        <div className="p-deco-grid" aria-hidden="true">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="p-deco-cell" />
          ))}
        </div>
      </section>
    </div>
  )
}
