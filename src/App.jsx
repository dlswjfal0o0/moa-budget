import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { CardsProvider } from './contexts/CardsContext'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import { LoansProvider } from './contexts/LoansContext'
import { PurchasesProvider } from './contexts/PurchasesContext'
import SplashScreen from './pages/Onboarding/SplashScreen'
import HowToUse from './pages/Onboarding/HowToUse'
import Auth from './pages/Onboarding/Auth'

// 탭 화면들은 recharts/xlsx/jspdf 등 무거운 의존성을 포함하므로
// 스플래시/로그인 시점의 초기 번들에서 제외하기 위해 지연 로드한다.
const AIStyleSetup = lazy(() => import('./pages/Onboarding/AIStyleSetup'))
const Home = lazy(() => import('./pages/Home'))
const Ledger = lazy(() => import('./pages/Ledger'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Analysis = lazy(() => import('./pages/Analysis'))
const MyPage = lazy(() => import('./pages/MyPage'))

// Tab paths that should use Fade Through transition
const TAB_PATHS = ['/home', '/ledger', '/calendar', '/analysis', '/my']

function RouteFallback() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '2.5px solid rgba(0,0,0,0.08)', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const isTab = TAB_PATHS.includes(location.pathname)
  const { fontScale } = useSettings()

  return (
    <div
      key={location.pathname}
      style={{
        zoom: fontScale,
        ...(isTab ? { animation: 'pageEnter 220ms ease forwards' } : undefined),
      }}
    >
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
      <PurchasesProvider>
      <CardsProvider>
      <LoansProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      </LoansProvider>
      </CardsProvider>
      </PurchasesProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default App
