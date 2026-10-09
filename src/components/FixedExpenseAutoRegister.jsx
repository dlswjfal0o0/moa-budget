import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { usePurchases } from '../contexts/PurchasesContext'
import { planAutoRegistration, FIXED_AUTO_REGISTERED_EVENT } from '../utils/autoRegisterFixed'
import { Sentry } from '../utils/sentry'

// StrictMode 이중 실행·빠른 재실행으로 같은 거래가 두 번 들어가지 않게 진행 중인 작업을 공유한다
let running = null

async function runAutoRegistration(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const fixedList = snap.exists() ? snap.data().fixedExpenses || [] : []
  const { transactions, updated } = planAutoRegistration(fixedList)
  if (transactions.length === 0) return
  const createdAt = new Date().toISOString()
  await Promise.all(transactions.map(t => addDoc(collection(db, 'transactions'), { ...t, uid, createdAt })))
  await setDoc(ref, { fixedExpenses: updated }, { merge: true })
  window.dispatchEvent(new Event(FIXED_AUTO_REGISTERED_EVENT))
}

// Pro 사용자의 고정지출을 결제일에 맞춰 가계부에 자동 등록한다.
// 예전에는 캘린더 탭을 열 때만, 그것도 화면이 처음 열린 순간의 Pro 상태로만 판단해서
// 캘린더를 안 여는 사용자나 구독 정보가 늦게 불러와진 경우 등록이 빠졌다.
// 이제 앱 전체에서 로그인 + 구독/체험 정보가 확정(ready)된 뒤 실행하고, 앱으로 돌아올 때마다 다시 확인한다.
export default function FixedExpenseAutoRegister() {
  const { isPro, ready } = usePurchases() || {}
  const [uid, setUid] = useState(null)
  const [visibleTick, setVisibleTick] = useState(0)

  useEffect(() => onAuthStateChanged(auth, u => setUid(u?.uid ?? null)), [])

  // 앱을 켜둔 채 날짜가 바뀐 뒤 돌아온 경우(결제일 도래)에도 등록되도록
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') setVisibleTick(t => t + 1) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (!uid || !ready || !isPro) return
    if (localStorage.getItem('moa_demo_mode') === 'true') return // 데모 데이터는 로컬에만 있다
    if (running) return
    running = runAutoRegistration(uid)
      .catch(err => {
        console.error('[AutoRegister] 고정지출 자동 등록 실패', err)
        Sentry.captureException(err)
      })
      .finally(() => { running = null })
  }, [uid, ready, isPro, visibleTick])

  return null
}
