import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { CardsProvider } from './contexts/CardsContext'
import { SettingsProvider } from './contexts/SettingsContext'
import SplashScreen from './pages/Onboarding/SplashScreen'
import HowToUse from './pages/Onboarding/HowToUse'
import Auth from './pages/Onboarding/Auth'
import Home from './pages/Home'
import Ledger from './pages/Ledger'
import Calendar from './pages/Calendar'
import Analysis from './pages/Analysis'
import MyPage from './pages/MyPage'

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
      <CardsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/my" element={<MyPage />} />
        </Routes>
      </BrowserRouter>
      </CardsProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default App