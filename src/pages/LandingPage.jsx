import { useNavigate } from 'react-router-dom'
import {
  Zap, ArrowRight, Star, CheckCircle
} from 'lucide-react'

const features = [
  {
    icon: '🧠', label: 'AI Study Planner',
    desc: 'Personalized daily schedules based on your weak areas, goals, and available time.',
    color: '#6c63ff', bg: 'rgba(108,99,255,0.12)'
  },
  {
    icon: '🤖', label: 'Multimodal Doubt Solver',
    desc: 'Ask doubts via text, voice, or image. Get step-by-step solutions like a human tutor.',
    color: '#00d4aa', bg: 'rgba(0,212,170,0.12)'
  },
  {
    icon: '🎯', label: 'Adaptive Questions',
    desc: 'Questions adjust dynamically. Difficulty shifts based on your real-time performance.',
    color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)'
  },
  {
    icon: '📊', label: 'Performance Analytics',
    desc: 'Visual dashboards tracking accuracy, speed, and consistency across all topics.',
    color: '#ffd93d', bg: 'rgba(255,217,61,0.12)'
  },
  {
    icon: '📈', label: 'Rank Prediction',
    desc: 'AI predicts your exam rank with tailored improvement suggestions.',
    color: '#b44eff', bg: 'rgba(180,78,255,0.12)'
  },
  {
    icon: '🎮', label: 'Gamified Learning',
    desc: 'Earn XP, maintain streaks, and unlock achievements to stay motivated.',
    color: '#4ecdc4', bg: 'rgba(78,205,196,0.12)'
  },
  {
    icon: '🎙️', label: 'Voice Assistant',
    desc: 'Hands-free interaction — speak your doubts and get instant solutions.',
    color: '#ff9a3c', bg: 'rgba(255,154,60,0.12)'
  },
  {
    icon: '📸', label: 'OCR Image Solver',
    desc: 'Snap a question image, extract text with OCR, and get instant AI solutions.',
    color: '#00aaff', bg: 'rgba(0,170,255,0.12)'
  },
  {
    icon: '⚡', label: 'Offline AI Mode',
    desc: 'Works without internet using HuggingFace models — ideal for low-connectivity areas.',
    color: '#00ff88', bg: 'rgba(0,255,136,0.12)'
  },
]

const exams = ['JEE Advanced', 'JEE Mains', 'NEET', 'UPSC', 'GATE', 'CAT']

export default function LandingPage({ onLogin }) {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    onLogin()
    navigate('/dashboard')
  }

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'10px',
            background:'var(--grad-primary)', display:'flex',
            alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 15px var(--primary-glow)'
          }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:'800', fontSize:'1.1rem' }}>
            <span className="text-gradient">NeuroLearn</span>{' '}
            <span style={{ color:'var(--text-secondary)', fontWeight:'400' }}>AI</span>
          </span>
        </div>

        <div style={{ display:'flex', gap:'2rem', fontSize:'0.9rem',color:'var(--text-secondary)' }}>
          {['Features','About','Pricing','Blog'].map(t => (
            <span key={t} style={{ cursor:'pointer', transition:'color 0.2s' }}
              onMouseOver={e=>e.target.style.color='var(--text-primary)'}
              onMouseOut={e=>e.target.style.color='var(--text-secondary)'}>{t}</span>
          ))}
        </div>

        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/auth')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={handleGetStarted}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-eyebrow">
          <Star size={13} />
          Trusted by 10,000+ Students Across India
        </div>

        <h1 className="hero-title">
          Don't Just Study Hard.<br />
          <span className="text-gradient">Study Smart with AI.</span>
        </h1>

        <p className="hero-subtitle">
          NeuroLearn AI is your personal AI mentor for JEE, NEET & UPSC prep.
          Adaptive study plans, instant doubt solving, and real-time rank predictions —
          all in one platform.
        </p>

        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" id="start-free-btn" onClick={handleGetStarted}>
            Start Learning Free <ArrowRight size={18} />
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/auth')}>
            Sign In
          </button>
        </div>

        <div className="hero-stats">
          {[
            { val: '10K+', label: 'Active Students' },
            { val: '2M+', label: 'Questions Solved' },
            { val: '94%', label: 'Accuracy Improved' },
            { val: '4.9★', label: 'Student Rating' },
          ].map(({ val, label }) => (
            <div key={label} className="hero-stat">
              <h3>{val}</h3>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exam Badges */}
      <div style={{
        display:'flex', justifyContent:'center', gap:'0.75rem',
        flexWrap:'wrap', padding:'0 2rem 3rem', position:'relative', zIndex:1
      }}>
        <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', alignSelf:'center' }}>Supports:</span>
        {exams.map(e => (
          <span key={e} className="badge badge-primary" style={{ fontSize:'0.82rem' }}>{e}</span>
        ))}
      </div>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-heading">
          <div className="badge badge-primary" style={{ margin:'0 auto 1rem', width:'fit-content' }}>
            🚀 All Features
          </div>
          <h2>Everything You Need to Crack Your Exam</h2>
          <p>From personalized study plans to AI-powered analytics — we've got every aspect of your preparation covered.</p>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',
          gap:'1.25rem'
        }}>
          {features.map(({ icon, label, desc, color, bg }) => (
            <div key={label} className="feature-card">
              <div className="feature-icon-wrap" style={{ background: bg, color }}>
                <span style={{ fontSize:'1.6rem' }}>{icon}</span>
              </div>
              <h3>{label}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding:'5rem 5%', textAlign:'center',
        position:'relative', zIndex:1
      }}>
        <div style={{
          background:'var(--bg-card)',
          border:'1px solid var(--border)',
          borderRadius:'var(--radius-xl)',
          padding:'4rem 2rem',
          maxWidth:'700px',
          margin:'0 auto',
          boxShadow:'var(--shadow-glow)'
        }}>
          <h2 style={{ fontSize:'2rem', marginBottom:'1rem' }}>
            Ready to Transform Your <span className="text-gradient">Preparation?</span>
          </h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'2rem', fontSize:'1.05rem' }}>
            Join thousands of students who improved their rank with NeuroLearn AI.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleGetStarted} id="cta-join-btn">
            Join for Free — No Credit Card <ArrowRight size={18} />
          </button>
          <div style={{
            display:'flex', justifyContent:'center', gap:'1.5rem',
            marginTop:'1.5rem', flexWrap:'wrap'
          }}>
            {['Free to start','No ads','AI-powered','Offline mode'].map(t => (
              <span key={t} style={{ display:'flex', alignItems:'center', gap:'0.4rem',
                fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                <CheckCircle size={14} color="var(--secondary)" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop:'1px solid var(--border)',
        padding:'2rem 5%',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        fontSize:'0.82rem', color:'var(--text-muted)',
        position:'relative', zIndex:1, flexWrap:'wrap', gap:'1rem'
      }}>
        <span>© 2025 NeuroLearn AI. Built with ❤️ for Indian students.</span>
        <span>"Don't just study hard. Study smart with AI."</span>
      </footer>
    </div>
  )
}
