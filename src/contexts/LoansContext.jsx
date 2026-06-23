import { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const LoansContext = createContext()

export function LoansProvider({ children }) {
  const [loans, setLoansState] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (isDemo) {
      setLoansState([
        {
          id: 1, name: '전세자금대출', principal: 120000000, remainingPrincipal: 98000000,
          startDate: '2023-04-01', rate: 3.5, rateType: 'simple',
          monthlyPayment: 450000, paymentDay: 25, maturityDate: '2028-04-01',
          repayments: [
            { date: '2024-01-25', daysElapsed: 300, amount: 450000, cumulativeAmount: 450000 },
            { date: '2024-04-25', daysElapsed: 390, amount: 450000, cumulativeAmount: 900000 },
            { date: '2024-07-25', daysElapsed: 481, amount: 450000, cumulativeAmount: 1350000 },
            { date: '2024-10-25', daysElapsed: 573, amount: 450000, cumulativeAmount: 1800000 },
            { date: '2025-01-25', daysElapsed: 665, amount: 450000, cumulativeAmount: 2250000 },
            { date: '2025-04-25', daysElapsed: 754, amount: 450000, cumulativeAmount: 2700000 },
          ],
        },
        {
          id: 2, name: '자동차 할부', principal: 18000000, remainingPrincipal: 12000000,
          startDate: '2024-01-15', rate: 5.2, rateType: 'simple',
          monthlyPayment: 280000, paymentDay: 10, maturityDate: '2026-12-15',
          repayments: [
            { date: '2024-02-10', daysElapsed: 26,  amount: 280000, cumulativeAmount: 280000 },
            { date: '2024-03-10', daysElapsed: 55,  amount: 280000, cumulativeAmount: 560000 },
            { date: '2024-06-10', daysElapsed: 147, amount: 280000, cumulativeAmount: 840000 },
            { date: '2024-09-10', daysElapsed: 239, amount: 280000, cumulativeAmount: 1120000 },
            { date: '2025-01-10', daysElapsed: 360, amount: 280000, cumulativeAmount: 1400000 },
            { date: '2025-06-10', daysElapsed: 511, amount: 280000, cumulativeAmount: 1680000 },
          ],
        },
      ])
      return
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (!user) return
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) return
      const data = snap.data()
      if (data.loans) setLoansState(data.loans)
    })
    return unsub
  }, [])

  const setLoans = async (updated) => {
    setLoansState(updated)
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), { loans: updated }, { merge: true })
    }
  }

  return (
    <LoansContext.Provider value={{ loans, setLoans }}>
      {children}
    </LoansContext.Provider>
  )
}

export const useLoans = () => useContext(LoansContext)
