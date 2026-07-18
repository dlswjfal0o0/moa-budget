import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { usePurchases } from '../contexts/PurchasesContext'

// RevenueCat에 실제 상품을 만들 때 이 식별자로 맞춰야 구독 버튼이 동작한다.
const TIERS = [
  {
    key: 'promo', label: '1년 프로모션', badge: '50% 할인',
    monthly: { id: 'promo_monthly', price: 1100 },
    annual: { id: 'promo_annual', price: 10000 },
  },
  {
    key: 'standard', label: '일반',
    monthly: { id: 'standard_monthly', price: 2200 },
    annual: { id: 'standard_annual', price: 20000 },
  },
]

const PERIODS = [
  { key: 'monthly', label: '월간', unit: '월' },
  { key: 'annual', label: '연간', unit: '년' },
]

const fmt = (n) => n.toLocaleString('ko-KR')

// 요금제 목록(1년 프로모션 / 일반 × 월간 / 연간). PaywallModal, TrialWelcomeModal이 공유.
export default function SubscriptionPlanList({ onPurchased }) {
  const { themeData: t } = useTheme() || {}
  const primary = t?.primary || '#3182F6'
  const primaryLight = t?.primaryLight || '#E8F3FF'
  const purchases = usePurchases()

  const [period, setPeriod] = useState('monthly')
  const [tierKey, setTierKey] = useState('promo')
  const [offering, setOffering] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    purchases?.getOfferings()
      .then(o => { if (!cancelled) setOffering(o) })
      .catch(() => { if (!cancelled) setOffering(null) })
    return () => { cancelled = true }
  }, [purchases])

  const tier = TIERS.find(x => x.key === tierKey)
  const periodMeta = PERIODS.find(p => p.key === period)
  const plan = tier[period]

  const handleSubscribe = async () => {
    setError('')
    setBusy(true)
    try {
      const pkg = offering?.availablePackages?.find(p => p.identifier === plan.id)
      if (!pkg) throw new Error('상품을 찾을 수 없어요')
      await purchases.purchasePackage(pkg)
      onPurchased?.()
    } catch (err) {
      if (!err?.userCancelled) setError('아직 구매할 수 없는 상품이에요. iOS 앱에서 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* 결제 주기 토글 */}
      <div style={{ display: 'flex', background: '#F2F4F6', borderRadius: 9999, padding: 3, marginBottom: 14 }}>
        {PERIODS.map(p => {
          const sel = period === p.key
          return (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9999, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: sel ? 700 : 500,
                background: sel ? primary : 'transparent',
                color: sel ? '#fff' : '#8B95A1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'background 0.15s, color 0.15s',
              }}>
              {p.label}
              {p.key === 'annual' && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999,
                  background: sel ? 'rgba(255,255,255,0.25)' : `${primary}1A`,
                  color: sel ? '#fff' : primary,
                }}>24% 절약</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 요금제 카드 (라디오 선택) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {TIERS.map(tr => {
          const sel = tr.key === tierKey
          const p = tr[period]
          return (
            <button key={tr.key} onClick={() => setTierKey(tr.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderRadius: 16, border: `1.5px solid ${sel ? primary : '#E5E8EB'}`,
                background: sel ? primaryLight : '#fff', cursor: 'pointer', textAlign: 'left',
              }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${sel ? primary : '#D1D6DB'}`,
                background: sel ? primary : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>{tr.label}</span>
                  {tr.badge && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#FF5A5F', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
                      {tr.badge}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: sel ? primary : '#191F28' }}>{fmt(p.price)}원</span>
                <span style={{ fontSize: 12, color: '#8B95A1' }}>/{periodMeta.unit}</span>
              </div>
            </button>
          )
        })}
      </div>

      {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{error}</p>}

      <button onClick={handleSubscribe} disabled={busy}
        style={{
          width: '100%', padding: '15px', borderRadius: 16, border: 'none',
          background: primary, color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}>
        {busy ? '처리 중...' : `${fmt(plan.price)}원/${periodMeta.unit} 구독하기`}
      </button>
    </div>
  )
}
