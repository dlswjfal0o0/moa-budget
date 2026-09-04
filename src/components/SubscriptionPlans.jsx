import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { usePurchases } from '../contexts/PurchasesContext'

// RevenueCat에 실제 상품을 만들 때 이 식별자로 맞춰야 구독 버튼이 동작한다.
const TIERS = [
  {
    key: 'promo', label: '1년 프로모션', badge: '50% 할인', note: '기간 한정 특가 혜택이에요',
    monthly: { id: 'promo_monthly', price: 1100 },
    annual: { id: 'promo_annual', price: 11000 },
  },
  {
    key: 'standard', label: '일반',
    monthly: { id: 'standard_monthly', price: 2200 },
    annual: { id: 'standard_annual', price: 22000 },
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
  const annualSavingsPercent = Math.round((1 - tier.annual.price / (tier.monthly.price * 12)) * 100)
  const standardTier = TIERS.find(x => x.key === 'standard')

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
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {PERIODS.map(p => {
          const sel = period === p.key
          return (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                background: sel ? '#fff' : 'transparent',
                color: sel ? '#111' : 'rgba(0,0,0,0.4)',
                boxShadow: sel ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}>
              {p.label}
              {p.key === 'annual' && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 9999,
                  background: primary, color: '#fff',
                }}>{annualSavingsPercent}% 절약</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 요금제 카드 (라디오 선택) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {TIERS.map(tr => {
          const sel = tr.key === tierKey
          const p = tr[period]
          const originalPrice = tr.badge ? standardTier[period].price : null
          return (
            <button key={tr.key} onClick={() => setTierKey(tr.key)}
              style={{
                width: '100%', textAlign: 'left', borderRadius: 16, padding: 20, position: 'relative',
                border: `2px solid ${sel ? primary : 'transparent'}`,
                background: sel ? '#fff' : 'rgba(255,255,255,0.6)',
                boxShadow: sel ? `0 4px 24px ${primary}1F` : '0 1px 4px rgba(0,0,0,0.05)',
                transform: sel ? 'scale(1.01)' : 'scale(1)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}>
              {tr.badge && (
                <div style={{
                  position: 'absolute', top: 0, right: 16, padding: '2px 12px',
                  fontWeight: 700, letterSpacing: '0.05em', borderRadius: '0 0 8px 8px',
                  background: primary, color: '#fff', fontSize: 10,
                }}>{tr.badge}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ marginBottom: 2, fontSize: 15, fontWeight: 700, color: '#111' }}>{tr.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: sel ? primary : '#555', letterSpacing: '-0.02em' }}>{fmt(p.price)}원</span>
                    <span style={{ color: 'rgba(0,0,0,0.35)', fontSize: 13 }}>/{periodMeta.unit}</span>
                    {originalPrice != null && (
                      <span style={{ color: 'rgba(0,0,0,0.25)', fontSize: 13, textDecoration: 'line-through' }}>{fmt(originalPrice)}원</span>
                    )}
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: sel ? primary : 'transparent',
                  border: sel ? 'none' : '2px solid rgba(0,0,0,0.15)',
                }}>
                  {sel && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              {tr.note && (
                <>
                  <div style={{ margin: '12px 0', height: 1, background: `${primary}26` }} />
                  <p style={{ color: primary, fontSize: 13 }}>{tr.note}</p>
                </>
              )}
            </button>
          )
        })}
      </div>

      {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{error}</p>}

      <button onClick={handleSubscribe} disabled={busy}
        style={{
          width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderRadius: 16, border: 'none',
          background: `linear-gradient(135deg, ${primary} 0%, #5BA3F8 100%)`,
          color: '#fff', fontSize: 17, fontWeight: 700,
          boxShadow: `0 8px 32px ${primary}59`,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}>
        <span>{busy ? '처리 중...' : `${fmt(plan.price)}원/${periodMeta.unit} 구독하기`}</span>
        <span style={{ fontSize: 20 }}>›</span>
      </button>
    </div>
  )
}
