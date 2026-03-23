import { Bell, Search, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header({ title, subtitle }) {
  const [user, setUser] = useState({})
  const [exam, setExam] = useState('JEE Advanced')

  useEffect(() => {
    // Read real user from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('neurolearn_user') || '{}')
      setUser(stored)
      if (stored.exam) setExam(stored.exam)
    } catch {
      setUser({})
    }

    // Listen for storage changes (e.g. after login)
    const handleStorage = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('neurolearn_user') || '{}')
        setUser(stored)
        if (stored.exam) setExam(stored.exam)
      } catch {
        setUser({})
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontFamily: "'Hind',sans-serif", fontSize: '0.78rem' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="header-right">
        {/* Exam Mode — shows real exam from user profile */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)', padding: '0.35rem 0.75rem',
          fontSize: '0.8rem'
        }}>
          <Target size={14} color="var(--saffron)" />
          <select
            value={exam}
            onChange={e => setExam(e.target.value)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-primary)',
              fontSize: '0.8rem', cursor: 'pointer', outline: 'none', fontWeight: '600'
            }}
          >
            <option value="JEE Advanced">JEE Advanced</option>
            <option value="JEE Mains">JEE Mains</option>
            <option value="NEET">NEET</option>
            <option value="UPSC">UPSC</option>
          </select>
        </div>

        {/* XP — real value from user profile */}
        <div className="header-xp" style={{
          borderColor: 'rgba(255,153,51,0.25)',
          background: 'rgba(255,153,51,0.07)'
        }}>
          <span style={{ fontSize: '0.75rem' }}>⚡</span>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--saffron-light)' }}>
            {user.xp ? user.xp.toLocaleString() : '0'} XP
          </span>
        </div>

        {/* Streak — real value from user profile */}
        <div className="header-streak">
          🔥 {user.streak || 0} days
        </div>

        {/* Search */}
        <button className="header-btn" id="search-btn" aria-label="Search">
          <Search size={17} />
        </button>

        {/* Notifications */}
        <button className="header-btn" id="notif-btn" aria-label="Notifications"
          style={{ position: 'relative' }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: '5px', right: '5px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent)',
            border: '1.5px solid var(--bg-base)'
          }} />
        </button>
      </div>
    </header>
  )
}