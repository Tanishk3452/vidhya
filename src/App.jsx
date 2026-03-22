import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import StudyPlanner from './pages/StudyPlanner'
import DoubtSolver from './pages/DoubtSolver'
import YouTubeNotes from './pages/YouTubeNotes'
import AdaptiveQuestions from './pages/AdaptiveQuestions'
import Analytics from './pages/Analytics'
import RankPredictor from './pages/RankPredictor'
import Gamification from './pages/Gamification'

const OrbBackground = () => (
  <div className="orb-container">
    <div className="orb orb-1" />
    <div className="orb orb-2" />
    <div className="orb orb-3" />
  </div>
)

function AppLayout({ children, pageTitle, pageSubtitle }) {
  return (
    <div className="app-layout">
      <OrbBackground />
      <Sidebar />
      <div className="main-content">
        <Header title={pageTitle} subtitle={pageSubtitle} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><OrbBackground /><LandingPage onLogin={() => setIsLoggedIn(true)} /></>} />
        <Route path="/auth" element={<><OrbBackground /><AuthPage onLogin={() => setIsLoggedIn(true)} /></>} />
        <Route
          path="/dashboard"
          element={
            <AppLayout pageTitle="Dashboard" pageSubtitle="Welcome back, Aryan 👋">
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/planner"
          element={
            <AppLayout pageTitle="AI Study Planner" pageSubtitle="Get your personalized study schedule">
              <StudyPlanner />
            </AppLayout>
          }
        />
        <Route
          path="/doubt-solver"
          element={
            <AppLayout pageTitle="Doubt Solver" pageSubtitle="Ask anything — text, voice, or image">
              <DoubtSolver />
            </AppLayout>
          }
        />
        <Route
          path="/youtube"
          element={
            <AppLayout pageTitle="Video Processor" pageSubtitle="Convert lectures into distraction-free structured notes">
              <YouTubeNotes />
            </AppLayout>
          }
        />
        <Route
          path="/questions"
          element={
            <AppLayout pageTitle="Adaptive Questions" pageSubtitle="Practice problems tailored to your level">
              <AdaptiveQuestions />
            </AppLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <AppLayout pageTitle="Performance Analytics" pageSubtitle="Track your progress in detail">
              <Analytics />
            </AppLayout>
          }
        />
        <Route
          path="/rank"
          element={
            <AppLayout pageTitle="Rank Predictor" pageSubtitle="See where you stand and how to improve">
              <RankPredictor />
            </AppLayout>
          }
        />
        <Route
          path="/gamification"
          element={
            <AppLayout pageTitle="Achievements & Streaks" pageSubtitle="Level up your learning journey">
              <Gamification />
            </AppLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
