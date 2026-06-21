import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS, getCategoryColors } from '../styles/theme'
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
    <div style={{ background: themeData.card, borderRadius: 14, padding: '12px 14px' }}>
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
  const [newBudget, setNewBudget] = useState({ label: '', startDate: '', endDate: '', amount: '' })
  const [budgetInsights, setBudgetInsights] = useState({})
  const [loadingInsightId, setLoadingInsightId] = useState(null)
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
    setNewBudget({ label: '', startDate: '', endDate: '', amount: '' })
    setShowAddBudget(false)
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
  const expenses = transactions.filter(t => t.type === 'expense' && !t.cardBilling && !t.isCreditCard && (!showLoan || !t.isLoan))
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
  const categoryData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))
  const colorMap = getCategoryColors(categoryData.map(c => c.name))

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
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
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111' }}>예산 관리</p>
            <button onClick={() => setShowAddBudget(true)}
              style={{ background: themeData.primary, border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>+ 추가</button>
          </div>

          {budgets.length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>예산을 추가해보세요</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {budgets.map(b => {
                    const spent = expenses.filter(t => t.date >= b.startDate && t.date <= b.endDate).reduce((s, t) => s + t.amount, 0)
                    const aiText = budgetInsights[b.id]
                    return (
                        <div key={b.id} style={{ position: 'relative' }}>
                            <button onClick={() => saveBudgets(budgets.filter(x => x.id !== b.id))}
                                style={{ position: 'absolute', top: 6, right: 6, zIndex: 1, background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 13, padding: 2 }}>✕</button>
                            <BudgetCard budget={b} spent={spent} themeData={themeData} fmt={fmt} />
                            <button onClick={() => getAiInsight(b, spent)} disabled={loadingInsightId === b.id}
                                style={{ width: '100%', marginTop: 4, background: 'none', border: `1px solid ${themeData.primary}33`, borderRadius: 8, padding: '5px 0', color: themeData.primary, fontSize: 11, cursor: 'pointer' }}>
                                {loadingInsightId === b.id ? '분석 중...' : '✨ AI 조언'}
                            </button>
                            {aiText && (() => {
                                const ai = typeof aiText === 'string' ? { status: 'good', emoji: '💡', message: aiText } : aiText
                                const sc = { great: { color: '#22c55e', bg: '#F0FFF4' }, good: { color: '#3b82f6', bg: '#EFF6FF' }, warning: { color: '#f59e0b', bg: '#FFFBEB' }, danger: { color: '#ef4444', bg: '#FFF5F5' } }[ai.status] || { color: '#888', bg: '#f8f8f8' }
                                return (
                                    <div style={{ background: sc.bg, borderRadius: 8, padding: '8px 10px', marginTop: 4, borderLeft: `2px solid ${sc.color}` }}>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>{ai.emoji} {ai.message}</p>
                                    </div>
                                )
                            })()}
                        </div>
                    )
                })}
            </div>
          )}

          {/* 예산 추가 폼 */}
          {showAddBudget && (
            <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '14px', marginTop: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={inputStyle} placeholder="예산 이름 (예: 식비, 전체 생활비)" value={newBudget.label} onChange={e => setNewBudget(b => ({ ...b, label: e.target.value }))} />
                <input style={inputStyle} type="number" placeholder="금액" value={newBudget.amount} onChange={e => setNewBudget(b => ({ ...b, amount: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={newBudget.startDate} onChange={e => setNewBudget(b => ({ ...b, startDate: e.target.value }))} />
                  <span style={{ display: 'flex', alignItems: 'center', color: '#888' }}>~</span>
                  <input style={{ ...inputStyle, flex: 1 }} type="date" value={newBudget.endDate} onChange={e => setNewBudget(b => ({ ...b, endDate: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowAddBudget(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 13 }}>취소</button>
                <button onClick={handleAddBudget} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: themeData.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>추가</button>
              </div>
            </div>
          )}
        </div>

        {/* 다가오는 결제 */}
        {upcomingPayments.length > 0 && (
            <div style={{ background: themeData.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>💳</span>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>다가오는 결제</p>
                </div>
                {upcomingPayments.map((f, i) => {
                    const urgency = f.daysLeft <= 3 ? '#ef4444' : f.daysLeft <= 7 ? '#f59e0b' : themeData.primary
                    return (
                        <div key={f.id || i} style={{ background: themeData.bg || '#f8f8f8', borderRadius: 12, padding: '10px 14px',
                            marginBottom: i < upcomingPayments.length - 1 ? 8 : 0, borderLeft: `3px solid ${urgency}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3 }}>{f.title}</p>
                                    <p style={{ fontSize: 12, color: urgency }}>
                                        {f.daysLeft === 0 ? '🚨 오늘 결제 예정이에요!' :
                                         f.daysLeft === 1 ? '⚠️ 내일 결제 예정이에요!' :
                                         `📅 ${f.daysLeft}일 뒤에 결제 예정이에요`}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>-{fmt(f.amount)}원</p>
                                    <p style={{ fontSize: 11, color: '#bbb' }}>매월 {f.dueDay}일</p>
                                </div>
                            </div>
                        </div>
                    )
                  })}
            </div>
        )}

        {/* 카테고리별 지출 */}
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111', marginBottom: 16 }}>카테고리별 지출</p>
          {Object.keys(expenseByCategory).length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>아직 지출 내역이 없어요</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                            {categoryData.map((entry, i) => (
                                <Cell key={i} fill={colorMap[entry.name] || '#B0B0B0'} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categoryData.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: colorMap[c.name] || '#B0B0B0', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: themeData.text || '#555', flex: 1 }}>{c.name}</span>
                            <span style={{ fontSize: 12, color: '#888' }}>{Math.round(c.value / totalExpense * 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* 최근 내역 */}
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111' }}>최근 내역</p>
            <span onClick={() => navigate('/ledger')} style={{ fontSize: 13, color: themeData.primary, cursor: 'pointer' }}>전체보기</span>
          </div>
          {transactions.length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>아직 내역이 없어요</p>
          ) : (
            [...transactions].sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0,5).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'expense' ? '#FFF0F0' : '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
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
    </div>
  )
}