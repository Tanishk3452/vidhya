import { useState } from 'react'
import { Trophy, Flame, Zap, Star, Target, BookOpen, CheckCircle } from 'lucide-react'

const achievements = [
  { id:1, icon:'🔥', name:'7-Day Streak', desc:'Studied 7 days in a row', unlocked:true, xp:100 },
  { id:2, icon:'⚡', name:'Speed Demon', desc:'Solved 10 questions in under 5 min', unlocked:true, xp:150 },
  { id:3, icon:'🎯', name:'Sharpshooter', desc:'100% accuracy in a mock test', unlocked:true, xp:200 },
  { id:4, icon:'📚', name:'Knowledge Seeker', desc:'Completed 1000 questions', unlocked:true, xp:300 },
  { id:5, icon:'🏆', name:'Consistency King', desc:'30-day study streak', unlocked:false, xp:500 },
  { id:6, icon:'🧠', name:'Physics Pro', desc:'80%+ accuracy in Physics for 2 weeks', unlocked:false, xp:400 },
  { id:7, icon:'🌙', name:'Night Owl', desc:'Studied after 11 PM for 7 days', unlocked:true, xp:100 },
  { id:8, icon:'🚀', name:'Rank Climber', desc:'Improved predicted rank by 5000', unlocked:true, xp:350 },
  { id:9, icon:'💡', name:'Doubt Buster', desc:'Solved 100 doubts with AI', unlocked:false, xp:250 },
  { id:10, icon:'🎭', name:'All-Rounder', desc:'70%+ in all 3 subjects simultaneously', unlocked:false, xp:400 },
  { id:11, icon:'⭐', name:'Star Student', desc:'Completed a perfect study week', unlocked:false, xp:600 },
  { id:12, icon:'🔬', name:'Chemistry Wizard', desc:'Solved 200 Chemistry questions', unlocked:true, xp:200 },
]

const leaderboard = [
  { rank:1, name:'Priya Sharma', school:'Delhi', xp:12450, accuracy:'94%', streak:42, avatar:'P' },
  { rank:2, name:'Rahul Verma', school:'Mumbai', xp:11820, accuracy:'91%', streak:38, avatar:'R' },
  { rank:3, name:'Ananya Singh', school:'Bangalore', xp:10900, accuracy:'89%', streak:31, avatar:'A' },
  { rank:4, name:'Aryan Sharma', school:'Jaipur', xp:10280, accuracy:'87%', streak:14, avatar:'A', isUser:true },
  { rank:5, name:'Kiran Patel', school:'Ahmedabad', xp:9750, accuracy:'85%', streak:22, avatar:'K' },
  { rank:6, name:'Meera Iyer', school:'Chennai', xp:9200, accuracy:'83%', streak:19, avatar:'M' },
  { rank:7, name:'Vikram Nair', school:'Kochi', xp:8900, accuracy:'82%', streak:16, avatar:'V' },
]

const rankColors = { 1:'#ffd93d', 2:'rgba(200,200,200,0.9)', 3:'#cd7f32' }

// Build 63-day heatmap (9 weeks × 7 days)
function buildHeatmap() {
  return Array.from({ length: 63 }, (_, i) => {
    const r = Math.random()
    return r < 0.15 ? 0 : r < 0.3 ? 1 : r < 0.6 ? 2 : r < 0.85 ? 3 : 4
  })
}
const heatmapData = buildHeatmap()
const days = ['S','M','T','W','T','F','S']

