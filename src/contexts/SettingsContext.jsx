import { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DEFAULT_CATEGORIES } from '../styles/theme'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [weekStartDay, setWeekStartDayState] = useState(() => {
    const v = localStorage.getItem('moa_weekStartDay')
    return v !== null ? Number(v) : 1
  })
  const [sortOrder, setSortOrderState] = useState(
    () => localStorage.getItem('moa_sortOrder') || 'desc'
  )
  const [showCardBilling, setShowCardBillingState] = useState(
    () => localStorage.getItem('moa_showCardBilling') === 'true'
  )
  const [rolloverBudget, setRolloverBudgetState] = useState(
    () => localStorage.getItem('moa_rolloverBudget') === 'true'
  )
  const [showLoan, setShowLoanState] = useState(
    () => localStorage.getItem('moa_showLoan') === 'true'
  )
  const [aiAnalysisStyle, setAiAnalysisStyleState] = useState(() => {
    const v = localStorage.getItem('moa_aiAnalysisStyle')
    return v !== null ? Number(v) : 3
  })
  const [aiShowAdvice, setAiShowAdviceState] = useState(() => {
    const v = localStorage.getItem('moa_aiShowAdvice')
    return v !== null ? v === 'true' : true
  })
  const [categories, setCategoriesState] = useState(DEFAULT_CATEGORIES)
  const [fontScale, setFontScaleState] = useState(() => {
    const v = localStorage.getItem('moa_fontScale')
    return v !== null ? Number(v) : 1
  })
  const [notifyPaymentEnabled, setNotifyPaymentEnabledState] = useState(
    () => localStorage.getItem('moa_notifyPaymentEnabled') === 'true'
  )
  const [notifyPaymentTime, setNotifyPaymentTimeState] = useState(
    () => localStorage.getItem('moa_notifyPaymentTime') || '09:00'
  )
  const [notifyNightConsent, setNotifyNightConsentState] = useState(
    () => localStorage.getItem('moa_notifyNightConsent') === 'true'
  )

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) return
      const data = snap.data()
      if (data.weekStartDay !== undefined) {
        setWeekStartDayState(data.weekStartDay)
        localStorage.setItem('moa_weekStartDay', String(data.weekStartDay))
      }
      if (data.sortOrder) {
        setSortOrderState(data.sortOrder)
        localStorage.setItem('moa_sortOrder', data.sortOrder)
      }
      if (data.showCardBilling !== undefined) {
        setShowCardBillingState(data.showCardBilling)
        localStorage.setItem('moa_showCardBilling', String(data.showCardBilling))
      }
      if (data.rolloverBudget !== undefined) {
        setRolloverBudgetState(data.rolloverBudget)
        localStorage.setItem('moa_rolloverBudget', String(data.rolloverBudget))
      }
      if (data.showLoan !== undefined) {
        setShowLoanState(data.showLoan)
        localStorage.setItem('moa_showLoan', String(data.showLoan))
      }
      if (data.aiAnalysisStyle !== undefined) {
        setAiAnalysisStyleState(data.aiAnalysisStyle)
        localStorage.setItem('moa_aiAnalysisStyle', String(data.aiAnalysisStyle))
      }
      if (data.aiShowAdvice !== undefined) {
        setAiShowAdviceState(data.aiShowAdvice)
        localStorage.setItem('moa_aiShowAdvice', String(data.aiShowAdvice))
      }
      if (data.categories) {
        setCategoriesState({ ...DEFAULT_CATEGORIES, ...data.categories })
      }
      if (data.fontScale !== undefined) {
        setFontScaleState(data.fontScale)
        localStorage.setItem('moa_fontScale', String(data.fontScale))
      }
      if (data.notifyPaymentEnabled !== undefined) {
        setNotifyPaymentEnabledState(data.notifyPaymentEnabled)
        localStorage.setItem('moa_notifyPaymentEnabled', String(data.notifyPaymentEnabled))
      }
      if (data.notifyPaymentTime) {
        setNotifyPaymentTimeState(data.notifyPaymentTime)
        localStorage.setItem('moa_notifyPaymentTime', data.notifyPaymentTime)
      }
      if (data.notifyNightConsent !== undefined) {
        setNotifyNightConsentState(data.notifyNightConsent)
        localStorage.setItem('moa_notifyNightConsent', String(data.notifyNightConsent))
      }
    })
    return unsub
  }, [])

  const save = async (updates) => {
    // currentUser(state)는 로그인 직후 비동기로 반영되므로, 가입 직후 온보딩처럼
    // 즉시 저장이 필요한 화면에서는 Firebase SDK가 동기적으로 채워주는 auth.currentUser를 사용한다.
    const uid = auth.currentUser?.uid
    if (!uid) return
    await setDoc(doc(db, 'users', uid), updates, { merge: true })
  }

  const setWeekStartDay = (val) => {
    setWeekStartDayState(val)
    localStorage.setItem('moa_weekStartDay', String(val))
    save({ weekStartDay: val })
  }
  const setSortOrder = (val) => {
    setSortOrderState(val)
    localStorage.setItem('moa_sortOrder', val)
    save({ sortOrder: val })
  }
  const setShowCardBilling = (val) => {
    setShowCardBillingState(val)
    localStorage.setItem('moa_showCardBilling', String(val))
    save({ showCardBilling: val })
  }
  const setRolloverBudget = (val) => {
    setRolloverBudgetState(val)
    localStorage.setItem('moa_rolloverBudget', String(val))
    save({ rolloverBudget: val })
  }
  const setShowLoan = (val) => {
    setShowLoanState(val)
    localStorage.setItem('moa_showLoan', String(val))
    save({ showLoan: val })
  }
  const setAiAnalysisStyle = (val) => {
    setAiAnalysisStyleState(val)
    localStorage.setItem('moa_aiAnalysisStyle', String(val))
    save({ aiAnalysisStyle: val })
  }
  const setAiShowAdvice = (val) => {
    setAiShowAdviceState(val)
    localStorage.setItem('moa_aiShowAdvice', String(val))
    save({ aiShowAdvice: val })
  }
  const setCategories = (val) => {
    setCategoriesState(val)
    save({ categories: val })
  }
  const setFontScale = (val) => {
    setFontScaleState(val)
    localStorage.setItem('moa_fontScale', String(val))
    save({ fontScale: val })
  }
  const setNotifyPaymentEnabled = (val) => {
    setNotifyPaymentEnabledState(val)
    localStorage.setItem('moa_notifyPaymentEnabled', String(val))
    save({ notifyPaymentEnabled: val })
  }
  const setNotifyPaymentTime = (val) => {
    setNotifyPaymentTimeState(val)
    localStorage.setItem('moa_notifyPaymentTime', val)
    save({ notifyPaymentTime: val })
  }
  const setNotifyNightConsent = (val) => {
    setNotifyNightConsentState(val)
    localStorage.setItem('moa_notifyNightConsent', String(val))
    save({ notifyNightConsent: val })
  }

  return (
    <SettingsContext.Provider value={{
      weekStartDay, setWeekStartDay,
      sortOrder, setSortOrder,
      showCardBilling, setShowCardBilling,
      rolloverBudget, setRolloverBudget,
      showLoan, setShowLoan,
      aiAnalysisStyle, setAiAnalysisStyle,
      aiShowAdvice, setAiShowAdvice,
      categories, setCategories,
      fontScale, setFontScale,
      notifyPaymentEnabled, setNotifyPaymentEnabled,
      notifyPaymentTime, setNotifyPaymentTime,
      notifyNightConsent, setNotifyNightConsent,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext)
