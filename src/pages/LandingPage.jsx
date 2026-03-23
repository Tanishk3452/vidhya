import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, CheckCircle
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
    <div className="landing-page" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Soft Glow to emulate the mockup's airy gradient */}
      <div style={{ position: 'absolute', top: '10%', left: '30%', width: '40%', height: '500px', background: 'var(--grad-logo)', opacity: 0.1, filter: 'blur(100px)', zIndex: -1, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', top: '30%', left: '10%', width: '30%', height: '400px', background: 'var(--secondary)', opacity: 0.05, filter: 'blur(120px)', zIndex: -1, borderRadius: '50%' }}></div>

      {/* Navbar Minimalist Layout */}
      <nav className="landing-nav" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.25rem 4rem',
        borderBottom: 'none',
        background: 'transparent'
      }}>
        {/* Vidhya AI Logo */}
        <div style={{ display:'flex', alignItems:'center', cursor: 'pointer' }}>
          <span style={{ 
            fontFamily:"'Hind', 'Outfit', sans-serif", 
            fontWeight:'900', 
            fontSize:'1.8rem',
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
            <span style={{ color: '#1e293b' }}>AI</span>
          </span>
        </div>

        {/* Center Links */}
        <div style={{ display:'flex', gap:'2.5rem', fontSize:'0.95rem', color:'var(--text-secondary)', fontWeight: 500 }}>
          {['Features','Exams','How it works','Testimonials'].map(t => (
            <span key={t} style={{ cursor:'pointer', transition:'color 0.2s', fontFamily: "'Inter', sans-serif" }}
              onMouseOver={e=>e.target.style.color='var(--text-primary)'}
              onMouseOut={e=>e.target.style.color='var(--text-secondary)'}>{t}</span>
          ))}
        </div>

        {/* Right Nav Buttons */}
        <div style={{ display:'flex', alignItems: 'center', gap:'1.5rem' }}>
          <button style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: '0.95rem', color: '#1e293b', cursor: 'pointer' }} onClick={() => navigate('/auth')}>Log in</button>
          <button className="btn" onClick={handleGetStarted} style={{
            background: 'var(--primary-dark)', color: 'white', fontWeight: '600',
            boxShadow: '0 4px 14px var(--primary-glow)', border: 'none',
            padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-full)', cursor: 'pointer',
            fontSize: '0.95rem', fontFamily: "'Inter', sans-serif"
          }}>Get Started</button>
        </div>
      </nav>

      {/* Hero Central Section */}
      <section className="landing-hero" style={{ 
        textAlign: 'center', 
        maxWidth: '900px', 
        margin: '3rem auto 0', 
        padding: '0 2rem' 
      }}>
        {/* DevClash Pill Badge */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(59, 130, 246, 0.1)', 
          color: 'var(--primary-light)', 
          padding: '0.4rem 1.2rem', 
          borderRadius: '999px',
          fontWeight: '500',
          fontSize: '0.85rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          marginBottom: '2.5rem'
        }}>
          <span style={{ fontSize: '1rem' }}>✨</span> AI-Powered · DevClash 2026 · NIT Raipur
        </div>

        {/* Massive Logo Title */}
        <h1 style={{ 
          fontFamily:"'Hind', 'Outfit', sans-serif", 
          fontWeight:'900', 
          fontSize:'7rem', 
          lineHeight: '1.1',
          letterSpacing: '-0.03em',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline'
        }}>
          <span style={{ 
            background: 'linear-gradient(to right, #3b82f6, #06b6d4)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            paddingRight: '6px'
          }}>विद्या</span>
          <span style={{ color: '#0f172a' }}>AI</span>
        </h1>

        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#334155',
          fontFamily: "'Inter', sans-serif",
          lineHeight: '1.2'
        }}>
          Your AI Learning Companion
        </h2>
        
        <h3 style={{
          fontSize: '1.4rem',
          fontWeight: '500',
          color: '#64748b',
          fontFamily: "'Inter', sans-serif",
          marginTop: '0.5rem',
          marginBottom: '2rem'
        }}>
          for <strong style={{color: '#1e293b'}}>JEE · NEET · UPSC</strong>
        </h3>

        <p style={{
          fontSize: '1.15rem',
          lineHeight: '1.7',
          color: '#475569',
          maxWidth: '800px',
          margin: '0 auto 3rem',
          fontFamily: "'Inter', sans-serif",
        }}>
          A retention-first AI system that remembers what you studied, adapts to your pace,
          and autonomously ensures nothing is forgotten. Built for India's competitive exam
          aspirants.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginBottom: '5rem' }}>
          <button onClick={handleGetStarted} style={{
            background: '#2563eb', color: 'white', fontWeight: '600',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)', border: 'none',
            padding: '1rem 2rem', borderRadius: '16px', cursor: 'pointer',
            fontSize: '1.05rem', fontFamily: "'Inter', sans-serif",
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'transform 0.2s'
          }}>
            Start Learning Free <ArrowRight size={18} />
          </button>
          
          <button style={{
            background: 'white', color: '#0f172a', fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0',
            padding: '1rem 2rem', borderRadius: '16px', cursor: 'pointer',
            fontSize: '1.05rem', fontFamily: "'Inter', sans-serif",
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'transform 0.2s',
            pointerEvents: 'none' // Demo button placeholder
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            View Demo
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-heading">
          <div className="badge badge-saffron" style={{ margin:'0 auto 1rem', width:'fit-content', fontFamily:"'Hind',sans-serif" }}>
            🪷 सभी Features
          </div>
          <h2>Everything You Need to Crack Your Exam</h2>
          <p>Personalized study plans se lekar AI-powered analytics tak — हमने आपकी तैयारी का हर पहलू cover किया है।</p>
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
          <div style={{ fontFamily:"'Hind',sans-serif", fontSize:'0.85rem', color:'var(--saffron-light)', marginBottom:'0.75rem', letterSpacing:'0.04em' }}>
            ✦ आपकी सफलता, हमारा संकल्प ✦
          </div>
          <h2 style={{ fontSize:'2rem', marginBottom:'1rem' }}>
            Ready to Transform Your <span style={{ background:'var(--grad-saffron)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Preparation?</span>
          </h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'2rem', fontSize:'1.05rem' }}>
            Thousands of students ne अपनी rank improve की है न्यूरोLearn AI के साथ। आप भी शुरू करें।
          </p>
          <button className="btn btn-lg" onClick={handleGetStarted} id="cta-join-btn" style={{
            background:'var(--grad-saffron)', color:'white', fontWeight:'700',
            boxShadow:'0 6px 25px var(--saffron-glow)'
          }}>
            <span style={{ fontFamily:"'Hind',sans-serif" }}>मुफ्त Join करें</span>&nbsp;— No Credit Card&nbsp;<ArrowRight size={18} />
          </button>
          <div style={{
            display:'flex', justifyContent:'center', gap:'1.5rem',
            marginTop:'1.5rem', flexWrap:'wrap'
          }}>
            {['Free to start','No ads','AI-powered','Offline mode'].map(t => (
              <span key={t} style={{ display:'flex', alignItems:'center', gap:'0.4rem',
                fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                <CheckCircle size={14} color="var(--saffron)" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop:'1px solid var(--border)',
        padding:'2rem 4rem',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        fontSize:'0.9rem', color:'var(--text-secondary)',
        position:'relative', zIndex:1, flexWrap:'wrap', gap:'1rem',
        background: 'white'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ 
              background: 'linear-gradient(to right, #2563eb, #06b6d4)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Hind', sans-serif",
              fontWeight: 800
          }}>विद्या</span>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:'900', color:'var(--text-primary)' }}>AI</span>
          <span style={{ color:'var(--border)', margin:'0 10px' }}>|</span>
          <span>© 2026 · DevClash NIT Raipur</span>
        </div>
        <span style={{ fontStyle:'italic' }}>"A retention-first AI system"</span>
      </footer>
    </div>
  )
}
