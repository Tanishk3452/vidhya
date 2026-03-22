import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { authAPI } from '../services/api'

const examOptions = ['JEE Advanced', 'JEE Mains', 'NEET', 'UPSC', 'GATE', 'CAT']

const features = [
  { icon: '🧠', text: 'AI-powered adaptive learning' },
  { icon: '📈', text: 'Real-time rank prediction' },
  { icon: '🎯', text: 'Personalized study plans' },
  { icon: '⚡', text: 'Offline AI support' },
]

export default function AuthPage({ onLogin }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [exam, setExam] = useState('JEE Advanced')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await authAPI.login({ email, password })
      } else {
        res = await authAPI.register({ name, email, password, exam })
      }
      const { access_token, user } = res.data
      localStorage.setItem('neurolearn_token', access_token)
      localStorage.setItem('neurolearn_user', JSON.stringify(user))
      onLogin()
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Is the backend running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login({ email: 'aryan@neurolearn.ai', password: 'demo1234' })
      const { access_token, user } = res.data
      localStorage.setItem('neurolearn_token', access_token)
      localStorage.setItem('neurolearn_user', JSON.stringify(user))
      onLogin()
      navigate('/dashboard')
    } catch (err) {
      // Backend offline — still allow demo access
      onLogin()
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div style={{ maxWidth:'420px', width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'3rem' }}>
            <div style={{
              width:'40px', height:'40px', borderRadius:'10px',
              background:'var(--grad-primary)', display:'flex',
              alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 15px var(--primary-glow)'
            }}>
              <Zap size={20} color="white" />
            </div>
            <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:'800', fontSize:'1.2rem' }}>
              <span className="text-gradient">NeuroLearn</span>{' '}
              <span style={{ color:'var(--text-secondary)', fontWeight:'400' }}>AI</span>
            </span>
          </div>

          <h2 style={{ fontSize:'1.8rem', fontWeight:'800', marginBottom:'0.75rem', fontFamily:"'Outfit',sans-serif" }}>
            Your Personal<br /><span className="text-gradient">AI Mentor</span>
          </h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'2.5rem', lineHeight:'1.7' }}>
            Join thousands of students cracking JEE, NEET & UPSC with AI-powered personalized learning.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {features.map(({ icon, text }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <span style={{ fontSize:'1.2rem' }}>{icon}</span>
                <span style={{ fontSize:'0.9rem', color:'var(--text-secondary)', fontWeight:'500' }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop:'3rem', padding:'1.25rem',
            background:'rgba(108,99,255,0.08)',
            border:'1px solid rgba(108,99,255,0.2)',
            borderRadius:'var(--radius-lg)'
          }}>
            <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', fontStyle:'italic', lineHeight:'1.6' }}>
              "NeuroLearn AI helped me improve my JEE rank from 15,000 to 3,200 in just 3 months!"
            </div>
            <div style={{ marginTop:'0.75rem', fontSize:'0.8rem', fontWeight:'700', color:'var(--primary-light)' }}>
              — Priya Sharma, IIT Delhi (CSE '24)
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Toggle */}
          <div style={{
            display:'flex', gap:'0.25rem',
            background:'var(--bg-surface)', borderRadius:'var(--radius-md)',
            padding:'0.3rem', marginBottom:'1.75rem',
            border:'1px solid var(--border)'
          }}>
            {[['login','Sign In'], ['register','Sign Up']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex:1, padding:'0.55rem', borderRadius:'8px',
                  fontWeight:'600', fontSize:'0.88rem', transition:'var(--transition)',
                  background: mode === m ? 'var(--grad-primary)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 2px 10px var(--primary-glow)' : 'none',
                  cursor:'pointer', border:'none'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize:'1.3rem', fontWeight:'800', marginBottom:'0.35rem', fontFamily:"'Outfit',sans-serif" }}>
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </h3>
          <p style={{ fontSize:'0.83rem', color:'var(--text-muted)', marginBottom:'1.5rem' }}>
            {mode === 'login' ? 'Sign in to continue your learning journey' : 'Start your AI-powered exam prep today'}
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {mode === 'register' && (
              <div>
                <label className="input-label">Full Name</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Aryan Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  id="name-input"
                />
              </div>
            )}

            <div>
              <label className="input-label">Email Address</label>
              <input
                className="input-field"
                type="email"
                placeholder="aryan@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                id="email-input"
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position:'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  id="password-input"
                  style={{ paddingRight:'2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position:'absolute', right:'0.75rem', top:'50%',
                    transform:'translateY(-50%)', background:'none', border:'none',
                    color:'var(--text-muted)', cursor:'pointer'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="input-label">Target Exam</label>
                <select
                  className="input-field"
                  value={exam}
                  onChange={e => setExam(e.target.value)}
                  id="exam-select"
                >
                  {examOptions.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}

            {error && (
              <div style={{
                display:'flex', alignItems:'center', gap:'0.5rem',
                padding:'0.75rem 1rem', borderRadius:'var(--radius-md)',
                background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)',
                fontSize:'0.83rem', color:'var(--accent)'
              }}>
                <AlertCircle size={15} style={{ flexShrink:0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              id="auth-submit-btn"
              style={{ width:'100%', padding:'0.85rem', marginTop:'0.5rem', fontSize:'0.95rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span className="spinner" style={{ width:'16px', height:'16px' }} />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                id="demo-login-btn"
                onClick={handleDemoLogin}
                disabled={loading}
                style={{
                  width:'100%', padding:'0.75rem',
                  borderRadius:'var(--radius-md)',
                  background:'rgba(0,212,170,0.08)',
                  border:'1px solid rgba(0,212,170,0.3)',
                  color:'var(--secondary)', fontWeight:'700',
                  fontSize:'0.88rem', cursor:'pointer',
                  transition:'var(--transition)'
                }}
              >
                ⚡ Try Demo Account
              </button>
            )}
          </form>

          <div style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={{ color:'var(--primary-light)', fontWeight:'700', cursor:'pointer' }}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
