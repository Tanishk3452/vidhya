import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Brain, HelpCircle, BookOpen,
  BarChart3, TrendingUp, Trophy, ChevronLeft, ChevronRight,
  Zap, Settings, LogOut, Youtube
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
  const location = useLocation()

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={22} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h2>NeuroLearn</h2>
          <span>AI Learning Companion</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-item-icon">
              <Icon size={19} />
            </div>
            <span className="nav-item-text">{label}</span>
          </NavLink>
        ))}

        <div className="divider" style={{ margin: '1rem 0 0.5rem' }} />
        <div className="sidebar-section-label">Settings</div>

        <NavLink to="/settings" className="nav-item">
          <div className="nav-item-icon"><Settings size={19} /></div>
          <span className="nav-item-text">Settings</span>
        </NavLink>

        <NavLink to="/" className="nav-item">
          <div className="nav-item-icon"><LogOut size={19} /></div>
          <span className="nav-item-text">Sign Out</span>
        </NavLink>
      </nav>

      {/* User */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">A</div>
          <div className="sidebar-user-info">
            <h4>Aryan Sharma</h4>
            <p>JEE Advanced 2025</p>
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
