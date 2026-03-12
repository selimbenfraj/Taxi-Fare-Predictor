export default function Nav({ page, setPage }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => setPage('home')}>
        <span className="nav-logo-icon">◈</span>
        <span className="nav-logo-text">FARECAST</span>
      </div>
      <div className="nav-links">
        {['home', 'predict', 'about'].map((p) => (
          <button
            key={p}
            className={`nav-link ${page === p ? 'active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>
      <button className="nav-cta" onClick={() => setPage('predict')}>
        GET FARE →
      </button>
    </nav>
  )
}
