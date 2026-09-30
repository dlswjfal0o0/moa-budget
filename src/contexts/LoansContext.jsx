import { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DEMO_DATA_EVENT } from '../utils/demoData'

const LoansContext = createContext()

// 데모 모드의 대출 데이터는 demoData.js가 상대 날짜로 생성해 moa_loans 에 저장한다.
const getDemoLoans = () => {
  try { return JSON.parse(localStorage.getItem('moa_loans') || '[]') } catch { return [] }
}

export function LoansProvider({ children }) {
  const [loans, setLoansState] = useState(() =>
    localStorage.getItem('moa_demo_mode') === 'true' ? getDemoLoans() : []
  )
  const [currentUser, setCurrentUser] = useState(null)

  // 베타 테스트 로그인이 moa_loans를 채운 직후 반영
  useEffect(() => {
    const reload = () => setLoansState(getDemoLoans())
    window.addEventListener(DEMO_DATA_EVENT, reload)
    return () => window.removeEventListener(DEMO_DATA_EVENT, reload)
  }, [])

  useEffect(() => {
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (isDemo) return
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (!user) return
      const snap = await getDoc(doc(db, 'users', user.uid))
      // 심사용 데모 계정은 로그인 직후 데모 대출이 들어가므로 Firestore 값으로 덮어쓰지 않는다
      if (localStorage.getItem('moa_demo_mode') === 'true') return
      if (!snap.exists()) return
      const data = snap.data()
      if (data.loans) setLoansState(data.loans)
    })
    return unsub
  }, [])

  const setLoans = async (updated) => {
    setLoansState(updated)
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), { loans: updated }, { merge: true })
      } catch (e) {
        console.error('대출 정보 저장 실패:', e)
        throw e
      }
    }
  }

  return (
    <LoansContext.Provider value={{ loans, setLoans }}>
      {children}
    </LoansContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLoans = () => useContext(LoansContext)
