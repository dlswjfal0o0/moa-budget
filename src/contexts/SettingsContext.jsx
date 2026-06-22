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
  const [categories, setCategoriesState] = useState(DEFAULT_CATEGORIES)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
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
      if (data.categories) {
        setCategoriesState({ ...DEFAULT_CATEGORIES, ...data.categories })
      }
    })
    return unsub
  }, [])

  const save = async (updates) => {
    if (!currentUser) return
    await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true })
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
  const setCategories = (val) => {
    setCategoriesState(val)
    save({ categories: val })
  }

  return (
    <SettingsContext.Provider value={{
      weekStartDay, setWeekStartDay,
      sortOrder, setSortOrder,
      showCardBilling, setShowCardBilling,
      rolloverBudget, setRolloverBudget,
      showLoan, setShowLoan,
      categories, setCategories,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
