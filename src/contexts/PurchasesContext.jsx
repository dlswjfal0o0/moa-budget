import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const PurchasesContext = createContext()

const PRO_ENTITLEMENT_ID = 'pro'
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY
const TRIAL_DAYS = 30

const isNative = () => {
  try { return window.Capacitor?.isNativePlatform?.() ?? false } catch { return false }
}

// RevenueCat이 연결되지 않은 환경(웹, API 키 미설정)에서는 항상 무료 등급으로 동작
const isConfigurable = () => isNative() && !!REVENUECAT_API_KEY

export function PurchasesProvider({ children }) {
  // isSubscribed: RevenueCat 유료 구독 활성 여부. isPro(기능 접근 가능 여부)는 이것과 무료체험을 합친 값.
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(isConfigurable())
  const [trialStartedAt, setTrialStartedAt] = useState(null)
  const configuredRef = useRef(false)

  const applyCustomerInfo = useCallback((customerInfo) => {
    setIsSubscribed(!!customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT_ID])
  }, [])

  // 가입 시 Auth.jsx가 기록한 trialStartedAt을 로그인할 때마다 불러온다 (RevenueCat 설정 여부와 무관하게 항상 동작)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setTrialStartedAt(null); return }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const raw = snap.exists() ? snap.data().trialStartedAt : null
        setTrialStartedAt(raw ? new Date(raw) : null)
      } catch (err) {
        console.error('[Purchases] 무료체험 정보 로딩 실패', err)
      }
    })
    return unsub
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

  const trialEndsAt = trialStartedAt ? new Date(trialStartedAt.getTime() + TRIAL_DAYS * 86400000) : null
  const now = new Date()
  const isTrialActive = !isSubscribed && !!trialEndsAt && now < trialEndsAt
  const trialDaysLeft = isTrialActive ? Math.max(0, Math.ceil((trialEndsAt - now) / 86400000)) : 0
  // 웹에는 결제 수단이 없고 기존 웹 사용자는 이미 전체 무료로 써왔으므로, Pro 게이팅은 네이티브 앱에서만 적용한다.
  const isPro = !isNative() || isSubscribed || isTrialActive

  return (
    <PurchasesContext.Provider value={{
      isPro, isSubscribed, isTrialActive, trialEndsAt, trialDaysLeft,
      loading, getOfferings, purchasePackage, restorePurchases,
    }}>
      {children}
    </PurchasesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePurchases = () => useContext(PurchasesContext)
// eslint-disable-next-line react-refresh/only-export-components
export const useIsPro = () => useContext(PurchasesContext)?.isPro ?? false
