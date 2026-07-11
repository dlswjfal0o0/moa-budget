import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { getCategoryColors, DEFAULT_CATEGORIES } from '../styles/theme'
import { useState, useEffect } from 'react'
import { useStagger } from '../hooks/useStagger'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { callAI } from '../utils/aiClient'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import { useTheme } from '../contexts/ThemeContext'
import { useCards } from '../contexts/CardsContext'
import { useSettings } from '../contexts/SettingsContext'
import { getDeterminismParams, hashForSeed } from '../utils/aiPrompt'

// AI 캐시 버전. 프롬프트/스키마를 바꾸면 이 값을 올려 과거 캐시를 무효화한다.
const AI_CACHE_VERSION = 1

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '8px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{payload[0].name}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

function TipIcon({ type, color = '#3182F6' }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (type) {
    case 'food': return <svg {...p}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
    case 'chart': return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    case 'adjust': return <svg {...p}><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    case 'money': return <svg {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
    case 'calendar': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'target': return <svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    default: return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  }
}

// eslint-disable-next-line no-unused-vars
function _BudgetCard({ budget, spent, themeData, fmt }) {
  const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0
  const remaining = Math.max(budget.amount - spent, 0)
  const color = pct >= 100 ? '#FF5A5F' : pct >= 80 ? '#F59E0B' : themeData.primary

  return (
    <div style={{ background: themeData.card, borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{budget.label}</p>
      <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 12 }}>
        {budget.startDate?.slice(5).replace('-','/')} ~ {budget.endDate?.slice(5).replace('-','/')}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 72, height: 40, flexShrink: 0 }}>
          <svg width="72" height="40" viewBox="0 0 72 40">
            <path d="M 6 36 A 30 30 0 0 1 66 36" fill="none" stroke="#F2F4F6" strokeWidth="8" strokeLinecap="round"/>
            <path d="M 6 36 A 30 30 0 0 1 66 36" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={Math.PI * 30} strokeDashoffset={Math.PI * 30 * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
          </svg>
          <p style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
            {Math.round(pct)}%
          </p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>잔여</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#2ECC71' }}>{fmt(remaining)}원</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { themeData } = useTheme()
  const { cards } = useCards()
  const { categories, aiAnalysisStyle, aiShowAdvice } = useSettings()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState(() => {
    try {
        const now = new Date()
        const ms = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
        const cached = localStorage.getItem(`moa_txns_${ms}`)
        return cached ? JSON.parse(cached) : []
    } catch { return [] }
  })
  const [budgets, setBudgets] = useState([])
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [newBudget, setNewBudget] = useState({ label: '', startDate: '', endDate: '', amount: '', categories: [] })
  const [budgetInsights, setBudgetInsights] = useState({})
  const [loadingInsightId, setLoadingInsightId] = useState(null)
  // AI 인사이트 캐시 (계정 기준 동기화). localStorage로 즉시 로드 후 Firestore로 덮어씀. 소비/공과금 분석과 동일한 저장소를 공유.
  const [aiCache, setAiCache] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moa_ai_cache') || '{}') } catch { return {} }
  })
  const [expandedBudgetEditId, setExpandedBudgetEditId] = useState(null)
  const [expandedTipIds, setExpandedTipIds] = useState({})
  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [editBudgetData, setEditBudgetData] = useState({ label: '', startDate: '', endDate: '', amount: '', categories: [] })
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [fixedExpenses, setFixedExpenses] = useState([])

  useEffect(() => {
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (isDemo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { const b = localStorage.getItem('moa_budgets'); if (b) setBudgets(JSON.parse(b)) } catch { /* ignore */ }
      try { const f = localStorage.getItem('moa_fixed_expenses'); setFixedExpenses(f ? JSON.parse(f) : []) } catch { setFixedExpenses([]) }
      setBudgetInsights({
        1: {
          status: 'warning',
          summary: '생활비 예산의 51%를 사용했어요. 남은 기간 동안 하루 약 15,000원씩 쓸 수 있어요.',
          tips: [
            { icon: 'food',   title: '식비 조절이 필요해요', detail: '이번 달 배달음식 지출이 늘었어요. 집밥 횟수를 늘리면 남은 예산을 여유 있게 유지할 수 있어요.' },
            { icon: 'chart',  title: '지출 패턴 점검', detail: '주말 지출이 평일보다 높은 편이에요. 주말 소비 계획을 미리 세워두면 초과를 막을 수 있어요.' },
            { icon: 'adjust', title: '마지막 일주일 전략', detail: '남은 예산을 7일로 나눠 일일 한도를 정해보세요. 작은 목표가 예산 관리를 쉽게 만들어줘요.' },
          ],
        },
        2: {
          status: 'good',
          summary: '교통비 예산을 훌륭하게 관리하고 있어요! 현재 사용률 54%로 여유가 있어요.',
          tips: [
            { icon: 'chart',  title: '이번 달 교통비 우수', detail: '지난달 대비 교통비가 안정적으로 유지되고 있어요. 현재 패턴을 그대로 유지해보세요.' },
            { icon: 'adjust', title: '남은 예산 활용 팁', detail: '남은 교통 예산으로 카풀이나 자전거 이용을 더 늘리면 다음 달 예산을 더 줄일 수도 있어요.' },
            { icon: 'food',   title: '대중교통 최적화', detail: '정기권이나 교통카드 할인 혜택을 활용하면 매달 교통비를 10~15% 절약할 수 있어요.' },
          ],
        },
      })
      return
    }
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists() && snap.data().budgets) setBudgets(snap.data().budgets)
        if (snap.data().fixedExpenses) setFixedExpenses(snap.data().fixedExpenses)
        if (snap.exists() && snap.data().aiCache) {
          const remote = snap.data().aiCache
          setAiCache(remote)
          try { localStorage.setItem('moa_ai_cache', JSON.stringify(remote)) } catch { /* ignore */ }
        }
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', monthStr))
    getDocs(q).then(snap => {
        const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setTransactions(txns)
        localStorage.setItem(`moa_txns_${monthStr}`, JSON.stringify(txns))
    })
  }, [user])

  const saveBudgets = async (updated) => {
    setBudgets(updated)
    if (user) await setDoc(doc(db, 'users', user.uid), { budgets: updated }, { merge: true })
  }

  // AI 캐시 저장: 로컬 + 계정(Firestore) 동시 반영. kind='budget', key=budget.id
  const persistAiCache = async (kind, key, sig, data) => {
    setAiCache(prev => {
      const next = { ...prev, [kind]: { ...(prev[kind] || {}), [key]: { sig, data } } }
      try { localStorage.setItem('moa_ai_cache', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { aiCache: { [kind]: { [key]: { sig, data } } } }, { merge: true })
      } catch { /* ignore */ }
    }
  }

  const handleAddBudget = () => {
    if (!newBudget.label || !newBudget.startDate || !newBudget.endDate || !newBudget.amount) return alert('모든 항목을 입력해주세요.')
    saveBudgets([...budgets, { id: Date.now(), ...newBudget, amount: Number(newBudget.amount) }])
    setNewBudget({ label: '', startDate: '', endDate: '', amount: '', categories: [] })
    setShowAddBudget(false)
  }

  const handleSaveBudget = () => {
    if (!editBudgetData.label || !editBudgetData.startDate || !editBudgetData.endDate || !editBudgetData.amount) return alert('모든 항목을 입력해주세요.')
    saveBudgets(budgets.map(b => b.id === editingBudgetId ? { ...b, ...editBudgetData, amount: Number(editBudgetData.amount) } : b))
    setEditingBudgetId(null)
  }

  const getAiInsight = async (budget, spent) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(budget.endDate) - new Date()) / 86400000))
    const remaining = budget.amount - spent
    const pct = Math.round((spent / budget.amount) * 100)
    const status = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'good'
    // 데이터 시그니처: 동일 데이터 + 동일 설정(스타일/조언)이면 캐시된 결과를 그대로 사용 → 매번 결과가 달라지지 않음
    const sig = hashForSeed(JSON.stringify({ v: AI_CACHE_VERSION, label: budget.label, amount: budget.amount, spent, daysLeft, style: aiAnalysisStyle, advice: aiShowAdvice }))
    const cacheKey = String(budget.id)
    const cached = aiCache.budget?.[cacheKey]
    if (cached && cached.sig === sig && cached.data) { setBudgetInsights(prev => ({ ...prev, [budget.id]: cached.data })); return }
    setLoadingInsightId(budget.id)
    try {
        const schema = aiShowAdvice
          ? `{"status":"${status}","summary":"2문장 이내 현황 요약","tips":[{"icon":"food|chart|adjust|money|calendar|target 중 하나","title":"조언 제목","detail":"구체적이고 실행 가능한 설명 (청유형)"}]}`
          : `{"status":"${status}","summary":"2문장 이내 현황 요약"}`
        const data = await callAI({
            max_tokens: 600, ...getDeterminismParams(),
            domain: 'budget', styleLevel: aiAnalysisStyle, showAdvice: aiShowAdvice,
            messages: [{ role: 'user', content:
                `예산 분석 요청. 예산명: "${budget.label}", 목표: ${fmt(budget.amount)}원, 사용: ${fmt(spent)}원 (${pct}%), 잔여: ${fmt(remaining)}원, 남은 기간: ${daysLeft}일.\n\nJSON으로만 응답하세요. 마크다운, 코드블록, 설명 없이 순수 JSON만 출력하세요. tips는 서로 다른 내용으로 작성하세요.\n\n응답 형식(이 형식 그대로만, 값은 위 규칙대로 새로 작성):\n${schema}`
            }]
        })
        const raw = data.content?.[0]?.text || ''
        try {
            const jsonMatch = raw.match(/\{[\s\S]*\}/)
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
            setBudgetInsights(prev => ({ ...prev, [budget.id]: parsed }))
            persistAiCache('budget', cacheKey, sig, parsed)
        } catch {
            setBudgetInsights(prev => ({ ...prev, [budget.id]: { status: 'good', summary: raw, tips: [] } }))
        }
    } catch {
        setBudgetInsights(prev => ({ ...prev, [budget.id]: { status: 'good', summary: '분석에 실패했어요. 잠시 후 다시 시도해주세요.', tips: [] } }))
    }
    setLoadingInsightId(null)
  }

  // eslint-disable-next-line no-unused-vars
  const _getLocalInsight = (budget, spent) => {
    const remaining = budget.amount - spent
    const daysLeft = Math.max(1, Math.ceil((new Date(budget.endDate) - new Date()) / 86400000))
    const pct = (spent / budget.amount) * 100
    const daily = Math.floor(remaining / daysLeft)
    if (spent > budget.amount) return { color: '#ef4444', msg: `예산 ${fmt(spent - budget.amount)}원 초과! 지출을 줄여주세요.` }
    if (pct > 80) return { color: '#ef4444', msg: `예산의 ${Math.round(pct)}% 사용. 하루 ${fmt(daily)}원만 가능해요.` }
    if (pct > 50) return { color: '#f59e0b', msg: `절반 이상 사용. 남은 ${daysLeft}일, 하루 ${fmt(daily)}원 가능해요.` }
    return { color: '#22c55e', msg: `여유 있어요! 하루 ${fmt(daily)}원씩 쓸 수 있어요.` }
  }

  const showLoan = localStorage.getItem('moa_showLoan') === 'true'
  // Stagger: 0=header, 1=budget, 2=upcoming, 3=category, 4=recent
  const isVisible = useStagger(5, 30, 60)
  const stagger = (i) => ({
    opacity: isVisible(i) ? 1 : 0,
    transform: isVisible(i) ? 'translateY(0)' : 'translateY(14px)',
    transition: 'opacity 300ms ease, transform 300ms ease',
  })
  // 신용카드 추적 방식에 따라 집계 제외 여부 판단
  const getCreditCard = (p) => cards.find(c => c.name === p && c.cardType === 'credit')
  const isCreditExcluded = (t) => {
    if (t.cardBilling) {
      // 대금 납부: billing 모드에서는 지출로 집계
      const card = getCreditCard(t.payment)
      return card?.creditTracking !== 'billing'
    }
    // 카드 사용: billing 모드에서는 집계 제외
    const card = getCreditCard(t.payment)
    return card?.creditTracking === 'billing'
  }
  const expenses = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan))
  const incomes = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'income' && (!showLoan || !t.isLoan))
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
  const expenseByCategory = expenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
  const fmt = n => n.toLocaleString('ko-KR')
  const upcomingPayments = fixedExpenses
    .filter(f => !f.done && f.dueDate)
    .map(f => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)  // ← 자정 기준으로 정규화
        const dueDay = parseInt(f.dueDate.split('-')[2])
        let next = new Date(today.getFullYear(), today.getMonth(), dueDay)
        if (next < today) next = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
        const daysLeft = Math.ceil((next - today) / 86400000)
        return { ...f, daysLeft, dueDay }
    })
    .filter(f => f.daysLeft >= 0 && f.daysLeft <= 10)
    .sort((a, b) => a.daysLeft - b.daysLeft)
  const categoryData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const colorMap = getCategoryColors(categoryData.map(c => c.name))
  // 기본 카테고리 + 가계부에서 실제 사용된 카테고리 합산
  const allExpenseCategories = [...new Set([...(categories?.expense || DEFAULT_CATEGORIES.expense), ...expenses.map(t => t.category).filter(Boolean)])]

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '1.5px solid #E5E8EB', fontSize: 15, outline: 'none',
    background: '#F7F8FA', color: '#191F28', boxSizing: 'border-box'
  }

  return (
    <div style={{ background: themeData.bg || '#F7F8FA', minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* 헤더 — Toss 스타일 컬러 배너 */}
      <div style={{ background: themeData.primary, padding: 'calc(env(safe-area-inset-top, 0px) + 24px) 24px 28px', color: '#fff', ...stagger(0) }}>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 4, fontWeight: 500 }}>{now.getFullYear()}년 {now.getMonth()+1}월</p>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, opacity: 0.95 }}>이번 달 현황</p>
        {/* 잔액 카드 */}
        <div style={{ background: 'rgba(0,0,0,0.14)', borderRadius: 20, padding: '20px 24px' }}>
          <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 8, fontWeight: 500 }}>이번 달 잔액</p>
          <p style={{ fontSize: 38, fontWeight: 700, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1 }}>
            {fmt(totalIncome - totalExpense)}원
          </p>
          <div style={{ display: 'flex', gap: 0 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 4, fontWeight: 500 }}>수입</p>
              <p style={{ fontSize: 17, fontWeight: 700 }}>+{fmt(totalIncome)}원</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 20px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 4, fontWeight: 500 }}>지출</p>
              <p style={{ fontSize: 17, fontWeight: 700 }}>-{fmt(totalExpense)}원</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        {/* 예산 관리 */}
        <div style={{ marginBottom: 32, ...stagger(1) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: themeData.text || '#191F28' }}>예산 관리</p>
            <button onClick={() => setShowAddBudget(true)}
              style={{ background: themeData.primary, border: 'none', borderRadius: 12, padding: '7px 16px', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ 추가</button>
          </div>

          {budgets.length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>예산을 추가해보세요</p>
          ) : (
            budgets.map(b => {
              const bCats = Array.isArray(b.categories) ? b.categories : []
              // 총 지출과 동일한 신용카드 필터 적용
              const budgetTxns = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan))
              const spent = budgetTxns.filter(t => t.date >= b.startDate && t.date <= b.endDate && (bCats.length === 0 || bCats.includes(t.category))).reduce((s, t) => s + t.amount, 0)
              const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0
              const exceeded = spent > b.amount
              const color = exceeded ? '#FF5A5F' : pct >= 80 ? '#F59E0B' : themeData.primary
              const aiText = budgetInsights[b.id]
              // eslint-disable-next-line no-unused-vars
              const _arcLen = Math.PI * 34
              return (
                <div key={b.id} style={{ marginBottom: 12, background: themeData.card || '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  {/* 클릭 시 수정/삭제 토글 */}
                  <div style={{ padding: '20px 20px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedBudgetEditId(expandedBudgetEditId === b.id ? null : b.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: themeData.text || '#191F28' }}>{b.label}</span>
                        {exceeded && <span style={{ fontSize: 11, background: '#FFF1F1', color: '#FF5A5F', borderRadius: 12, padding: '3px 8px', fontWeight: 600 }}>초과</span>}
                      </div>
                      <span style={{ fontSize: 12, color: '#8B95A1' }}>{b.startDate?.slice(5).replace('-','/')} ~ {b.endDate?.slice(5).replace('-','/')}</span>
                    </div>
                    {/* 반원 그래프 + 금액 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <svg width="88" height="48" viewBox="0 0 88 48">
                          <path d="M 8 44 A 36 36 0 0 1 80 44" fill="none" stroke="#F2F4F6" strokeWidth="9" strokeLinecap="round"/>
                          <path d="M 8 44 A 36 36 0 0 1 80 44" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
                            strokeDasharray={Math.PI * 36} strokeDashoffset={Math.PI * 36 * (1 - pct / 100)}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
                        </svg>
                        <p style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                          {Math.round(pct)}%
                        </p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>이번 달 사용</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: themeData.text || '#191F28', marginBottom: 4 }}>{fmt(spent)}원</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: exceeded ? '#FF5A5F' : '#2ECC71' }}>
                          {exceeded ? `${fmt(spent - b.amount)}원 초과` : `잔여 ${fmt(b.amount - spent)}원`}
                        </p>
                      </div>
                    </div>
                    {/* AI 분석 결과 — 카드형 토글 UI */}
                    {aiText && (() => {
                      const ai = typeof aiText === 'string' ? { status: 'good', summary: aiText, tips: [] } : aiText
                      const sc = {
                        danger:  { color: '#FF5A5F', bg: '#FFF1F1', dot: '#FF5A5F' },
                        warning: { color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
                        good:    { color: themeData.primary, bg: themeData.primary + '10', dot: themeData.primary },
                      }[ai.status] || { color: themeData.primary, bg: themeData.primary + '10', dot: themeData.primary }
                      const tips = Array.isArray(ai.tips) ? ai.tips.slice(0, 3) : []
                      return (
                        <div style={{ marginTop: 14 }} onClick={e => e.stopPropagation()}>
                          {/* 요약 카드 */}
                          <div style={{ background: sc.bg, borderRadius: 14, padding: '13px 14px', marginBottom: tips.length > 0 ? 10 : 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0, marginTop: 5 }} />
                            <p style={{ fontSize: 13, color: '#191F28', lineHeight: 1.65 }}>{ai.summary}</p>
                          </div>
                          {/* 토글 조언 카드 3개 */}
                          {tips.map((tip, i) => {
                            const tipKey = `${b.id}-${i}`
                            const isOpen = !!expandedTipIds[tipKey]
                            return (
                              <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E8EB', marginBottom: i < tips.length - 1 ? 8 : 0, overflow: 'hidden' }}>
                                <button
                                  onClick={e => { e.stopPropagation(); setExpandedTipIds(prev => ({ ...prev, [tipKey]: !prev[tipKey] })) }}
                                  style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', minHeight: 52, WebkitTapHighlightColor: 'transparent' }}>
                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: themeData.primary + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <TipIcon type={tip.icon} color={themeData.primary} />
                                  </div>
                                  <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#191F28', textAlign: 'left', lineHeight: 1.3 }}>{tip.title}</p>
                                  <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s ease', flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9CDD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                  </div>
                                </button>
                                <div style={{ maxHeight: isOpen ? '300px' : '0px', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
                                  <div style={{ background: '#FAFAFB', borderTop: '1px solid #F2F4F6', padding: '12px 16px 14px' }}>
                                    <p style={{ fontSize: 14, color: '#191F28', lineHeight: 1.65 }}>{tip.detail}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                    <button onClick={e => { e.stopPropagation(); getAiInsight(b, spent) }} disabled={loadingInsightId === b.id}
                      style={{ width: '100%', marginTop: 12, background: themeData.primary + '10', border: 'none', borderRadius: 12, padding: '10px 0', color: themeData.primary, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                      {loadingInsightId === b.id ? '분석 중...' : aiText ? '🔄 다시 분석' : '✨ AI 조언 보기'}
                    </button>
                  </div>
                  {expandedBudgetEditId === b.id && (
                    <div style={{ display: 'flex', borderTop: '1px solid #F2F4F6' }}>
                      <button onClick={e => { e.stopPropagation(); setEditingBudgetId(b.id); setEditBudgetData({ label: b.label, startDate: b.startDate, endDate: b.endDate, amount: String(b.amount), categories: b.categories || [] }); setExpandedBudgetEditId(null) }}
                        style={{ flex: 1, padding: '14px', border: 'none', background: themeData.card || '#fff', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        수정
                      </button>
                      <div style={{ width: 1, background: '#F2F4F6' }} />
                      <button onClick={e => { e.stopPropagation(); saveBudgets(budgets.filter(x => x.id !== b.id)); setExpandedBudgetEditId(null) }}
                        style={{ flex: 1, padding: '14px', border: 'none', background: themeData.card || '#fff', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 다가오는 결제 */}
        {upcomingPayments.length > 0 && (
          <div style={{ marginBottom: 32, ...stagger(2) }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: themeData.text || '#191F28', marginBottom: 16 }}>다가오는 결제</p>
            <div style={{ background: themeData.card || '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              {upcomingPayments.map((f, i) => {
                const urgency = f.daysLeft <= 3 ? '#FF5A5F' : f.daysLeft <= 7 ? '#F59E0B' : themeData.primary
                const urgencyBg = f.daysLeft <= 3 ? '#FFF1F1' : f.daysLeft <= 7 ? '#FFFBEB' : (themeData.primary + '15')
                return (
                  <div key={f.id || i} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: i < upcomingPayments.length - 1 ? '1px solid #F2F4F6' : 'none' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: urgencyBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={urgency} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</p>
                      <p style={{ fontSize: 13, color: '#8B95A1' }}>매월 {f.dueDay}일</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#FF5A5F', marginBottom: 6 }}>-{fmt(f.amount)}원</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: urgency, borderRadius: 9999, padding: '3px 9px' }}>
                        {f.daysLeft === 0 ? 'D-Day' : `D-${f.daysLeft}`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 카테고리별 지출 */}
        <div style={{ background: themeData.card || '#fff', borderRadius: 20, padding: '20px', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', ...stagger(3) }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: themeData.text || '#191F28', marginBottom: 20 }}>카테고리별 지출</p>
          {categoryData.length === 0 ? (
            <p style={{ fontSize: 15, color: '#8B95A1', textAlign: 'center', padding: '24px 0' }}>아직 지출 내역이 없어요</p>
          ) : (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ position: 'relative', flexShrink: 0, width: 140, height: 140 }}>
                <PieChart width={140} height={140}>
                  <Pie data={categoryData} cx={70} cy={70} innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || '#C9CDD4'} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontSize: 11, color: '#8B95A1', marginBottom: 3 }}>총 지출</p>
                  <p style={{ fontSize: totalExpense >= 10000000 ? 10 : 13, fontWeight: 700, color: '#191F28', whiteSpace: 'nowrap' }}>
                    {totalExpense >= 10000 ? `${Math.round(totalExpense / 10000)}만원` : `${fmt(totalExpense)}원`}
                  </p>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {categoryData.slice(0, 6).map((c, i) => {
                  const pct = totalExpense > 0 ? Math.round(c.value / totalExpense * 100) : 0
                  const color = colorMap[c.name] || '#C9CDD4'
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: `${color}25`, borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 9999, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 최근 내역 */}
        <div style={{ background: themeData.card || '#fff', borderRadius: 20, padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', ...stagger(4) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: themeData.text || '#191F28' }}>최근 내역</p>
            <span onClick={() => navigate('/ledger')} style={{ fontSize: 14, color: themeData.primary, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>전체보기 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
          </div>
          {transactions.length === 0 ? (
            <p style={{ fontSize: 15, color: '#8B95A1', textAlign: 'center', padding: '24px 0' }}>아직 내역이 없어요</p>
          ) : (
            [...transactions].sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0,5).map((t, i, arr) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #F2F4F6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: t.type === 'expense' ? '#FFF1F1' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {t.type === 'expense' ? '💸' : '💰'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: themeData.text || '#191F28', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>{t.date} · {t.category}</p>
                  </div>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: t.type === 'expense' ? '#FF5A5F' : '#2ECC71', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav />

      {/* 예산 추가 bottom sheet */}
      {showAddBudget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowAddBudget(false); setNewBudget({ label: '', startDate: '', endDate: '', amount: '' }) }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 24px calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 9999, background: '#E5E8EB', margin: '0 auto 24px' }} />
            <p style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 24 }}>예산 추가</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>예산 이름 <span style={{ color: '#FF5A5F' }}>*</span></p>
                <input style={inputStyle} placeholder="예: 식비, 전체 생활비" value={newBudget.label} onChange={e => setNewBudget(b => ({ ...b, label: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>금액 <span style={{ color: '#FF5A5F' }}>*</span></p>
                <input style={inputStyle} type="number" placeholder="예: 300000" value={newBudget.amount} onChange={e => setNewBudget(b => ({ ...b, amount: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>기간 <span style={{ color: '#FF5A5F' }}>*</span></p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={newBudget.startDate} onChange={e => setNewBudget(b => ({ ...b, startDate: e.target.value }))} />
                  <span style={{ color: '#8B95A1', fontSize: 15 }}>~</span>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={newBudget.endDate} onChange={e => setNewBudget(b => ({ ...b, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>카테고리 <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 400 }}>(미선택 시 전체 반영)</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allExpenseCategories.map(cat => {
                    const selected = (newBudget.categories || []).includes(cat)
                    return (
                      <button key={cat} onClick={() => setNewBudget(b => ({
                        ...b,
                        categories: selected ? (b.categories || []).filter(c => c !== cat) : [...(b.categories || []), cat]
                      }))} style={{ padding: '7px 14px', borderRadius: 12, border: `1.5px solid ${selected ? themeData.primary : '#E5E8EB'}`,
                        background: selected ? themeData.primary + '15' : '#fff',
                        color: selected ? themeData.primary : '#8B95A1', fontSize: 13, fontWeight: selected ? 700 : 500, cursor: 'pointer' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button onClick={() => { setShowAddBudget(false); setNewBudget({ label: '', startDate: '', endDate: '', amount: '', categories: [] }) }}
                style={{ flex: 1, height: 56, borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', color: '#8B95A1', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleAddBudget}
                style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: themeData.primary, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 예산 수정 bottom sheet */}
      {editingBudgetId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setEditingBudgetId(null)}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 24px calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 9999, background: '#E5E8EB', margin: '0 auto 24px' }} />
            <p style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 24 }}>예산 수정</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>예산 이름</p>
                <input style={inputStyle} placeholder="예: 식비, 전체 생활비" value={editBudgetData.label} onChange={e => setEditBudgetData(d => ({ ...d, label: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>금액</p>
                <input style={inputStyle} type="number" placeholder="예: 300000" value={editBudgetData.amount} onChange={e => setEditBudgetData(d => ({ ...d, amount: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>기간</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={editBudgetData.startDate} onChange={e => setEditBudgetData(d => ({ ...d, startDate: e.target.value }))} />
                  <span style={{ color: '#8B95A1', fontSize: 15 }}>~</span>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={editBudgetData.endDate} onChange={e => setEditBudgetData(d => ({ ...d, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>카테고리 <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 400 }}>(미선택 시 전체 반영)</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allExpenseCategories.map(cat => {
                    const selected = (editBudgetData.categories || []).includes(cat)
                    return (
                      <button key={cat} onClick={() => setEditBudgetData(d => ({
                        ...d,
                        categories: selected ? (d.categories || []).filter(c => c !== cat) : [...(d.categories || []), cat]
                      }))} style={{ padding: '7px 14px', borderRadius: 12, border: `1.5px solid ${selected ? themeData.primary : '#E5E8EB'}`,
                        background: selected ? themeData.primary + '15' : '#fff',
                        color: selected ? themeData.primary : '#8B95A1', fontSize: 13, fontWeight: selected ? 700 : 500, cursor: 'pointer' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button onClick={() => setEditingBudgetId(null)}
                style={{ flex: 1, height: 56, borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', color: '#8B95A1', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSaveBudget}
                style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: themeData.primary, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}