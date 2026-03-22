import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Camera, Bot, Loader, Upload, Image, X, Wifi, WifiOff } from 'lucide-react'
import { doubtAPI, checkBackend } from '../services/api'

const sampleResponses = [
  {
    q: "What is Newton's third law?",
    a: `**Newton's Third Law of Motion** states:\n\n> "For every action, there is an equal and opposite reaction."\n\n**Step-by-step explanation:**\n\n1. **Action Force**: When object A exerts a force on object B\n2. **Reaction Force**: Object B simultaneously exerts an equal force on A — in the *opposite* direction\n3. **Key Point**: These forces act on *different objects*, so they don't cancel each other\n\n**Examples:**\n• 🚀 Rocket: exhaust gases pushed down → rocket pushed up\n• 🏊 Swimming: push water backward → body moves forward\n• 🔫 Gun recoil: bullet pushed forward → gun pushed backward\n\n**Formula:** F₁₂ = −F₂₁`
  },
  {
    q: "Explain integration by parts",
    a: `**Integration by Parts** formula:\n\n∫ u dv = uv − ∫ v du\n\n**How to choose u and v? Use LIATE rule:**\n1. **L** – Logarithmic functions (ln x)\n2. **I** – Inverse trig (sin⁻¹x, tan⁻¹x)\n3. **A** – Algebraic (x², x³)\n4. **T** – Trigonometric (sin x, cos x)\n5. **E** – Exponential (eˣ, aˣ)\n\nChoose u as whichever comes first in LIATE.\n\n**Example:** ∫ x eˣ dx\n→ u = x, dv = eˣ dx\n→ du = dx, v = eˣ\n→ = xeˣ − ∫ eˣ dx = **xeˣ − eˣ + C**`
  },
  {
    q: "What causes hybridization in chemistry?",
    a: `**Hybridization** is the mixing of atomic orbitals to form new hybrid orbitals with equivalent energy.\n\n**Types:**\n\n| Type | Shape | Example | Bond Angle |\n|------|-------|---------|-----------|\n| sp | Linear | BeCl₂ | 180° |\n| sp² | Trigonal planar | BF₃ | 120° |\n| sp³ | Tetrahedral | CH₄ | 109.5° |\n\n**Why it happens:**\n1. Atoms hybridize to minimize electron repulsion\n2. Creates more stable bond arrangements\n3. Explains molecular geometry observed experimentally\n\n💡 **Quick Tip:** Count electron pairs around central atom → that gives hybridization type!`
  }
]

const initialMessages = [
  {
    type: 'ai',
    content: "👋 Hi! I'm your **AI Tutor**. Ask me anything about JEE, NEET, or UPSC — you can type a question, record your voice, or upload an image of a problem!\n\nWhat doubt can I help you solve today?"
  }
]

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(108,99,255,0.15);padding:0.1rem 0.35rem;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>')
    .replace(/\n/g, '<br/>')
}

