const STEPS = [
  { num: '01', title: 'Data Ingestion', desc: 'Raw NYC TLC trip records — 50M+ rows — are loaded, cleaned, and filtered for quality: valid coordinates, non-zero fares, realistic distances.' },
  { num: '02', title: 'Feature Engineering', desc: 'Trip duration, avg speed, pickup hour, day-of-week, weekend flag, and location IDs are derived and encoded into a fixed feature vector.' },
  { num: '03', title: 'Model Training', desc: 'LightGBM (Gradient Boosted Decision Trees) is trained with early stopping on a held-out validation set. Hyperparameters tuned via Optuna.' },
  { num: '04', title: 'Inference API', desc: 'FastAPI serves the pickled model. Each request reconstructs the feature vector, runs a forward pass, and returns a prediction + confidence interval in < 80ms.' },
]

const TEAM = [
  { initials: 'AK', name: 'Data Engineering', role: 'Pipeline & Feature Engineering' },
  { initials: 'ML', name: 'Model Research',   role: 'LightGBM Training & Evaluation' },
  { initials: 'UI', name: 'Frontend Design',  role: 'React Interface & UX' },
]

export default function AboutPage() {
  return (
    <main className="about-page">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-tag">ABOUT THIS PROJECT</div>
        <h1 className="about-hero-title">
          FARECAST<br />
          <span>EXPLAINED</span>
        </h1>
        <p className="about-hero-desc">
          An end-to-end machine learning pipeline — from raw NYC taxi data
          to a production-grade prediction API and polished frontend UI.
        </p>
      </section>

      {/* ── Pipeline ──────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="about-section-tag">THE PIPELINE</div>
        <h2 className="about-section-title">HOW IT WORKS</h2>
        <div className="pipeline">
          {STEPS.map((s, i) => (
            <div className="pipeline-step" key={i}>
              <div className="pipeline-num">{s.num}</div>
              <div className="pipeline-content">
                <div className="pipeline-title">{s.title}</div>
                <div className="pipeline-desc">{s.desc}</div>
              </div>
              {i < STEPS.length - 1 && <div className="pipeline-arrow">↓</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ────────────────────────────────────────────── */}
      <section className="about-section alt">
        <div className="about-section-tag">TECH STACK</div>
        <h2 className="about-section-title">BUILT WITH</h2>
        <div className="stack-grid">
          {[
            ['LightGBM', 'Gradient boosted trees — fast, accurate, low memory'],
            ['FastAPI',  'Async Python API framework — sub-100ms inference'],
            ['Pandas',   'Data wrangling & feature matrix construction'],
            ['Joblib',   'Model serialization & fast pickle I/O'],
            ['React 18', 'Component-based UI with hooks & state management'],
            ['Vite',     'Lightning-fast dev server & bundler'],
          ].map(([name, desc], i) => (
            <div className="stack-item" key={i}>
              <div className="stack-name">{name}</div>
              <div className="stack-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Model Card ────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="about-section-tag">MODEL CARD</div>
        <h2 className="about-section-title">PERFORMANCE</h2>
        <div className="model-card-grid">
          {[
            ['Training Data',   'NYC TLC 2022–2023'],
            ['Algorithm',       'LightGBM (GBDT)'],
            ['Val RMSE',        '~$2.10'],
            ['Val MAE',         '~$1.40'],
            ['R² Score',        '0.983'],
            ['Features',        '11 input + 1 derived'],
            ['Inference Time',  '< 80ms (p99)'],
            ['Model Size',      '~4.2 MB (pickled)'],
          ].map(([k, v], i) => (
            <div className="mc-row" key={i}>
              <span className="mc-key">{k}</span>
              <span className="mc-val">{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────── */}
      <section className="about-section alt">
        <div className="about-section-tag">CONTRIBUTORS</div>
        <h2 className="about-section-title">THE TEAM</h2>
        <div className="team-grid">
          {TEAM.map((t, i) => (
            <div className="team-card" key={i}>
              <div className="team-avatar">{t.initials}</div>
              <div className="team-info">
                <div className="team-name">{t.name}</div>
                <div className="team-role">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="about-footer">
        <span>FARECAST · NYC Taxi Fare Predictor · 2026</span>
        <span className="footer-dot">◈</span>
        <span>Built with LightGBM + FastAPI + React</span>
      </footer>
    </main>
  )
}
