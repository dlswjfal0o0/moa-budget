import { Suspense, lazy, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import ForceUpdateGate from './components/ForceUpdateGate'
import DeepLinkListener from './components/DeepLinkListener'
import { AppConfigProvider } from './contexts/AppConfigContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { CardsProvider } from './contexts/CardsContext'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import { LoansProvider } from './contexts/LoansContext'
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

// BottomNav의 좌→우 표시 순서와 동일해야 탭 전환 방향이 맞다 (캘린더·가계부·홈·분석·MY)
const TAB_PATHS = ['/calendar', '/ledger', '/home', '/analysis', '/my']

function RouteFallback() {
  const { themeData } = useTheme()
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spin-loader" style={{ width: 24, height: 24, border: '2.5px solid rgba(0,0,0,0.08)', borderTopColor: themeData.primary, borderRadius: '50%' }} />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const isTab = TAB_PATHS.includes(location.pathname)
  const { fontScale } = useSettings()
  const [lastTabIndex, setLastTabIndex] = useState(TAB_PATHS.indexOf(location.pathname))

  // 탭끼리는 BottomNav의 좌우 순서로, 그 외(온보딩 등)는 뒤로가기 여부로 방향을 정한다
  let animationName
  if (isTab) {
    const idx = TAB_PATHS.indexOf(location.pathname)
    animationName = idx < lastTabIndex ? 'pageEnterFromLeft' : 'pageEnterFromRight'
    if (idx !== lastTabIndex) setLastTabIndex(idx)
  } else {
    animationName = navigationType === 'POP' ? 'pushEnterFromLeft' : 'pushEnterFromRight'
  }

  return (
    <div
      key={location.pathname}
      style={{
        zoom: fontScale,
        animation: `${animationName} 280ms cubic-bezier(0.22,1,0.36,1) forwards`,
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
            {/* 알 수 없는 경로(구 딥링크, 오타 등) → 흰 화면 대신 스플래시로 복귀시켜 로그인 상태에 따라 자동 라우팅 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

function App() {
  return (
    <AppConfigProvider>
      <ThemeProvider>
        <SettingsProvider>
        <CardsProvider>
        <LoansProvider>
        <BrowserRouter>
          <ForceUpdateGate>
            <DeepLinkListener />
            <AnimatedRoutes />
          </ForceUpdateGate>
        </BrowserRouter>
        </LoansProvider>
        </CardsProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AppConfigProvider>
  )
}

export default App
