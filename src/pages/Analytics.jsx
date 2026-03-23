import { useEffect, useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, RadialLinearScale, ArcElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2'
import { TrendingUp, Target, Clock, Zap, Loader2 } from 'lucide-react'
import { analyticsAPI } from '../services/api'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler
)

const chartDefaults = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}

const gridStyle = {
  color: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.08)'
}

const tickStyle = { color: 'rgba(240,240,255,0.5)', font: { size: 11 } }
const axisStyles = { x: { grid: gridStyle, ticks: tickStyle }, y: { grid: gridStyle, ticks: tickStyle } }

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</p>}
      </div>
      <div className="chart-container">
        {children}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('neurolearn_user') || '{}')
    const uid = user.id || 'demo-user-001'

    Promise.all([
      analyticsAPI.getSummary(uid),
      analyticsAPI.getAccuracyTrend(uid),
      analyticsAPI.getTopicBreakdown(uid),
      analyticsAPI.getSpeedTrend(uid),
      analyticsAPI.getRadar(uid),
      analyticsAPI.getWeakAreas(uid)
    ]).then(responses => {
      setStats({
        summary: responses[0]?.data || {},
        accuracy: responses[1]?.data || [],
        topics: responses[2]?.data || [],
        speed: responses[3]?.data || [],
        radar: responses[4]?.data || {},
        weak: responses[5]?.data || []
      });
    }).catch(console.error);
  }, []);

  if (!stats) return <div className="p-12 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;

  // Safe data extraction
  const accuracyArr = Array.isArray(stats.accuracy) ? stats.accuracy : [];
  const speedArr = Array.isArray(stats.speed) ? stats.speed : [];
  const topicsArr = Array.isArray(stats.topics) ? stats.topics : [];
  const weakArr = Array.isArray(stats.weak) ? stats.weak : [];
  const sumData = stats.summary || {};
  const radarData = stats.radar || {};

  // Build dynamic chart structures
  const dynamicAccuracy = {
    labels: accuracyArr.length ? accuracyArr.map(d => d.label) : ['No Data'],
    datasets: [{
      label: 'Accuracy %',
      data: accuracyArr.length ? accuracyArr.map(d => d.accuracy) : [0],
      borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.12)',
      borderWidth: 2.5, fill: true, tension: 0.4,
      pointBackgroundColor: '#6c63ff', pointRadius: 4, pointHoverRadius: 7,
    }]
  }

  const dynamicSpeed = {
    labels: speedArr.length ? speedArr.map(d => d.label) : ['No Data'],
    datasets: [{
      label: 'Avg Speed (sec/q)',
      data: speedArr.length ? speedArr.map(d => d.speed) : [0],
      borderColor: '#ffd93d', backgroundColor: 'rgba(255,217,61,0.1)',
      borderWidth: 2.5, fill: true, tension: 0.4,
      pointBackgroundColor: '#ffd93d', pointRadius: 4, pointHoverRadius: 7,
    }]
  }

  const dynamicTopic = {
    labels: topicsArr.length ? topicsArr.map(d => d.topic) : ['No Data'],
    datasets: [{
      label: 'Score %',
      data: topicsArr.length ? topicsArr.map(d => d.score_percent) : [0],
      backgroundColor: [
        'rgba(108,99,255,0.7)', 'rgba(0,212,170,0.7)',
        'rgba(255,107,107,0.7)', 'rgba(255,217,61,0.7)',
        'rgba(180,78,255,0.7)', 'rgba(78,205,196,0.7)'
      ],
      borderRadius: 6, borderWidth: 0,
    }]
  }

  const dynamicRadar = {
    labels: radarData.labels || ['Physics', 'Chemistry', 'Mathematics', 'Speed', 'Accuracy', 'Consistency'],
    datasets: [
      {
        label: 'Your Performance',
        data: radarData.student || [0, 0, 0, 0, 0, 0],
        borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.12)',
        pointBackgroundColor: '#6c63ff', borderWidth: 2, pointRadius: 4,
      },
      {
        label: 'Topper Average',
        data: radarData.topper || [88, 85, 90, 85, 92, 88],
        borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.05)',
        pointBackgroundColor: '#00d4aa', borderWidth: 2, pointRadius: 4,
      }
    ]
  }

  const subjMap = { 'Physics': 0, 'Chemistry': 0, 'Mathematics': 0 };
  let subjectQuestions = false;
  topicsArr.forEach(t => {
    if (t.subject in subjMap) {
      subjMap[t.subject] += (t.questions_attempted || 0);
      subjectQuestions = true;
    }
  });

  const totalSubj = Object.values(subjMap).reduce((a, b) => a + b, 0) || 1;
  const computedPcts = subjectQuestions
    ? [Math.round((subjMap['Physics'] / totalSubj) * 100), Math.round((subjMap['Chemistry'] / totalSubj) * 100), Math.round((subjMap['Mathematics'] / totalSubj) * 100)]
    : [0, 0, 0];

  const dynamicDoughnut = {
    labels: ['Physics', 'Chemistry', 'Mathematics'],
    datasets: [{
      data: computedPcts,
      backgroundColor: ['rgba(108,99,255,0.8)', 'rgba(0,212,170,0.8)', 'rgba(255,107,107,0.8)'],
      borderColor: ['#6c63ff', '#00d4aa', '#ff6b6b'],
      borderWidth: 2, hoverOffset: 8,
    }]
  }

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div className="grid-4 mb-3">
        {[
          { icon: <TrendingUp size={22} />, label: 'Overall Accuracy', val: `${sumData.accuracy_percent || 0}%`, change: sumData.total_questions > 0 ? 'Dynamic' : 'New', color: 'var(--primary-light)', bg: 'rgba(108,99,255,0.15)' },
          { icon: <Target size={22} />, label: 'Questions Attempted', val: sumData.total_questions || 0, change: sumData.total_questions > 0 ? 'Live Data' : 'Start now!', color: 'var(--secondary)', bg: 'rgba(0,212,170,0.15)' },
          { icon: <Clock size={22} />, label: 'Avg Speed', val: `${sumData.avg_speed_seconds || 0}s/q`, change: sumData.total_questions > 0 ? 'Dynamic' : 'Unmeasured', color: 'var(--warning)', bg: 'rgba(255,217,61,0.15)' },
          { icon: <Zap size={22} />, label: 'Consistency Score', val: `${sumData.consistency_score || 0}/10`, change: `Streak: ${sumData.study_streak || 0}`, color: '#b44eff', bg: 'rgba(180,78,255,0.15)' },
        ].map(({ icon, label, val, change, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
            <div className="stat-info">
              <h3>{val}</h3>
              <p>{label}</p>
              <div className="stat-change positive">{change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-3">
        <ChartCard title="📈 Accuracy Over Time" subtitle="Weekly performance trend">
          <Line data={dynamicAccuracy} options={{
            ...chartDefaults,
            plugins: { ...chartDefaults.plugins, tooltip: { backgroundColor: 'rgba(15,15,30,0.95)', borderColor: 'rgba(108,99,255,0.3)', borderWidth: 1 } },
            scales: axisStyles
          }} />
        </ChartCard>

        <ChartCard title="⚡ Response Speed" subtitle="Average seconds per question (lower = better)">
          <Line data={dynamicSpeed} options={{
            ...chartDefaults,
            plugins: { ...chartDefaults.plugins, tooltip: { backgroundColor: 'rgba(15,15,30,0.95)', borderColor: 'rgba(255,217,61,0.3)', borderWidth: 1 } },
            scales: axisStyles
          }} />
        </ChartCard>
      </div>

      <div className="grid-2 mb-3">
        <ChartCard title="📊 Topic-wise Performance" subtitle="Score % across topics">
          <Bar data={dynamicTopic} options={{
            ...chartDefaults,
            plugins: { ...chartDefaults.plugins, tooltip: { backgroundColor: 'rgba(15,15,30,0.95)' } },
            scales: axisStyles
          }} />
        </ChartCard>

        <ChartCard title="🕸️ Strength vs Topper Radar" subtitle="Your profile vs top rankers">
          <Radar data={dynamicRadar} options={{
            ...chartDefaults,
            plugins: {
              ...chartDefaults.plugins,
              legend: { display: true, position: 'bottom', labels: { color: 'rgba(240,240,255,0.6)', font: { size: 11 }, padding: 12 } }
            },
            scales: {
              r: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { display: false }, pointLabels: { color: 'rgba(240,240,255,0.7)', font: { size: 11 } }, angleLines: { color: 'rgba(255,255,255,0.06)' } }
            }
          }} />
        </ChartCard>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.2rem' }}>📚 Subject Distribution</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Time spent per subject</p>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ width: '160px', height: '160px', flexShrink: 0 }}>
              <Doughnut data={dynamicDoughnut} options={{
                ...chartDefaults,
                plugins: { ...chartDefaults.plugins, tooltip: { backgroundColor: 'rgba(15,15,30,0.95)' } },
                cutout: '65%'
              }} />
            </div>
            <div style={{ flex: 1 }}>
              {['Physics', 'Chemistry', 'Mathematics'].map((s, i) => {
                const cs = ['#6c63ff', '#00d4aa', '#ff6b6b']
                const pval = computedPcts[i];
                return (
                  <div key={s} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: cs[i], display: 'inline-block' }} />
                        {s}
                      </span>
                      <span style={{ fontWeight: '700', color: cs[i] }}>{pval}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '4px' }}>
                      <div style={{ height: '100%', width: `${pval}%`, background: cs[i], borderRadius: '9999px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.2rem' }}>🎯 Weak Areas to Focus On</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>AI-identified topics needing improvement</p>
          {weakArr.map(({ topic, subject, score, priority }) => {
            const pc = priority === 'High' ? 'accent' : priority === 'Medium' ? 'warning' : 'secondary'
            return (
              <div key={topic} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0', borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600' }}>{topic}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{subject}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)' }}>{score}%</div>
                  <span className={`badge badge-${pc}`} style={{ fontSize: '0.66rem' }}>{priority}</span>
                </div>
              </div>
            )
          })}
          {weakArr.length === 0 && <div className="text-gray-400 italic py-4">No weak areas identified yet. Practice more!</div>}
        </div>
      </div>
    </div>
  )
}
