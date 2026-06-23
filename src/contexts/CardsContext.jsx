import { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const CardsContext = createContext()

export function CardsProvider({ children }) {
  const [cards, setCardsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moa_cards') || '[]') } catch { return [] }
  })

  // localStorage + state 동시 업데이트
  const setCards = (updated) => {
    setCardsState(updated)
    localStorage.setItem('moa_cards', JSON.stringify(updated))
  }

  // 로그인 시 Firestore에서 최신 카드 데이터 동기화
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists() && snap.data().cards) {
          setCards(snap.data().cards)
        }
      }
    })
    return unsub
  }, [])

  return (
    <CardsContext.Provider value={{ cards, setCards }}>
      {children}
    </CardsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCards = () => useContext(CardsContext)
