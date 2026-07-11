import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { CardsProvider } from './contexts/CardsContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { LoansProvider } from './contexts/LoansContext'
import SplashScreen from './pages/Onboarding/SplashScreen'
import HowToUse from './pages/Onboarding/HowToUse'
import Auth from './pages/Onboarding/Auth'
import AIStyleSetup from './pages/Onboarding/AIStyleSetup'
import Home from './pages/Home'
import Ledger from './pages/Ledger'
import Calendar from './pages/Calendar'
import Analysis from './pages/Analysis'
import MyPage from './pages/MyPage'

// Tab paths that should use Fade Through transition
const TAB_PATHS = ['/home', '/ledger', '/calendar', '/analysis', '/my']

function AnimatedRoutes() {
  const location = useLocation()
  const isTab = TAB_PATHS.includes(location.pathname)

  return (
    <div
      key={location.pathname}
      style={isTab ? { animation: 'pageEnter 220ms ease forwards' } : undefined}
    >
      <ErrorBoundary key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding/ai-style" element={<AIStyleSetup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/my" element={<MyPage />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
      <CardsProvider>
      <LoansProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      </LoansProvider>
      </CardsProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default App
