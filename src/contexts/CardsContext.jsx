import { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { DEMO_DATA_EVENT } from '../utils/demoData'

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

  // 베타 테스트 로그인이 moa_cards를 채운 직후 반영 (마운트 시점엔 비어 있었을 수 있음)
  useEffect(() => {
    const reload = () => {
      try { setCardsState(JSON.parse(localStorage.getItem('moa_cards') || '[]')) } catch { /* 무시 */ }
    }
    window.addEventListener(DEMO_DATA_EVENT, reload)
    return () => window.removeEventListener(DEMO_DATA_EVENT, reload)
  }, [])

  // 로그인 시 Firestore에서 최신 카드 데이터 동기화
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid))
        // 심사용 데모 계정은 로그인 직후 데모 카드가 들어가므로 Firestore 값으로 덮어쓰지 않는다
        if (localStorage.getItem('moa_demo_mode') === 'true') return
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
