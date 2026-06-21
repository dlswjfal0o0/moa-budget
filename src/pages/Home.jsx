import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS, getCategoryColors, DEFAULT_CATEGORIES } from '../styles/theme'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import { useTheme } from '../contexts/ThemeContext'

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

function BudgetCard({ budget, spent, themeData, fmt }) {
  const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0
  const remaining = Math.max(budget.amount - spent, 0)
  const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : themeData.primary

  return (
    <div style={{ background: themeData.card, borderRadius: 16, padding: '12px 14px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{budget.label}</p>
      <p style={{ fontSize: 10, color: '#bbb', marginBottom: 8 }}>
        {budget.startDate?.slice(5).replace('-','/')} ~ {budget.endDate?.slice(5).replace('-','/')}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: 64, height: 36, flexShrink: 0 }}>
          <svg width="64" height="36" viewBox="0 0 64 36">
            <path d="M 5 32 A 27 27 0 0 1 59 32" fill="none" stroke="#f0f0f0" strokeWidth="7" strokeLinecap="round"/>
            <path d="M 5 32 A 27 27 0 0 1 59 32" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={Math.PI * 27} strokeDashoffset={Math.PI * 27 * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
          </svg>
          <p style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
            {Math.round(pct)}%
          </p>
        </div>
        <div>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>잔여</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{fmt(remaining)}원</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { themeData } = useTheme()
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
  const [expandedBudgetEditId, setExpandedBudgetEditId] = useState(null)
  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [editBudgetData, setEditBudgetData] = useState({ label: '', startDate: '', endDate: '', amount: '', categories: [] })
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [fixedExpenses, setFixedExpenses] = useState([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists() && snap.data().budgets) setBudgets(snap.data().budgets)
        if (snap.data().fixedExpenses) setFixedExpenses(snap.data().fixedExpenses)
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
    setLoadingInsightId(budget.id)
    try {
        const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                messages: [{ role: 'user', content:
                    `예산 "${budget.label}": ${fmt(budget.amount)}원 중 ${fmt(spent)}원 사용 (${pct}%). 잔여 ${fmt(remaining)}원, 남은 기간 ${daysLeft}일. 친근하게 현황 분석과 절감 팁을 2~3문장으로 알려줘.`
                }]
            })
        })
        const data = await res.json()
        setBudgetInsights(prev => ({ ...prev, [budget.id]: data.content[0].text }))
    } catch {
        setBudgetInsights(prev => ({ ...prev, [budget.id]: '분석에 실패했어요.' }))
    }
    setLoadingInsightId(null)
  }

  const getLocalInsight = (budget, spent) => {
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
  const cards = JSON.parse(localStorage.getItem('moa_cards') || '[]')
  const isCredit = (p) => cards.some(c => c.name === p && c.cardType === 'credit')
  const expenses = transactions.filter(t => t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && (!showLoan || !t.isLoan))
  const incomes = transactions.filter(t => t.type === 'income' && (!showLoan || !t.isLoan))
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
  const allExpenseCategories = [...new Set([...DEFAULT_CATEGORIES.expense, ...expenses.map(t => t.category).filter(Boolean)])]

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 16,
    border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none',
    background: '#fafafa', color: '#111', boxSizing: 'border-box'
  }

  return (
    <div style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 80 }}>
      {/* 헤더 */}
      <div style={{ background: themeData.primary, padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 24px', color: '#fff' }}>
        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>{now.getMonth()+1}월 가계부</p>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>안녕하세요 👋</p>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '20px' }}>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>이번 달 잔액</p>
          <p style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>{fmt(totalIncome - totalExpense)}원</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <div><p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>수입</p><p style={{ fontSize: 16, fontWeight: 600 }}>+{fmt(totalIncome)}원</p></div>
            <div><p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>지출</p><p style={{ fontSize: 16, fontWeight: 600 }}>-{fmt(totalExpense)}원</p></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* 예산 관리 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 16px' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111' }}>예산 관리</p>
            <button onClick={() => setShowAddBudget(true)}
              style={{ background: themeData.primary, border: 'none', borderRadius: 9999, padding: '5px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ 추가</button>
          </div>

          {budgets.length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>예산을 추가해보세요</p>
          ) : (
            budgets.map(b => {
              const bCats = Array.isArray(b.categories) ? b.categories : []
              const spent = expenses.filter(t => t.date >= b.startDate && t.date <= b.endDate && (bCats.length === 0 || bCats.includes(t.category))).reduce((s, t) => s + t.amount, 0)
              const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0
              const exceeded = spent > b.amount
              const color = exceeded ? '#ef4444' : pct >= 80 ? '#f59e0b' : themeData.primary
              const aiText = budgetInsights[b.id]
              const arcLen = Math.PI * 34
              return (
                <div key={b.id} style={{ marginBottom: 10, background: themeData.card || '#fff', borderRadius: 16, overflow: 'hidden' }}>
                  {/* 클릭 시 수정/삭제 토글 */}
                  <div style={{ padding: '14px 14px 10px', cursor: 'pointer' }}
                    onClick={() => setExpandedBudgetEditId(expandedBudgetEditId === b.id ? null : b.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: themeData.text || '#111' }}>{b.label}</span>
                        {exceeded && <span style={{ fontSize: 10, background: '#fee2e2', color: '#ef4444', borderRadius: 9999, padding: '2px 7px', fontWeight: 600 }}>초과</span>}
                      </div>
                      <span style={{ fontSize: 11, color: '#bbb' }}>{b.startDate?.slice(5).replace('-','/')} ~ {b.endDate?.slice(5).replace('-','/')}</span>
                    </div>
                    {/* 반원 그래프 + 금액 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <svg width="84" height="46" viewBox="0 0 84 46">
                          <path d="M 8 42 A 34 34 0 0 1 76 42" fill="none" stroke="#f0f0f0" strokeWidth="8" strokeLinecap="round"/>
                          <path d="M 8 42 A 34 34 0 0 1 76 42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={arcLen} strokeDashoffset={arcLen * (1 - pct / 100)}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
                        </svg>
                        <p style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                          {Math.round(pct)}%
                        </p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>이번 달 사용</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: themeData.text || '#111', marginBottom: 2 }}>{fmt(spent)}원</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: exceeded ? '#ef4444' : '#22c55e' }}>
                          {exceeded ? `${fmt(spent - b.amount)}원 초과` : `잔여 ${fmt(b.amount - spent)}원`}
                        </p>
                      </div>
                    </div>
                    {/* AI 조언 — 분석 탭과 동일 스타일 */}
                    {aiText && (() => {
                      const ai = typeof aiText === 'string' ? { status: 'good', emoji: '💡', message: aiText } : aiText
                      const sc = { great: { color: '#22c55e', bg: '#F0FFF4' }, good: { color: '#3b82f6', bg: '#EFF6FF' }, warning: { color: '#f59e0b', bg: '#FFFBEB' }, danger: { color: '#ef4444', bg: '#FFF5F5' } }[ai.status] || { color: themeData.primary, bg: themeData.primary + '12' }
                      return (
                        <div style={{ background: sc.bg, borderRadius: 16, padding: '14px 16px', marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: sc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 22 }}>{ai.emoji}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: sc.color, marginBottom: 4 }}>AI 예산 조언</p>
                            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{ai.message}</p>
                          </div>
                        </div>
                      )
                    })()}
                    <button onClick={e => { e.stopPropagation(); getAiInsight(b, spent) }} disabled={loadingInsightId === b.id}
                      style={{ width: '100%', marginTop: 10, background: 'none', border: `1px solid ${themeData.primary}33`, borderRadius: 16, padding: '7px 0', color: themeData.primary, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                      {loadingInsightId === b.id ? '분석 중...' : '✨ AI 조언 보기'}
                    </button>
                  </div>
                  {expandedBudgetEditId === b.id && (
                    <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0' }}>
                      <button onClick={e => { e.stopPropagation(); setEditingBudgetId(b.id); setEditBudgetData({ label: b.label, startDate: b.startDate, endDate: b.endDate, amount: String(b.amount), categories: b.categories || [] }); setExpandedBudgetEditId(null) }}
                        style={{ flex: 1, padding: '11px', border: 'none', background: themeData.card || '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        수정
                      </button>
                      <div style={{ width: 1, background: '#f0f0f0' }} />
                      <button onClick={e => { e.stopPropagation(); saveBudgets(budgets.filter(x => x.id !== b.id)); setExpandedBudgetEditId(null) }}
                        style={{ flex: 1, padding: '11px', border: 'none', background: themeData.card || '#fff', color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
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
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111', marginBottom: 16, paddingLeft: 16 }}>다가오는 결제</p>
            {upcomingPayments.map((f, i) => {
              const urgency = f.daysLeft <= 3 ? '#ef4444' : f.daysLeft <= 7 ? '#f59e0b' : themeData.primary
              const urgencyBg = f.daysLeft <= 3 ? '#fee2e2' : f.daysLeft <= 7 ? '#fef3c7' : (themeData.primary + '18')
              return (
                <div key={f.id || i} style={{ marginBottom: 10, background: themeData.card || '#fff', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: urgencyBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={urgency} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: themeData.text || '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</p>
                    <p style={{ fontSize: 12, color: '#bbb' }}>매월 {f.dueDay}일</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>-{fmt(f.amount)}원</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: urgency, borderRadius: 9999, padding: '2px 8px' }}>
                      {f.daysLeft === 0 ? 'D-Day' : `D-${f.daysLeft}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 카테고리별 지출 */}
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111', marginBottom: 16 }}>카테고리별 지출</p>
          {categoryData.length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>아직 지출 내역이 없어요</p>
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ position: 'relative', flexShrink: 0, width: 130, height: 130 }}>
                <PieChart width={130} height={130}>
                  <Pie data={categoryData} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || '#B0B0B0'} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontSize: 9, color: '#aaa', marginBottom: 1 }}>총 지출</p>
                  <p style={{ fontSize: totalExpense >= 10000000 ? 9 : 11, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
                    {totalExpense >= 10000 ? `${Math.round(totalExpense / 10000)}만원` : `${fmt(totalExpense)}원`}
                  </p>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {categoryData.slice(0, 7).map((c, i) => {
                  const pct = totalExpense > 0 ? Math.round(c.value / totalExpense * 100) : 0
                  const color = colorMap[c.name] || '#B0B0B0'
                  return (
                    <div key={i} style={{ marginBottom: 7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#888', fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: `${color}22`, borderRadius: 9999, overflow: 'hidden' }}>
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
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111' }}>최근 내역</p>
            <span onClick={() => navigate('/ledger')} style={{ fontSize: 13, color: themeData.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>전체보기 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
          </div>
          {transactions.length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>아직 내역이 없어요</p>
          ) : (
            [...transactions].sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0,5).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: t.type === 'expense' ? '#FFF0F0' : '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {t.type === 'expense' ? '💸' : '💰'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: themeData.text || '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 12, color: '#bbb' }}>{t.date} · {t.category}</p>
                  </div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: t.type === 'expense' ? '#ef4444' : '#22c55e', flexShrink: 0, whiteSpace: 'nowrap' }}>
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
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e0e0e0', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 }}>예산 추가</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>예산 이름 <span style={{ color: '#ef4444' }}>*</span></p>
                <input style={inputStyle} placeholder="예: 식비, 전체 생활비" value={newBudget.label} onChange={e => setNewBudget(b => ({ ...b, label: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>금액 <span style={{ color: '#ef4444' }}>*</span></p>
                <input style={inputStyle} type="number" placeholder="예: 300000" value={newBudget.amount} onChange={e => setNewBudget(b => ({ ...b, amount: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>기간 <span style={{ color: '#ef4444' }}>*</span></p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={newBudget.startDate} onChange={e => setNewBudget(b => ({ ...b, startDate: e.target.value }))} />
                  <span style={{ color: '#bbb', fontSize: 14 }}>~</span>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={newBudget.endDate} onChange={e => setNewBudget(b => ({ ...b, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>카테고리 <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400 }}>(미선택 시 전체 반영)</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allExpenseCategories.map(cat => {
                    const selected = (newBudget.categories || []).includes(cat)
                    return (
                      <button key={cat} onClick={() => setNewBudget(b => ({
                        ...b,
                        categories: selected ? (b.categories || []).filter(c => c !== cat) : [...(b.categories || []), cat]
                      }))} style={{ padding: '6px 14px', borderRadius: 9999, border: `1.5px solid ${selected ? themeData.primary : '#e8e8e8'}`,
                        background: selected ? themeData.primary + '18' : '#fff',
                        color: selected ? themeData.primary : '#888', fontSize: 12, fontWeight: selected ? 700 : 400, cursor: 'pointer' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => { setShowAddBudget(false); setNewBudget({ label: '', startDate: '', endDate: '', amount: '', categories: [] }) }}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', color: '#555', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleAddBudget}
                style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: themeData.primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 예산 수정 bottom sheet */}
      {editingBudgetId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setEditingBudgetId(null)}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e0e0e0', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 }}>예산 수정</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>예산 이름</p>
                <input style={inputStyle} placeholder="예: 식비, 전체 생활비" value={editBudgetData.label} onChange={e => setEditBudgetData(d => ({ ...d, label: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>금액</p>
                <input style={inputStyle} type="number" placeholder="예: 300000" value={editBudgetData.amount} onChange={e => setEditBudgetData(d => ({ ...d, amount: e.target.value }))} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>기간</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={editBudgetData.startDate} onChange={e => setEditBudgetData(d => ({ ...d, startDate: e.target.value }))} />
                  <span style={{ color: '#bbb', fontSize: 14 }}>~</span>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={editBudgetData.endDate} onChange={e => setEditBudgetData(d => ({ ...d, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>카테고리 <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400 }}>(미선택 시 전체 반영)</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allExpenseCategories.map(cat => {
                    const selected = (editBudgetData.categories || []).includes(cat)
                    return (
                      <button key={cat} onClick={() => setEditBudgetData(d => ({
                        ...d,
                        categories: selected ? (d.categories || []).filter(c => c !== cat) : [...(d.categories || []), cat]
                      }))} style={{ padding: '6px 14px', borderRadius: 9999, border: `1.5px solid ${selected ? themeData.primary : '#e8e8e8'}`,
                        background: selected ? themeData.primary + '18' : '#fff',
                        color: selected ? themeData.primary : '#888', fontSize: 12, fontWeight: selected ? 700 : 400, cursor: 'pointer' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setEditingBudgetId(null)}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', color: '#555', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSaveBudget}
                style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: themeData.primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}