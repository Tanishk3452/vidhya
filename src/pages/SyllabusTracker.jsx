import { useState, useEffect, useCallback, useRef } from 'react'
import {
    CheckCircle, Circle, ChevronDown, ChevronRight,
    BookOpen, Loader2, RotateCcw, CheckSquare, Square,
    Upload, FileText, X, AlertCircle
} from 'lucide-react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getStoredUser = () => {
    try { return JSON.parse(localStorage.getItem('neurolearn_user') || '{}') } catch { return {} }
}

const EXAM_OPTIONS = ['JEE', 'NEET', 'UPSC']

const subjectColors = {
    Physics: { color: '#6c63ff', bg: 'rgba(108,99,255,0.1)' },
    Chemistry: { color: '#00d4aa', bg: 'rgba(0,212,170,0.1)' },
    Mathematics: { color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' },
    Biology: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    'General Studies I': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'General Studies II': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    'General Studies III': { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    'General Studies IV': { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
}

const COLORS = ['#6c63ff', '#00d4aa', '#ff6b6b', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']
let colorIdx = 0

const getColor = (subject) => {
    if (subjectColors[subject]) return subjectColors[subject]
    const color = COLORS[colorIdx % COLORS.length]
    colorIdx++
    return { color, bg: `${color}1a` }
}

function Ring({ percent, size = 52, color = '#6c63ff' }) {
    const r = (size - 6) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (percent / 100) * circ
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
                strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }} strokeLinecap="round" />
        </svg>
    )
}

export default function SyllabusTracker() {
    const user = getStoredUser()
    const userId = user.id || 'demo-user-001'
    const fileRef = useRef()

    const [exam, setExam] = useState(() => {
        const u = getStoredUser()
        if (u.exam?.includes('NEET')) return 'NEET'
        if (u.exam?.includes('UPSC')) return 'UPSC'
        return 'JEE'
    })

    const [customExamName, setCustomExamName] = useState('')
    const [hasCustom, setHasCustom] = useState(false)
    const [syllabus, setSyllabus] = useState({})
    const [ticks, setTicks] = useState({})
    const [stats, setStats] = useState({ total: 0, done: 0, percent: 0, subject_stats: {} })
    const [loading, setLoading] = useState(true)
    const [expandedSubjects, setExpandedSubjects] = useState({})
    const [expandedTopics, setExpandedTopics] = useState({})
    const [toast, setToast] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [showUploadArea, setShowUploadArea] = useState(false)

    const showToast = (msg) => {
        setToast(msg)
        setTimeout(() => setToast(''), 3000)
    }

    // Check if user has a custom syllabus on mount
    useEffect(() => {
        axios.get(`${BASE_URL}/api/tracker/has-custom?user_id=${userId}`)
            .then(res => {
                if (res.data.has_custom) {
                    setHasCustom(true)
                    setCustomExamName(res.data.exam_name)
                }
            })
            .catch(() => { })
    }, [userId])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [sylRes, progRes] = await Promise.all([
                axios.get(`${BASE_URL}/api/tracker/syllabus?exam=${exam}&user_id=${userId}`),
                axios.get(`${BASE_URL}/api/tracker/progress?user_id=${userId}&exam=${exam}`),
            ])
            setSyllabus(sylRes.data.syllabus || {})
            setTicks(progRes.data.ticks || {})
            setStats({
                total: progRes.data.total || 0,
                done: progRes.data.done || 0,
                percent: progRes.data.percent || 0,
                subject_stats: progRes.data.subject_stats || {},
            })
            const firstSubject = Object.keys(sylRes.data.syllabus || {})[0]
            if (firstSubject) setExpandedSubjects({ [firstSubject]: true })
        } catch (err) {
            console.error('Tracker load error:', err)
        } finally {
            setLoading(false)
        }
    }, [exam, userId])

    useEffect(() => { loadData() }, [loadData])

    // ── PDF Upload ─────────────────────────────────────────────────────────────
    const handlePdfUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.type !== 'application/pdf') {
            setUploadError('Please upload a PDF file.')
            return
        }
        if (file.size > 20 * 1024 * 1024) {
            setUploadError('File too large. Max 20MB.')
            return
        }

        setUploadError('')
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await axios.post(
                `${BASE_URL}/api/tracker/parse-pdf?user_id=${userId}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
            )

            if (res.data.success) {
                setHasCustom(true)
                setCustomExamName(res.data.exam_name)
                setShowUploadArea(false)
                setExam('CUSTOM')
                showToast(
                    `✅ "${res.data.exam_name}" parsed — ${res.data.subject_count} subjects, ` +
                    `${res.data.topic_count} topics, ${res.data.subtopic_count} subtopics!`
                )
            } else {
                setUploadError(res.data.error || 'Failed to parse PDF.')
            }
        } catch (err) {
            setUploadError(err.code === 'ECONNABORTED'
                ? 'Request timed out. Large PDFs may take up to 60 seconds.'
                : 'Upload failed. Check backend connection.')
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    // ── Tick handlers ──────────────────────────────────────────────────────────
    const handleTick = async (subject, topic, subtopic, currentVal) => {
        const key = `${subject}|${topic}|${subtopic}`
        const newVal = !currentVal
        setTicks(prev => ({ ...prev, [key]: newVal }))
        updateLocalStats(newVal ? 1 : -1, subject)
        try {
            await axios.post(`${BASE_URL}/api/tracker/tick`, { user_id: userId, key, checked: newVal })
        } catch {
            setTicks(prev => ({ ...prev, [key]: currentVal }))
            updateLocalStats(currentVal ? 1 : -1, subject)
            showToast('Failed to save. Try again.')
        }
    }

    const handleTickTopic = async (subject, topic, subtopics, allDone) => {
        const keys = subtopics.map(st => `${subject}|${topic}|${st}`)
        const newVal = !allDone
        const newTicks = { ...ticks }
        keys.forEach(k => { newTicks[k] = newVal })
        setTicks(newTicks)
        try {
            await axios.post(`${BASE_URL}/api/tracker/tick-bulk`, { user_id: userId, keys, checked: newVal })
            await loadData()
            showToast(newVal ? `✅ ${topic} marked complete!` : `${topic} unmarked`)
        } catch {
            setTicks(ticks)
            showToast('Failed to save.')
        }
    }

    const updateLocalStats = (delta, subject) => {
        setStats(prev => {
            const ss = { ...prev.subject_stats }
            if (ss[subject]) {
                const newDone = Math.max(0, ss[subject].done + delta)
                ss[subject] = {
                    ...ss[subject],
                    done: newDone,
                    percent: Math.round((newDone / ss[subject].total) * 100)
                }
            }
            const newDone = Math.max(0, prev.done + delta)
            return { ...prev, done: newDone, percent: Math.round((newDone / prev.total) * 100), subject_stats: ss }
        })
    }

    const toggleSubject = (subject) =>
        setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }))

    const toggleTopic = (key) =>
        setExpandedTopics(prev => ({ ...prev, [key]: !prev[key] }))

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ animation: 'fadeInUp 0.5s ease' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                    background: 'var(--bg-card)', border: '1px solid var(--border-glow)',
                    borderRadius: 'var(--radius-md)', padding: '0.75rem 1.25rem',
                    fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)', maxWidth: '360px'
                }}>{toast}</div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={22} style={{ color: 'var(--primary-light)' }} /> Syllabus Tracker
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
                        Tick topics as you complete them — saved automatically
                    </p>
                </div>

                {/* Exam selector */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {EXAM_OPTIONS.map(e => (
                        <button key={e} onClick={() => setExam(e)} style={{
                            padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                            border: `1px solid ${exam === e ? 'var(--primary-light)' : 'var(--border)'}`,
                            background: exam === e ? 'rgba(108,99,255,0.15)' : 'var(--bg-glass)',
                            color: exam === e ? 'var(--primary-light)' : 'var(--text-muted)',
                            fontWeight: exam === e ? '700' : '500',
                            fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s'
                        }}>{e}</button>
                    ))}
                    {hasCustom && (
                        <button onClick={() => setExam('CUSTOM')} style={{
                            padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                            border: `1px solid ${exam === 'CUSTOM' ? '#f59e0b' : 'var(--border)'}`,
                            background: exam === 'CUSTOM' ? 'rgba(245,158,11,0.15)' : 'var(--bg-glass)',
                            color: exam === 'CUSTOM' ? '#f59e0b' : 'var(--text-muted)',
                            fontWeight: exam === 'CUSTOM' ? '700' : '500',
                            fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                            <FileText size={12} /> {customExamName.length > 12 ? customExamName.slice(0, 12) + '…' : customExamName}
                        </button>
                    )}
                </div>
            </div>

            {/* PDF Upload Section */}
            <div style={{ marginBottom: '1.25rem' }}>
                {!showUploadArea ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.75rem 1.25rem',
                        border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-glass)'
                    }}>
                        <FileText size={16} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {hasCustom ? `Custom syllabus loaded: "${customExamName}"` : 'Upload your own syllabus PDF'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                {hasCustom
                                    ? 'AI parsed your PDF. Upload a new one to replace it.'
                                    : 'Gemini AI will read your PDF and create a custom tracker'}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowUploadArea(true)}
                            style={{
                                padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--primary-light)',
                                background: 'rgba(108,99,255,0.12)',
                                color: 'var(--primary-light)', fontWeight: '600',
                                fontSize: '0.8rem', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '0.35rem', flexShrink: 0
                            }}
                        >
                            <Upload size={13} /> {hasCustom ? 'Replace PDF' : 'Upload PDF'}
                        </button>
                    </div>
                ) : (
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '0.95rem' }}>Upload Syllabus PDF</h3>
                            <button onClick={() => { setShowUploadArea(false); setUploadError('') }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                            Upload any exam/course syllabus PDF. Gemini AI will extract all subjects, topics and subtopics
                            and create a fully trackable checklist automatically.
                        </p>

                        {/* Drop zone */}
                        <div
                            onClick={() => !uploading && fileRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault()
                                const file = e.dataTransfer.files[0]
                                if (file) {
                                    const dt = new DataTransfer()
                                    dt.items.add(file)
                                    fileRef.current.files = dt.files
                                    handlePdfUpload({ target: { files: dt.files } })
                                }
                            }}
                            style={{
                                border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
                                padding: '2rem', textAlign: 'center',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                background: uploading ? 'var(--bg-glass)' : 'transparent',
                                transition: 'border-color 0.2s',
                            }}
                            onMouseOver={e => !uploading && (e.currentTarget.style.borderColor = 'var(--primary-light)')}
                            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept="application/pdf"
                                style={{ display: 'none' }}
                                onChange={handlePdfUpload}
                                disabled={uploading}
                            />
                            {uploading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                    <Loader2 size={32} style={{ color: 'var(--primary-light)', animation: 'spin 1s linear infinite' }} />
                                    <div style={{ fontWeight: '600', color: 'var(--primary-light)' }}>Gemini is reading your PDF...</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This may take 15–30 seconds</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Click or drag & drop your PDF here</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Max 20MB · Text-based PDFs only (not scanned images)</div>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {uploadError && (
                            <div style={{
                                marginTop: '0.75rem', padding: '0.65rem 1rem',
                                background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontSize: '0.83rem', color: 'var(--accent)'
                            }}>
                                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                                {uploadError}
                            </div>
                        )}

                        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            💡 <strong>Works best with:</strong> Official exam syllabi, university course outlines, coaching material PDFs.
                            Scanned image PDFs won't work — use text-based PDFs.
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
                </div>
            ) : Object.keys(syllabus).length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', display: 'block' }} />
                    <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No Custom Syllabus Yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                        Upload your PDF above to create a tracker, or switch to JEE / NEET / UPSC.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowUploadArea(true)}>
                        <Upload size={15} /> Upload My Syllabus PDF
                    </button>
                </div>
            ) : (
                <>
                    {/* Overall progress */}
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Ring percent={stats.percent} size={88} color="var(--primary-light)" />
                                <div style={{ position: 'absolute', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-light)' }}>{stats.percent}%</div>
                                </div>
                            </div>

                            <div style={{ flex: 1, minWidth: '160px' }}>
                                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem' }}>
                                    {exam === 'CUSTOM' ? customExamName : exam} Progress
                                </div>
                                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                                    {stats.done} / {stats.total} subtopics completed
                                </div>
                                <div className="progress-bar" style={{ height: '7px' }}>
                                    <div className="progress-fill" style={{
                                        width: `${stats.percent}%`, transition: 'width 0.5s ease',
                                        background: stats.percent === 100 ? 'var(--secondary)' : 'var(--grad-primary)'
                                    }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {Object.entries(stats.subject_stats).slice(0, 6).map(([subject, s]) => {
                                    const sc = getColor(subject)
                                    return (
                                        <div key={subject} style={{ textAlign: 'center' }}>
                                            <Ring percent={s.percent} size={46} color={sc.color} />
                                            <div style={{ fontSize: '0.67rem', color: sc.color, fontWeight: '700', marginTop: '0.2rem' }}>
                                                {subject.length > 9 ? subject.slice(0, 8) + '…' : subject}
                                            </div>
                                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{s.done}/{s.total}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Subject accordions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {Object.entries(syllabus).map(([subject, topics]) => {
                            const sc = getColor(subject)
                            const ss = stats.subject_stats[subject] || { done: 0, total: 0, percent: 0 }
                            const isExpanded = expandedSubjects[subject]

                            return (
                                <div key={subject} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div
                                        onClick={() => toggleSubject(subject)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '0.9rem 1.25rem', cursor: 'pointer',
                                            background: isExpanded ? sc.bg : 'transparent',
                                            transition: 'background 0.2s',
                                            borderBottom: isExpanded ? '1px solid var(--border)' : 'none'
                                        }}
                                    >
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: sc.color }}>{subject}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {ss.done}/{ss.total} subtopics · {ss.percent}% complete
                                            </div>
                                        </div>
                                        <div style={{ width: '110px' }}>
                                            <div className="progress-bar" style={{ height: '4px' }}>
                                                <div style={{
                                                    height: '100%', width: `${ss.percent}%`,
                                                    background: sc.color, borderRadius: '9999px', transition: 'width 0.4s ease'
                                                }} />
                                            </div>
                                        </div>
                                        <div style={{
                                            color: 'var(--text-muted)', transition: 'transform 0.2s',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }}>
                                            <ChevronDown size={17} />
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '0.65rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                            {Object.entries(topics).map(([topic, subtopics]) => {
                                                const topicKey = `${subject}|${topic}`
                                                const isTopicExpanded = expandedTopics[topicKey]
                                                const doneSubs = subtopics.filter(st => ticks[`${subject}|${topic}|${st}`]).length
                                                const allDone = doneSubs === subtopics.length && subtopics.length > 0

                                                return (
                                                    <div key={topic} style={{
                                                        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                                                        overflow: 'hidden', background: 'var(--bg-glass)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.9rem' }}>
                                                            <button
                                                                onClick={e => { e.stopPropagation(); handleTickTopic(subject, topic, subtopics, allDone) }}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
                                                                title={allDone ? 'Unmark all' : 'Mark all complete'}
                                                            >
                                                                {allDone
                                                                    ? <CheckSquare size={17} style={{ color: sc.color }} />
                                                                    : <Square size={17} style={{ color: 'var(--text-muted)' }} />
                                                                }
                                                            </button>

                                                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleTopic(topicKey)}>
                                                                <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{topic}</span>
                                                                <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                    {doneSubs}/{subtopics.length}
                                                                </span>
                                                            </div>

                                                            <div style={{ width: '72px' }}>
                                                                <div className="progress-bar" style={{ height: '3px' }}>
                                                                    <div style={{
                                                                        height: '100%',
                                                                        width: `${subtopics.length ? Math.round((doneSubs / subtopics.length) * 100) : 0}%`,
                                                                        background: sc.color, borderRadius: '9999px', transition: 'width 0.3s ease'
                                                                    }} />
                                                                </div>
                                                            </div>

                                                            <div
                                                                onClick={() => toggleTopic(topicKey)}
                                                                style={{
                                                                    color: 'var(--text-muted)', cursor: 'pointer',
                                                                    transition: 'transform 0.2s',
                                                                    transform: isTopicExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                                                }}
                                                            >
                                                                <ChevronRight size={15} />
                                                            </div>
                                                        </div>

                                                        {isTopicExpanded && (
                                                            <div style={{
                                                                borderTop: '1px solid var(--border)',
                                                                padding: '0.4rem 0.9rem',
                                                                display: 'flex', flexDirection: 'column', gap: '0.15rem'
                                                            }}>
                                                                {subtopics.map(subtopic => {
                                                                    const key = `${subject}|${topic}|${subtopic}`
                                                                    const checked = !!ticks[key]
                                                                    return (
                                                                        <div
                                                                            key={subtopic}
                                                                            onClick={() => handleTick(subject, topic, subtopic, checked)}
                                                                            style={{
                                                                                display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                                                padding: '0.4rem 0.4rem', borderRadius: 'var(--radius-sm)',
                                                                                cursor: 'pointer', transition: 'background 0.15s',
                                                                                background: checked ? sc.bg : 'transparent',
                                                                            }}
                                                                            onMouseOver={e => !checked && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                                                            onMouseOut={e => !checked && (e.currentTarget.style.background = 'transparent')}
                                                                        >
                                                                            {checked
                                                                                ? <CheckCircle size={15} style={{ color: sc.color, flexShrink: 0 }} />
                                                                                : <Circle size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                                            }
                                                                            <span style={{
                                                                                fontSize: '0.83rem',
                                                                                color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                                                fontWeight: checked ? '600' : '400',
                                                                                flex: 1
                                                                            }}>
                                                                                {subtopic}
                                                                            </span>
                                                                            {checked && (
                                                                                <span style={{ fontSize: '0.65rem', color: sc.color, fontWeight: '700', flexShrink: 0 }}>
                                                                                    ✓
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Reset */}
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}
                            onClick={async () => {
                                if (!confirm('Reset all tick progress for this syllabus?')) return
                                await axios.delete(`${BASE_URL}/api/tracker/reset?user_id=${userId}`)
                                loadData()
                                showToast('Progress reset.')
                            }}
                        >
                            <RotateCcw size={12} /> Reset Progress
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}