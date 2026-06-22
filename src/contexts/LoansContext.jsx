import { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const LoansContext = createContext()

export function LoansProvider({ children }) {
  const [loans, setLoansState] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
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