export default function DoubtSolver() {
  const [tab, setTab] = useState('text')
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [ocrResult, setOcrResult] = useState('')
  const [backendOnline, setBackendOnline] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    checkBackend().then(ok => setBackendOnline(ok))
  }, [])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { type: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const resp = await doubtAPI.solve(text)
      const data = resp.data
      setMessages(prev => [...prev, { type: 'ai', content: data.answer, subject: data.subject, ms: data.solved_in_ms }])
    } catch (err) {
      // Fallback to local responses if backend is offline
      const resp = sampleResponses.find(r =>
        text.toLowerCase().includes('newton') ? r.q.includes('Newton') :
        text.toLowerCase().includes('integr') ? r.q.includes('integration') :
        r.q.includes('hybrid')
      ) || sampleResponses[Math.floor(Math.random() * sampleResponses.length)]
      setMessages(prev => [...prev, { type: 'ai', content: resp.a }])
    } finally {
      setLoading(false)
    }
  }

  const handleVoice = () => {
    if (recording) {
      setRecording(false)
      const demo = "What is Newton's third law of motion?"
      setTranscript(demo)
    } else {
      setRecording(true)
      setTranscript('')
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setOcrText('Extracting text from image...')
    setTimeout(() => {
      setOcrText('If 2x + 3y = 12 and x + y = 5, find the values of x and y using substitution method.')
    }, 2000)
  }

  const solveOCR = () => {
    setOcrResult('')
    setTimeout(() => {
      setOcrResult(`**Solution using Substitution Method:**\n\nGiven:\n• 2x + 3y = 12  ...(1)\n• x + y = 5      ...(2)\n\nFrom equation (2): x = 5 − y\n\nSubstitute in equation (1):\n2(5 − y) + 3y = 12\n10 − 2y + 3y = 12\n10 + y = 12\n**y = 2**\n\nNow x = 5 − 2 = **x = 3**\n\n✅ Answer: x = 3, y = 2`)
    }, 1500)
  }

  const waveBars = Array.from({ length: 24 }, (_, i) => ({
    delay: `${(i * 0.05) % 0.8}s`,
    height: recording ? `${10 + Math.sin(i * 0.8) * 20 + 15}px` : '8px'
  }))

  return (
    <div style={{ animation:'fadeInUp 0.5s ease' }}>
      {/* Backend status badge */}
      {backendOnline !== null && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'0.4rem',
            padding:'0.3rem 0.75rem', borderRadius:'var(--radius-full)',
            background: backendOnline ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,107,0.1)',
            border: `1px solid ${backendOnline ? 'rgba(0,255,136,0.3)' : 'rgba(255,107,107,0.3)'}`,
            fontSize:'0.75rem', fontWeight:'700',
            color: backendOnline ? '#00ff88' : 'var(--accent)'
          }}>
            {backendOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
            {backendOnline ? 'Backend Connected — AI responses are live!' : 'Backend offline — using local fallback responses'}
          </div>
        </div>
      )}
      <div className="tab-bar" style={{ maxWidth:'500px' }}>
        {[
          { key:'text', icon:'💬', label:'Text Chat' },
          { key:'voice', icon:'🎙️', label:'Voice' },
          { key:'image', icon:'📸', label:'Image OCR' },
        ].map(({ key, icon, label }) => (
          <button key={key} className={`tab-btn ${tab===key?'active':''}`} onClick={() => setTab(key)} id={`tab-${key}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* TEXT TAB */}
      {tab === 'text' && (
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <div>
            <div className="chat-container">
              <div className="chat-messages" id="chat-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-msg ${msg.type}`}>
                    {msg.type === 'ai' && (
                      <div className="msg-header">
                        <Bot size={13} /> NeuroLearn AI
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
                ))}
                {loading && (
                  <div className="chat-msg ai">
                    <div className="msg-header"><Bot size={13} /> NeuroLearn AI</div>
                    <div style={{ display:'flex', gap:'5px', alignItems:'center', height:'20px' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{
                          width:'7px', height:'7px', borderRadius:'50%',
                          background:'var(--primary)', opacity:0.6,
                          animation:`pulse 1s ${i*0.2}s ease-in-out infinite`
                        }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-input-area">
                <input
                  className="input-field"
                  placeholder="Ask your doubt... (e.g. What is Newton's third law?)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                  style={{ flex:1 }}
                  id="chat-input"
                />
                <button className="btn btn-primary btn-icon" onClick={() => sendMessage(input)} id="send-btn">
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Quick Questions */}
            <div style={{ marginTop:'1rem' }}>
              <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>Quick questions:</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                {sampleResponses.map(r => (
                  <button
                    key={r.q}
                    className="btn btn-ghost btn-sm"
                    onClick={() => sendMessage(r.q)}
                  >
                    {r.q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VOICE TAB */}
      {tab === 'voice' && (
        <div style={{ maxWidth:'600px', margin:'0 auto' }}>
          <div className="card" style={{ padding:'2.5rem', textAlign:'center' }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'700', marginBottom:'0.5rem' }}>🎙️ Voice Doubt Solver</h3>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', marginBottom:'2rem' }}>
              Press the mic and speak your doubt clearly. Our AI will transcribe and solve it instantly.
            </p>

            {/* Waveform */}
            <div className="waveform" style={{ marginBottom:'2rem' }}>
              {waveBars.map((bar, i) => (
                <div
                  key={i}
                  className="wave-bar"
                  style={{
                    height: recording ? `${8 + ((i * 13) % 35)}px` : '8px',
                    animationDelay: bar.delay,
                    animationPlayState: recording ? 'running' : 'paused',
                    opacity: recording ? 1 : 0.4,
                    transition:'height 0.3s ease'
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleVoice}
              style={{
                width:'80px', height:'80px', borderRadius:'50%',
                background: recording ? 'var(--grad-accent)' : 'var(--grad-primary)',
                border:'none', display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', margin:'0 auto 1.5rem',
                boxShadow: recording ? '0 0 30px var(--accent-glow)' : '0 0 30px var(--primary-glow)',
                animation: recording ? 'glow-pulse 1s ease-in-out infinite' : 'none',
                transition:'var(--transition-spring)'
              }}
              id="mic-btn"
            >
              <Mic size={32} color="white" />
            </button>

            <div style={{ fontSize:'0.9rem', color:'var(--text-secondary)', marginBottom:'1.5rem' }}>
              {recording ? (
                <span style={{ color:'var(--accent)', fontWeight:'700' }}>🔴 Recording... Click to stop</span>
              ) : transcript ? (
                <span style={{ color:'var(--secondary)', fontWeight:'600' }}>✅ Recording complete</span>
              ) : (
                'Click the mic to start recording'
              )}
            </div>

            {transcript && (
              <div style={{
                background:'var(--bg-glass)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-md)', padding:'1rem',
                marginBottom:'1rem', textAlign:'left'
              }}>
                <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>Transcribed:</p>
                <p style={{ fontSize:'0.92rem', fontWeight:'500' }}>"{transcript}"</p>
              </div>
            )}

            {transcript && (
              <button
                className="btn btn-primary"
                style={{ width:'100%' }}
                onClick={() => {
                  setTab('text')
                  setTimeout(() => sendMessage(transcript), 100)
                }}
                id="solve-voice-btn"
              >
                <Bot size={16} /> Solve This Doubt
              </button>
            )}
          </div>
        </div>
      )}

      {/* IMAGE TAB */}
      {tab === 'image' && (
        <div style={{ maxWidth:'700px', margin:'0 auto' }}>
          <div className="card" style={{ marginBottom:'1.5rem', padding:'2rem' }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'700', marginBottom:'0.5rem' }}>📸 OCR Image Solver</h3>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', marginBottom:'1.5rem' }}>
              Upload a photo of any question from your textbook or paper. AI will extract and solve it.
            </p>

            {!imagePreview ? (
              <div
                className="upload-zone"
                onClick={() => fileRef.current.click()}
                id="upload-zone"
              >
                <Upload size={40} style={{ margin:'0 auto 1rem', color:'var(--primary-light)' }} />
                <p style={{ fontWeight:'600', marginBottom:'0.4rem' }}>Click or drag & drop image here</p>
                <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Supports JPG, PNG, WEBP</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display:'none' }}
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div>
                <div style={{ position:'relative', marginBottom:'1.25rem' }}>
                  <img
                    src={imagePreview}
                    alt="Uploaded question"
                    style={{ width:'100%', maxHeight:'250px', objectFit:'contain',
                      borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}
                  />
                  <button
                    onClick={() => { setImagePreview(null); setOcrText(''); setOcrResult('') }}
                    style={{
                      position:'absolute', top:'8px', right:'8px',
                      background:'rgba(0,0,0,0.7)', border:'none',
                      borderRadius:'50%', width:'28px', height:'28px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', color:'white'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* OCR Result */}
                <div style={{
                  background:'var(--bg-glass)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-md)', padding:'1rem', marginBottom:'1rem'
                }}>
                  <p style={{ fontSize:'0.75rem', color:'var(--primary-light)', fontWeight:'700', marginBottom:'0.4rem' }}>
                    📝 OCR Extracted Text:
                  </p>
                  <p style={{ fontSize:'0.9rem', color: ocrText.includes('Extracting') ? 'var(--text-muted)' : 'var(--text-primary)', fontStyle: ocrText.includes('Extracting') ? 'italic' : 'normal' }}>
                    {ocrText}
                  </p>
                </div>

                {ocrText && !ocrText.includes('Extracting') && (
                  <button className="btn btn-primary" style={{ width:'100%', marginBottom:'1rem' }} onClick={solveOCR} id="solve-ocr-btn">
                    <Bot size={16} /> Solve with AI
                  </button>
                )}

                {ocrResult && (
                  <div style={{
                    background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.2)',
                    borderRadius:'var(--radius-md)', padding:'1.25rem'
                  }}>
                    <p style={{ fontSize:'0.75rem', color:'var(--secondary)', fontWeight:'700', marginBottom:'0.75rem' }}>
                      ✅ AI Solution:
                    </p>
                    <div
                      style={{ fontSize:'0.9rem', lineHeight:'1.7' }}
                      dangerouslySetInnerHTML={{ __html: formatMessage(ocrResult) }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
