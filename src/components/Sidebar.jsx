import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Brain, HelpCircle, BookOpen,
  BarChart3, TrendingUp, Trophy, ChevronLeft, ChevronRight,
  Settings, LogOut, Youtube
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Study Planner', icon: Brain, path: '/planner' },
  { label: 'Doubt Solver', icon: HelpCircle, path: '/doubt-solver' },
  { label: 'Video Notes', icon: Youtube, path: '/youtube' },
  { label: 'Practice', icon: BookOpen, path: '/questions' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Rank Predictor', icon: TrendingUp, path: '/rank' },
  { label: 'Achievements', icon: Trophy, path: '/gamification' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    // Read real user from localStorage
    const loadUser = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('neurolearn_user') || '{}')
        setUser(stored)
      } catch {
        setUser({})
      }
    }
    loadUser()

    // Re-read if another tab updates storage (e.g. after login)
    window.addEventListener('storage', loadUser)
    return () => window.removeEventListener('storage', loadUser)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('neurolearn_token')
    localStorage.removeItem('neurolearn_user')
    // Also clear old keys in case they exist
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  // Avatar letter — first letter of name, fallback to '?'
  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : '?'

  // Exam year display
  const examLabel = user.exam || 'JEE Advanced'

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-text" style={{ paddingLeft: '0.2rem' }}>
          <h2 style={{
            fontFamily: "'Hind', 'Outfit', sans-serif",
            fontWeight: '900',
            fontSize: '1.8rem',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'baseline'
          }}>
            <span style={{
              background: 'linear-gradient(to right, #2563eb, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              paddingRight: '2px'
            }}>विद्या</span>
            <span style={{ color: 'var(--text-primary)' }}>AI</span>
          </h2>
          <span style={{ marginTop: '0.2rem', display: 'block' }}>Your AI Learning Companion</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label" style={{ color: 'var(--primary)', opacity: 0.8 }}>
          + Main Menu
        </div>

        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-item-icon"><Icon size={19} /></div>
            <span className="nav-item-text">{label}</span>
          </NavLink>
        ))}

        <div className="divider" style={{ margin: '1rem 0 0.5rem' }} />
        <div className="sidebar-section-label" style={{ color: 'var(--primary)', opacity: 0.8 }}>
          + Settings
        </div>

        <NavLink to="/settings" className="nav-item">
          <div className="nav-item-icon"><Settings size={19} /></div>
          <span className="nav-item-text">Settings</span>
        </NavLink>

        {/* Sign out clears auth and redirects to landing */}
        <button
          onClick={handleSignOut}
          className="nav-item"
          style={{
            width: '100%', textAlign: 'left', background: 'none',
            border: 'none', cursor: 'pointer', color: 'inherit'
          }}
        >
          <div className="nav-item-icon"><LogOut size={19} /></div>
          <span className="nav-item-text">Sign Out</span>
        </button>
      </nav>

      {/* User info — real data from localStorage */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div
            className="sidebar-user-avatar"
            style={{
              background: 'var(--grad-primary)',
              boxShadow: '0 2px 10px var(--primary-glow)'
            }}
          >
            {avatarLetter}
          </div>
          <div className="sidebar-user-info">
            <h4>{user.name || 'Guest'}</h4>
            <p>
              {examLabel}
              {user.streak ? ` · 🔥 ${user.streak} days` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-12px',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 101,
          color: 'var(--text-muted)',
          transition: 'var(--transition)',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}