import { useState, useEffect } from 'react'
import { usePurchases } from '../contexts/PurchasesContext'

// RevenueCat에 실제 상품을 만들 때 이 4개 식별자로 맞춰야 아래 목록의 구매 버튼이 동작한다.
const SUBSCRIPTION_PLANS = [
  { id: 'promo_monthly', group: '1년 프로모션', period: '월', price: '1,100원' },
  { id: 'promo_annual', group: '1년 프로모션', period: '연', price: '10,000원' },
  { id: 'standard_monthly', group: '일반', period: '월', price: '2,200원' },
  { id: 'standard_annual', group: '일반', period: '연', price: '20,000원' },
]

const PLAN_GROUPS = [...new Set(SUBSCRIPTION_PLANS.map(p => p.group))]

// 구독 상품 4종(1년 프로모션/일반 × 월/연) 목록. PaywallModal, TrialWelcomeModal이 공유.
export default function SubscriptionPlanList({ primary = '#3182F6', onPurchased }) {
  const purchases = usePurchases()
  const [offering, setOffering] = useState(undefined)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    purchases?.getOfferings()
      .then(o => { if (!cancelled) setOffering(o) })
      .catch(() => { if (!cancelled) setOffering(null) })
    return () => { cancelled = true }
  }, [purchases])

  const handleSelect = async (plan) => {
    setError('')
    setBusyId(plan.id)
    try {
      const pkg = offering?.availablePackages?.find(p => p.identifier === plan.id)
      if (!pkg) throw new Error('상품을 찾을 수 없어요')
      await purchases.purchasePackage(pkg)
      onPurchased?.()
    } catch (err) {
      if (!err?.userCancelled) setError('아직 구매할 수 없는 상품이에요. iOS 앱에서 다시 시도해주세요.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {PLAN_GROUPS.map(group => (
        <div key={group} style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8B95A1', marginBottom: 6 }}>{group}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {SUBSCRIPTION_PLANS.filter(p => p.group === group).map(plan => (
              <button key={plan.id} onClick={() => handleSelect(plan)} disabled={!!busyId}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: 14, border: `1.5px solid ${primary}`,
                  background: '#fff', cursor: busyId ? 'not-allowed' : 'pointer', textAlign: 'center',
                }}>
                <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>{plan.period}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: primary }}>
                  {busyId === plan.id ? '처리 중...' : plan.price}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  )
}
