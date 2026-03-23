import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Bot, Loader, Upload, X, Wifi, WifiOff } from 'lucide-react'
import axios from 'axios'
import katex from 'katex'
import 'katex/dist/katex.min.css'


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = {
  solveText: (question, subject) =>
    axios.post(`${BASE_URL}/api/doubt/solve`, { question, subject }),

  solveImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${BASE_URL}/api/doubt/solve-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  checkBackend: () =>
    axios.get(`${BASE_URL}/health`).then(() => true).catch(() => false),
}

const sampleResponses = [
  {
    q: "What is Newton's third law?",
    a: `**Newton's Third Law of Motion** states:\n\n> "For every action, there is an equal and opposite reaction."\n\n**Step-by-step explanation:**\n\n1. **Action Force**: When object A exerts a force on object B\n2. **Reaction Force**: Object B simultaneously exerts an equal force on A — in the *opposite* direction\n3. **Key Point**: These forces act on *different objects*, so they don't cancel each other\n\n**Examples:**\n• Rocket: exhaust gases pushed down → rocket pushed up\n• Swimming: push water backward → body moves forward\n\n**Formula:** F₁₂ = −F₂₁`
  },
  {
    q: "Explain integration by parts",
    a: `**Integration by Parts** formula:\n\n∫ u dv = uv − ∫ v du\n\n**LIATE rule for choosing u:**\n1. **L** – Logarithmic\n2. **I** – Inverse trig\n3. **A** – Algebraic\n4. **T** – Trigonometric\n5. **E** – Exponential\n\n**Example:** ∫ x eˣ dx → u = x, dv = eˣ dx → **xeˣ − eˣ + C**`
  },
  {
    q: "What causes hybridization?",
    a: `**Hybridization** is the mixing of atomic orbitals to form new hybrid orbitals.\n\n| Type | Shape | Example | Bond Angle |\n|------|-------|---------|-----------|\n| sp | Linear | BeCl₂ | 180° |\n| sp² | Trigonal planar | BF₃ | 120° |\n| sp³ | Tetrahedral | CH₄ | 109.5° |\n\n💡 **Tip:** Count electron pairs around central atom → that gives hybridization type!`
  }
]

const initialMessages = [
  {
    type: 'ai',
    content: "👋 Hi! I'm your **AI Tutor**. Ask me anything about JEE, NEET, or UPSC — type a question, record your voice, or upload an image of a problem!\n\nWhat doubt can I help you solve today?"
  }
]

const renderMath = (text) => {
  if (!text) return ''
  return text.replace(/\$([^$]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false, displayMode: false })
    } catch {
      return math
    }
  })
}