export default function Gamification() {
  const [tab, setTab] = useState('achievements')
  const xp = 4280
  const nextLevelXP = 5000
  const currentLevelXP = 4000
  const level = 12
  const streak = 14

  return (
    <div style={{ animation:'fadeInUp 0.5s ease' }}>
      {/* XP + Level Banner */}
      <div className="xp-bar-container mb-3" style={{
        background:'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(180,78,255,0.07))',
        borderColor:'rgba(108,99,255,0.25)'
      }}>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'center', flexWrap:'wrap' }}>
          <div className="level-badge">
            L{level}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
              <div>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:'800', fontSize:'1.1rem' }}>Level {level} — </span>
                <span style={{ color:'var(--primary-light)', fontWeight:'700' }}>Physics Champion</span>
              </div>
              <span style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
                {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
              </span>
            </div>
            <div className="progress-bar" style={{ height:'10px' }}>
              <div className="progress-fill" style={{ width:`${((xp-currentLevelXP)/(nextLevelXP-currentLevelXP))*100}%` }} />
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.4rem' }}>
              {(nextLevelXP - xp).toLocaleString()} XP to Level {level+1}
            </div>
          </div>
          <div style={{ display:'flex', gap:'1rem' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem' }}>🔥</div>
              <div style={{ fontWeight:'800', fontSize:'1.1rem', color:'var(--warning)', fontFamily:"'Outfit',sans-serif" }}>{streak}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Day Streak</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem' }}>🏆</div>
              <div style={{ fontWeight:'800', fontSize:'1.1rem', color:'var(--warning)', fontFamily:"'Outfit',sans-serif" }}>#4</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Global Rank</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem' }}>⭐</div>
              <div style={{ fontWeight:'800', fontSize:'1.1rem', color:'var(--warning)', fontFamily:"'Outfit',sans-serif" }}>
                {achievements.filter(a=>a.unlocked).length}
              </div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Badges</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ maxWidth:'420px' }}>
        {[
          { key:'achievements', label:'🏅 Achievements' },
          { key:'streak', label:'🔥 Streak' },
          { key:'leaderboard', label:'🏆 Leaderboard' },
        ].map(({ key, label }) => (
          <button key={key} className={`tab-btn ${tab===key?'active':''}`} onClick={() => setTab(key)} id={`gam-tab-${key}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ACHIEVEMENTS */}
      {tab === 'achievements' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>
              {achievements.filter(a=>a.unlocked).length}/{achievements.length} achievements unlocked
            </p>
            <div className="progress-bar" style={{ width:'150px' }}>
              <div className="progress-fill" style={{ width:`${(achievements.filter(a=>a.unlocked).length/achievements.length)*100}%` }} />
            </div>
          </div>

          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(175px, 1fr))',
            gap:'1rem'
          }}>
            {achievements.map(a => (
              <div key={a.id} className={`achievement-badge ${a.unlocked ? '' : 'locked'}`}>
                <div className="achievement-icon">{a.icon}</div>
                <h4>{a.name}</h4>
                <p>{a.desc}</p>
                <div style={{ marginTop:'0.6rem' }}>
                  {a.unlocked ? (
                    <span className="badge badge-secondary" style={{ fontSize:'0.7rem' }}>+{a.xp} XP ✅</span>
                  ) : (
                    <span className="badge" style={{ fontSize:'0.7rem', background:'var(--bg-glass)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>
                      🔒 {a.xp} XP
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STREAK */}
      {tab === 'streak' && (
        <div className="grid-2">
          <div className="card" style={{ padding:'1.5rem' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:'700', marginBottom:'1.25rem' }}>📅 Study Activity (Last 63 Days)</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'4px', marginBottom:'0.75rem' }}>
              {days.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:'600', paddingBottom:'2px' }}>{d}</div>
              ))}
              {heatmapData.map((level, i) => (
                <div
                  key={i}
                  className={`heatmap-cell level-${level}`}
                  style={{ aspectRatio:'1' }}
                  title={`Level ${level} activity`}
                />
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', fontSize:'0.72rem', color:'var(--text-muted)' }}>
              <span>Less</span>
              {[0,1,2,3,4].map(l => <div key={l} className={`heatmap-cell level-${l}`} style={{ width:'12px', height:'12px', borderRadius:'2px' }} />)}
              <span>More</span>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="card" style={{ padding:'1.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'4rem', marginBottom:'0.5rem' }}>🔥</div>
              <div style={{ fontSize:'3rem', fontWeight:'900', fontFamily:"'Outfit',sans-serif", color:'var(--warning)' }}>{streak}</div>
              <div style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>Day Streak</div>
              <div style={{ marginTop:'0.75rem', fontSize:'0.78rem', color:'var(--text-muted)' }}>
                Personal best: <strong style={{color:'var(--text-primary)'}}>28 days</strong>
              </div>
            </div>

            <div className="card" style={{ padding:'1.25rem' }}>
              <h3 style={{ fontSize:'0.95rem', fontWeight:'700', marginBottom:'0.75rem' }}>🎯 Weekly Goals</h3>
              {[
                { goal:'Study 6h/day', done:5, total:7 },
                { goal:'Solve 100 questions', done:87, total:100 },
                { goal:'Ask 10 doubts', done:10, total:10 },
                { goal:'Complete mock test', done:1, total:2 },
              ].map(({ goal, done, total }) => (
                <div key={goal} style={{ marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:'0.3rem' }}>
                    <span style={{ fontWeight:'500' }}>{goal}</span>
                    <span style={{ color: done >= total ? 'var(--secondary)' : 'var(--text-muted)', fontWeight:'700' }}>
                      {done}/{total} {done >= total && '✅'}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height:'5px' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width:`${Math.min(100,(done/total)*100)}%`,
                        background: done >= total ? 'var(--grad-secondary)' : 'var(--grad-primary)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD */}
      {tab === 'leaderboard' && (
        <div>
          <div style={{ marginBottom:'1rem', fontSize:'0.85rem', color:'var(--text-muted)' }}>
            Showing global leaderboard — Updated every 24h
          </div>
          <div className="card" style={{ padding:'0', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-glass)', borderBottom:'1px solid var(--border)' }}>
                  {['#','Student','XP','Accuracy','Streak'].map(h => (
                    <th key={h} style={{ padding:'0.85rem 1rem', textAlign:'left', fontSize:'0.78rem',
                      fontWeight:'700', color:'var(--text-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(({ rank, name, school, xp, accuracy, streak, avatar, isUser }) => (
                  <tr
                    key={rank}
                    style={{
                      borderBottom:'1px solid var(--border)',
                      background: isUser ? 'rgba(108,99,255,0.06)' : 'transparent',
                      transition:'background 0.2s'
                    }}
                    onMouseOver={e => !isUser && (e.currentTarget.style.background = 'var(--bg-glass)')}
                    onMouseOut={e => !isUser && (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding:'0.9rem 1rem' }}>
                      <span style={{
                        fontWeight:'900', fontSize:'1rem', fontFamily:"'Outfit',sans-serif",
                        color: rankColors[rank] || 'var(--text-muted)'
                      }}>
                        {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
                      </span>
                    </td>
                    <td style={{ padding:'0.9rem 1rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{
                          width:'34px', height:'34px', borderRadius:'50%',
                          background: isUser ? 'var(--grad-primary)' : 'var(--bg-glass)',
                          border:`1.5px solid ${isUser ? 'rgba(108,99,255,0.5)' : 'var(--border)'}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'0.8rem', fontWeight:'700', 
                          color: isUser ? 'white' : 'var(--text-secondary)',
                          flexShrink:0
                        }}>
                          {avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight:'600', fontSize:'0.9rem', display:'flex', gap:'0.4rem', alignItems:'center' }}>
                            {name}
                            {isUser && <span className="badge badge-primary" style={{ fontSize:'0.65rem' }}>You</span>}
                          </div>
                          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{school}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'0.9rem 1rem' }}>
                      <span style={{ fontWeight:'700', color:'var(--primary-light)', fontFamily:"'Outfit',sans-serif" }}>
                        ⚡ {xp.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding:'0.9rem 1rem' }}>
                      <span style={{ fontWeight:'600', color:'var(--secondary)' }}>{accuracy}</span>
                    </td>
                    <td style={{ padding:'0.9rem 1rem' }}>
                      <span style={{ fontWeight:'600', color:'var(--warning)' }}>🔥 {streak}d</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
