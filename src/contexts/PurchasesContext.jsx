import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { DEMO_DATA_EVENT, isDemoProActive } from '../utils/demoData'

const PurchasesContext = createContext()

const PRO_ENTITLEMENT_ID = 'pro'
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY
const TRIAL_DAYS = 30

// Auth.jsx가 가입 직후 체험 시작일을 기록한 뒤 보내는 이벤트
export const TRIAL_STARTED_EVENT = 'moa-trial-started'

const isNative = () => {
  try { return window.Capacitor?.isNativePlatform?.() ?? false } catch { return false }
}

// RevenueCat이 연결되지 않은 환경(웹, API 키 미설정)에서는 항상 무료 등급으로 동작
const isConfigurable = () => isNative() && !!REVENUECAT_API_KEY

export function PurchasesProvider({ children }) {
  // isSubscribed: RevenueCat 유료 구독 활성 여부. isPro(기능 접근 가능 여부)는 이것과 무료체험을 합친 값.
  const [isSubscribed, setIsSubscribed] = useState(false)
  // 현재 구독 중인 App Store 상품 ID (구독 안내에서 '구독 중' / '구독 변경하기' 구분용)
  const [activeProductId, setActiveProductId] = useState(null)
  const [loading, setLoading] = useState(isConfigurable())
  const [trialStartedAt, setTrialStartedAt] = useState(null)
  const [trialLoaded, setTrialLoaded] = useState(false)
  // RevenueCat에 현재 로그인 사용자(uid)로 연결해 그 사용자의 구독 정보를 받았는지
  const [rcUserSynced, setRcUserSynced] = useState(false)
  const configuredRef = useRef(false)
  // 베타 테스트 로그인(데모 모드)은 Pro 구독자로 취급 — 개발/베타 빌드에서만 켜진다 (isDemoProActive 참고)
  const [demoPro, setDemoPro] = useState(isDemoProActive)

  useEffect(() => {
    const sync = () => setDemoPro(isDemoProActive())
    window.addEventListener(DEMO_DATA_EVENT, sync)
    // 실제 계정으로 로그인하면 Auth.jsx가 moa_demo_mode를 지우므로 인증 상태가 바뀔 때도 다시 확인한다
    const unsub = onAuthStateChanged(auth, sync)
    return () => { window.removeEventListener(DEMO_DATA_EVENT, sync); unsub() }
  }, [])

  const applyCustomerInfo = useCallback((customerInfo) => {
    const entitlement = customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT_ID]
    setIsSubscribed(!!entitlement)
    setActiveProductId(entitlement?.productIdentifier ?? null)
  }, [])

  // 가입 시 Auth.jsx가 기록한 trialStartedAt을 로그인할 때마다 불러온다 (RevenueCat 설정 여부와 무관하게 항상 동작)
  // trialLoaded: 로그인한 사용자의 체험 정보를 한 번이라도 읽었는지 — isPro가 '확정'됐는지 판단할 때 쓴다(ready 참고)
  useEffect(() => {
    const load = async (user) => {
      if (!user) { setTrialStartedAt(null); setTrialLoaded(false); return }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const raw = snap.exists() ? snap.data().trialStartedAt : null
        // 새 가입자는 서버 Timestamp, 기존 가입자는 ISO 문자열로 저장돼 있다
        setTrialStartedAt(raw ? (typeof raw.toDate === 'function' ? raw.toDate() : new Date(raw)) : null)
      } catch (err) {
        console.error('[Purchases] 무료체험 정보 로딩 실패', err)
      } finally {
        setTrialLoaded(true)
      }
    }
    const unsub = onAuthStateChanged(auth, load)
    const onTrialStarted = () => load(auth.currentUser)
    window.addEventListener(TRIAL_STARTED_EVENT, onTrialStarted)
    return () => { unsub(); window.removeEventListener(TRIAL_STARTED_EVENT, onTrialStarted) }
  }, [])

  useEffect(() => {
    if (!isConfigurable()) return

    let removeListener = null
    let cancelled = false

    const init = async () => {
      try {
        if (!configuredRef.current) {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY })
          configuredRef.current = true
        }
        const listener = await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          applyCustomerInfo(customerInfo)
        })
        if (cancelled) { listener?.remove?.(); return }
        removeListener = () => listener?.remove?.()
        const { customerInfo } = await Purchases.getCustomerInfo()
        applyCustomerInfo(customerInfo)
      } catch (err) {
        console.error('[Purchases] 초기화 실패', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()

    return () => { cancelled = true; removeListener?.() }
  }, [applyCustomerInfo])

  useEffect(() => {
    if (!isConfigurable()) return
    const unsub = onAuthStateChanged(auth, async (user) => {
      setRcUserSynced(false)
      try {
        if (user) {
          const { customerInfo } = await Purchases.logIn({ appUserID: user.uid })
          applyCustomerInfo(customerInfo)
        } else {
          const { customerInfo } = await Purchases.logOut()
          applyCustomerInfo(customerInfo)
        }
      } catch (err) {
        console.error('[Purchases] 로그인 연동 실패', err)
      } finally {
        // 실패해도 true로 둔다 — 영원히 '확정 안 됨'으로 남으면 자동 등록 등이 아예 멈추므로
        setRcUserSynced(true)
      }
    })
    return unsub
  }, [applyCustomerInfo])

  const getOfferings = async () => {
    if (!isConfigurable()) return null
    try {
      const offerings = await Purchases.getOfferings()
      return offerings.current
    } catch (err) {
      console.error('[Purchases] 상품 조회 실패', err)
      return null
    }
  }

  const purchasePackage = async (pkg) => {
    if (!isConfigurable()) throw new Error('구독은 앱에서만 가능해요')
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    applyCustomerInfo(customerInfo)
    return customerInfo
  }

  const restorePurchases = async () => {
    if (!isConfigurable()) throw new Error('구독은 앱에서만 가능해요')
    const { customerInfo } = await Purchases.restorePurchases()
    applyCustomerInfo(customerInfo)
    return customerInfo
  }

  const subscribed = isSubscribed || demoPro
  const currentProductId = demoPro && !isSubscribed ? 'promo_monthly' : activeProductId
  const trialEndsAt = trialStartedAt ? new Date(trialStartedAt.getTime() + TRIAL_DAYS * 86400000) : null
  const now = new Date()
  const isTrialActive = !subscribed && !!trialEndsAt && now < trialEndsAt
  const trialDaysLeft = isTrialActive ? Math.max(0, Math.ceil((trialEndsAt - now) / 86400000)) : 0
  // 웹에는 결제 수단이 없고 기존 웹 사용자는 이미 전체 무료로 써왔으므로, Pro 게이팅은 네이티브 앱에서만 적용한다.
  const isPro = !isNative() || subscribed || isTrialActive
  // isPro가 확정됐는지: 구독 정보(RevenueCat)와 체험 정보를 모두 읽은 뒤에만 true.
  // 그 전의 isPro=false는 '아직 모름'일 수 있으므로, Pro 여부로 데이터를 쓰는 작업(고정지출 자동 등록 등)은 이 값을 기다린다.
  const ready = !isNative() || (trialLoaded && (!isConfigurable() || (!loading && rcUserSynced)))

  return (
    <PurchasesContext.Provider value={{
      isPro, isSubscribed: subscribed, activeProductId: currentProductId, isTrialActive, trialEndsAt, trialDaysLeft,
      loading, ready, getOfferings, purchasePackage, restorePurchases,
    }}>
      {children}
    </PurchasesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePurchases = () => useContext(PurchasesContext)
// eslint-disable-next-line react-refresh/only-export-components
export const useIsPro = () => useContext(PurchasesContext)?.isPro ?? false