const formatMessage = (text) => {
  if (!text) return ''

  return text
    // Clean LaTeX math — convert common patterns to readable text
    .replace(/\$([^$]+)\$/g, (_, math) => {
      return math
        .replace(/\\Omega/g, 'Ω')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\delta/g, 'δ')
        .replace(/\\theta/g, 'θ')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\mu/g, 'μ')
        .replace(/\\pi/g, 'π')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\tau/g, 'τ')
        .replace(/\\phi/g, 'φ')
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·')
        .replace(/\\div/g, '÷')
        .replace(/\\pm/g, '±')
        .replace(/\\leq/g, '≤')
        .replace(/\\geq/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\infty/g, '∞')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\^{([^}]+)}/g, '^$1')
        .replace(/\^(\d)/g, '^$1')
        .replace(/_{([^}]+)}/g, '_$1')
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\ /g, ' ')
        .replace(/\\/g, '')
        .trim()
    })
    // Remove ### from headers but keep the text
    .replace(/^###\s*/gm, '')
    .replace(/^##\s*/gm, '')
    .replace(/^#\s*/gm, '')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code style="background:rgba(108,99,255,0.15);padding:0.1rem 0.35rem;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>')
    // Line breaks
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
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrResult, setOcrResult] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [backendOnline, setBackendOnline] = useState(null)
  const fileRef = useRef()
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    api.checkBackend().then(ok => setBackendOnline(ok))

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        let t = ''
        for (let i = 0; i < event.results.length; i++) {
          t += event.results[i][0].transcript
        }
        setTranscript(t)
      }

      recognitionRef.current.onerror = (event) => {
        if (event.error !== 'no-speech') setRecording(false)
      }

      recognitionRef.current.onend = () => setRecording(false)
    }
  }, [])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { type: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const resp = await api.solveText(text)
      const data = resp.data
      setMessages(prev => [...prev, {
        type: 'ai',
        content: data.answer,
        subject: data.subject,
        ms: data.solved_in_ms
      }])
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
    if (!recognitionRef.current) {
      alert("Microphone access is not supported in this browser. Please try Chrome or Edge.")
      return
    }
    if (recording) {
      setRecording(false)
      recognitionRef.current.stop()
    } else {
      setRecording(true)
      setTranscript('')
      try { recognitionRef.current.start() }
      catch (e) { setRecording(false) }
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setOcrStatus('Image ready. Click "Solve with AI" to analyse.')
    setOcrResult('')
  }

  // Drag and drop support
  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    // Assign to the hidden file input so solveOCR can read it
    const dt = new DataTransfer()
    dt.items.add(file)
    fileRef.current.files = dt.files
    setImagePreview(URL.createObjectURL(file))
    setOcrStatus('Image ready. Click "Solve with AI" to analyse.')
    setOcrResult('')
  }

  const solveOCR = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setOcrStatus('No file selected. Please upload an image first.')
      return
    }

    setOcrResult('')
    setOcrLoading(true)
    setOcrStatus('Sending image to Gemini Vision AI...')

    try {
      const res = await api.solveImage(file)
      setOcrResult(res.data.answer)
      setOcrStatus('Done! AI has generated the solution below.')
    } catch (err) {
      console.error('OCR error:', err)
      const msg = err.response?.data?.detail
        || (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Is the backend running on port 8000?' : null)
        || 'Failed to analyse image. Please try again.'
      setOcrStatus(msg)
      setOcrResult('')
    } finally {
      setOcrLoading(false)
    }
  }

  const clearImage = () => {
    setImagePreview(null)
    setOcrStatus('')
    setOcrResult('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const waveBars = Array.from({ length: 24 }, (_, i) => ({
    delay: `${(i * 0.05) % 0.8}s`,
  }))

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
      {/* Backend status badge */}
      {backendOnline !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)',
            background: backendOnline ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,107,0.1)',
            border: `1px solid ${backendOnline ? 'rgba(0,255,136,0.3)' : 'rgba(255,107,107,0.3)'}`,
            fontSize: '0.75rem', fontWeight: '700',
            color: backendOnline ? '#00ff88' : 'var(--accent)'
          }}>
            {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {backendOnline
              ? 'Backend Connected — AI responses are live!'
              : 'Backend offline — using local fallback responses'}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ maxWidth: '500px' }}>
        {[
          { key: 'text', icon: '💬', label: 'Text Chat' },
          { key: 'voice', icon: '🎙️', label: 'Voice' },
          { key: 'image', icon: '📸', label: 'Image OCR' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── TEXT TAB ── */}
      {tab === 'text' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="chat-container">
            <div className="chat-messages" id="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.type}`}>
                  {msg.type === 'ai' && (
                    <div className="msg-header">
                      <Bot size={13} /> NeuroLearn AI
                      {msg.ms && <span style={{ marginLeft: 8, opacity: 0.5, fontSize: '0.7rem' }}>{msg.ms}ms</span>}
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                </div>
              ))}
              {loading && (
                <div className="chat-msg ai">
                  <div className="msg-header"><Bot size={13} /> NeuroLearn AI</div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '20px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: 'var(--primary)', opacity: 0.6,
                        animation: `pulse 1s ${i * 0.2}s ease-in-out infinite`
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area">
              <input
                className="input-field"
                placeholder="Ask your doubt... (e.g. What is Newton's third law?)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary btn-icon"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {/* Quick questions */}
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quick questions:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
      )}

      {/* ── VOICE TAB ── */}
      {tab === 'voice' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>🎙️ Voice Doubt Solver</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '2rem' }}>
              Press the mic and speak your doubt clearly.
            </p>

            {/* Waveform */}
            <div className="waveform" style={{ marginBottom: '2rem' }}>
              {waveBars.map((bar, i) => (
                <div
                  key={i}
                  className="wave-bar"
                  style={{
                    height: recording ? `${8 + ((i * 13) % 35)}px` : '8px',
                    animationDelay: bar.delay,
                    animationPlayState: recording ? 'running' : 'paused',
                    opacity: recording ? 1 : 0.4,
                    transition: 'height 0.3s ease'
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleVoice}
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: recording ? 'var(--grad-accent)' : 'var(--grad-primary)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', margin: '0 auto 1.5rem',
                boxShadow: recording ? '0 0 30px var(--accent-glow)' : '0 0 30px var(--primary-glow)',
                transition: 'var(--transition-spring)'
              }}
            >
              <Mic size={32} color="white" />
            </button>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {recording
                ? <span style={{ color: 'var(--accent)', fontWeight: '700' }}>🔴 Listening... Click mic again when done.</span>
                : transcript
                  ? <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>✅ Audio transcribed</span>
                  : 'Click the mic to begin recording'}
            </div>

            {transcript && (
              <div style={{
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', textAlign: 'left'
              }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Transcribed:</p>
                <p style={{ fontSize: '0.92rem', fontWeight: '500' }}>"{transcript}"</p>
              </div>
            )}

            {transcript && (
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => { setTab('text'); setTimeout(() => sendMessage(transcript), 100) }}
              >
                <Bot size={16} /> Solve This Doubt
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── IMAGE TAB ── */}
      {tab === 'image' && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>📸 OCR Image Solver</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Upload a photo of any question from your textbook or paper. Gemini Vision AI will extract and solve it.
            </p>

            {/* Hidden file input — always rendered so fileRef stays valid */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            {!imagePreview ? (
              /* Drop zone */
              <div
                className="upload-zone"
                onClick={() => fileRef.current.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                style={{ cursor: 'pointer' }}
              >
                <Upload size={40} style={{ margin: '0 auto 1rem', color: 'var(--primary-light)', display: 'block' }} />
                <p style={{ fontWeight: '600', marginBottom: '0.4rem', textAlign: 'center' }}>Click or drag & drop image here</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Supports JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div>
                {/* Image preview with remove button */}
                <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                  <img
                    src={imagePreview}
                    alt="Uploaded question"
                    style={{
                      width: '100%', maxHeight: '280px', objectFit: 'contain',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
                    }}
                  />
                  <button
                    onClick={clearImage}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(0,0,0,0.7)', border: 'none',
                      borderRadius: '50%', width: '28px', height: '28px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'white'
                    }}
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Status message */}
                {ocrStatus && (
                  <div style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem',
                    fontSize: '0.88rem', color: 'var(--text-secondary)'
                  }}>
                    {ocrLoading && (
                      <Loader size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
                    )}
                    {ocrStatus}
                  </div>
                )}

                {/* Solve button */}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  onClick={solveOCR}
                  disabled={ocrLoading}
                >
                  {ocrLoading
                    ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing...</>
                    : <><Bot size={16} /> Solve with AI</>
                  }
                </button>

                {/* AI solution */}
                {ocrResult && (
                  <div style={{
                    background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: 'var(--radius-md)', padding: '1.25rem'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', marginBottom: '0.75rem' }}>
                      ✅ AI Solution:
                    </p>
                    <div
                      style={{ fontSize: '0.9rem', lineHeight: '1.7' }}
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