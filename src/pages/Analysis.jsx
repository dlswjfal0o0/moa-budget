import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import BottomNav from '../components/BottomNav'

import { CATEGORY_COLORS } from '../styles/theme'
import { inputStyle, pageWrapper, cardStyle } from '../styles/styles'

function UtilityChart({ type, utilities, primary }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getMonth() + 1}월` }
  })
  const data = months.map(m => ({
    label: m.label,
    amount: utilities.find(u => u.type === type && u.year === m.year && u.month === m.month)?.amount || 0
  }))
  const max = Math.max(...data.map(d => d.amount), 1)
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48, marginTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: '100%', height: Math.max((d.amount / max) * 36, d.amount > 0 ? 2 : 0), background: i === 5 ? primary : `${primary}55`, borderRadius: '2px 2px 0 0', transition: 'height 0.5s' }} />
          <span style={{ fontSize: 9, color: i === 5 ? '#555' : '#bbb' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analysis() {
  const { themeData, themeName } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [lastMonthTx, setLastMonthTx] = useState([])
  const [aiFeedbackData, setAiFeedbackData] = useState(null)
  const [aiFeedbackRaw, setAiFeedbackRaw] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [budgets, setBudgets] = useState([])
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [newBudget, setNewBudget] = useState({ label: '', startDate: '', endDate: '', amount: '' })
  const [budgetInsights, setBudgetInsights] = useState({})
  const [loadingInsightId, setLoadingInsightId] = useState(null)
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('소비')
  const [showUtilities, setShowUtilities] = useState(() =>
    localStorage.getItem('moa_showUtilities') === 'true'
  )
  const [utilities, setUtilities] = useState([])
  const [showAddUtility, setShowAddUtility] = useState(false)
  const [editingUtility, setEditingUtility] = useState(null)
  const [newUtility, setNewUtility] = useState({ type: '전기세', amount: '', day: '' })
  const [utilityAI, setUtilityAI] = useState(null)
  const [loadingUtilityAI, setLoadingUtilityAI] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
          const data = snap.data()
          if (data.budgets) setBudgets(data.budgets)
          if (data.showUtilities !== undefined) setShowUtilities(data.showUtilities)
          if (data.utilities) setUtilities(data.utilities)
        }
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user, viewYear, viewMonth])

  const fetchData = async () => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const q1 = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', monthStr))
    const snap1 = await getDocs(q1)
    setTransactions(snap1.docs.map(d => ({ id: d.id, ...d.data() })))

    const lm = viewMonth === 0 ? 11 : viewMonth - 1
    const ly = viewMonth === 0 ? viewYear - 1 : viewYear
    const lastStr = `${ly}-${String(lm + 1).padStart(2, '0')}`
    const q2 = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', lastStr))
    const snap2 = await getDocs(q2)
    setLastMonthTx(snap2.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const saveBudgets = async (updated) => {
    setBudgets(updated)
    if (user) await setDoc(doc(db, 'users', user.uid), { budgets: updated }, { merge: true })
  }

  const getLocalInsight = (b, spent) => {
    const remaining = b.amount - spent
    const daysLeft = Math.max(1, Math.ceil((new Date(b.endDate) - new Date()) / 86400000))
    const pct = (spent / b.amount) * 100
    const daily = Math.floor(remaining / daysLeft)
    if (spent > b.amount) return { color: '#ef4444', msg: `예산 ${fmt(spent - b.amount)}원 초과!` }
    if (pct > 80) return { color: '#ef4444', msg: `${Math.round(pct)}% 사용. 하루 ${fmt(daily)}원만 가능해요.` }
    if (pct > 50) return { color: '#f59e0b', msg: `남은 ${daysLeft}일, 하루 ${fmt(daily)}원 가능해요.` }
    return { color: '#22c55e', msg: `여유 있어요! 하루 ${fmt(daily)}원씩 가능해요.` }
  }

  const getAiInsight = async (b, spent) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(b.endDate) - new Date()) / 86400000))
    setLoadingInsightId(b.id)
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514', max_tokens: 200,
                messages: [{ role: 'user', content: `예산 "${b.label}": ${fmt(b.amount)}원 중 ${fmt(spent)}원 사용. 남은 기간 ${daysLeft}일. 친근하게 1문장으로 조언해줘.` }]
            })
        })
        const data = await res.json()
        setBudgetInsights(prev => ({ ...prev, [b.id]: data.content[0].text }))
    } catch { setBudgetInsights(prev => ({ ...prev, [b.id]: '분석에 실패했어요.' })) }
    setLoadingInsightId(null)
  }

  const fmt = n => n.toLocaleString('ko-KR')
  const expenses = transactions.filter(t => t.type === 'expense')
  const incomes = transactions.filter(t => t.type === 'income')
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)

  const lastExpenses = lastMonthTx.filter(t => t.type === 'expense')
  const lastIncomes = lastMonthTx.filter(t => t.type === 'income')
  const lastTotalExpense = lastExpenses.reduce((s, t) => s + t.amount, 0)
  const lastTotalIncome = lastIncomes.reduce((s, t) => s + t.amount, 0)

  const expenseChange = lastTotalExpense > 0 ? ((totalExpense - lastTotalExpense) / lastTotalExpense * 100).toFixed(1) : null
  const incomeChange = lastTotalIncome > 0 ? ((totalIncome - lastTotalIncome) / lastTotalIncome * 100).toFixed(1) : null

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${d}`
    return { day: i + 1, amount: expenses.filter(t => t.date === dateStr).reduce((s, t) => s + t.amount, 0) }
  })

  const byCategory = expenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  const byPayment = expenses.reduce((acc, t) => { const k = t.payment || '기타'; acc[k] = (acc[k] || 0) + t.amount; return acc }, {})

  const getAiFeedback = async () => {
    if (expenses.length === 0) return alert('지출 내역이 없어요.')
    setLoadingAi(true)
    setAiFeedbackData(null)
    setAiFeedbackRaw('')

    const byCat = Object.entries(byCategory).map(([c, a]) => `${c}: ${fmt(a)}원`).join(', ')
    const lastByCat = Object.entries(
        lastExpenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
    ).map(([c, a]) => `${c}: ${fmt(a)}원`).join(', ') || '없음'

    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 800,
                system: '당신은 한국어로 응답하는 개인 재무 분석 AI입니다. 반드시 유효한 JSON만 출력하세요. 마크다운, 코드블록, 설명 없이 순수 JSON만 출력하세요.',
                messages: [{
                    role: 'user',
                    content: `소비 데이터를 분석하고 JSON으로만 응답해주세요:

  이번 달: ${byCat} / 총 ${fmt(totalExpense)}원 지출, ${fmt(totalIncome)}원 수입
  지난 달: ${lastByCat} / 총 ${fmt(lastTotalExpense)}원 지출

  응답 형식:
  {"rating":"good","score":75,"summary":"전체 소비 패턴 2줄 요약","cuts":[{"category":"카테고리명","tip":"구체적 절감 팁","save":절감가능금액숫자}],"unusual":["이상지출 설명 없으면 빈배열"],"saving_goal":목표절감금액숫자,"message":"이모지 포함 응원 메시지"}`
                }]
            })
        })
        const data = await res.json()
        const text = data.content[0].text.replace(/```json\n?|```/g, '').trim()
        try {
            setAiFeedbackData(JSON.parse(text))
        } catch {
            setAiFeedbackRaw(text)
        }
    } catch {
        setAiFeedbackRaw('AI 분석을 불러오는 데 실패했어요.')
    }
    setLoadingAi(false)
  }

  const saveUtilities = async (updated) => {
    setUtilities(updated)
    if (user) await setDoc(doc(db, 'users', user.uid), { utilities: updated }, { merge: true })
  }

  const getUtilityAI = async () => {
    const types = ['관리비', '수도세', '전기세', '가스비']
    const summary = types.map(type => {
        const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
        if (!cur) return null
        const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
        const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
        const prevYear = utilities.find(u => u.type === type && u.year === viewYear - 1 && u.month === viewMonth + 1)
        return `${type}: 이번달 ${fmt(cur.amount)}원 / 전월 ${prev ? fmt(prev.amount) + '원' : '없음'} / 전년도 ${prevYear ? fmt(prevYear.amount) + '원' : '없음'}`
    }).filter(Boolean).join('\n')

    if (!summary) return alert('이번 달 공과금 데이터를 먼저 입력해주세요.')
    setLoadingUtilityAI(true)
    setUtilityAI(null)
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514', max_tokens: 600,
                system: '한국어로 응답하는 공과금 분석 AI. 순수 JSON만 출력. 마크다운 금지.',
                messages: [{ role: 'user', content: `공과금 현황:\n${summary}\n\n각 항목을 전월/전년도와 비교해서 친근하게 분석해줘.\n{"items":[{"type":"전기세","emoji":"⚡","comment":"코멘트"}],"overall":"전체 총평 한 줄"}` }]
            })
        })
        const data = await res.json()
        const text = data.content[0].text.replace(/```json\n?|```/g, '').trim()
        try { setUtilityAI(JSON.parse(text)) } catch { setUtilityAI({ overall: text }) }
    } catch { setUtilityAI({ overall: '분석에 실패했어요.' }) }
    setLoadingUtilityAI(false)
  }

  return (
    <div
      style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 80 }}
      className={themeName === 'pastel' ? 'theme-pastel-bg' : ''}
    >
      <div style={{ background: themeData.card, padding: '48px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>‹</button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{viewYear}년 {viewMonth + 1}월 분석</p>
          <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>›</button>
        </div>
      </div>

      {showUtilities && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
            {['소비', '공과금'].map(tab => (
                <button key={tab} onClick={() => setActiveAnalysisTab(tab)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                        background: activeAnalysisTab === tab ? (themeData?.primary || '#4F46E5') : '#f0f0f0',
                        color: activeAnalysisTab === tab ? 'white' : '#888' }}>
                    {tab}
                </button>
            ))}
        </div>
      )}

      {(!showUtilities || activeAnalysisTab === '소비') && (
      <div style={{ padding: '16px' }}>
        {/* 지난 달 대비 */}
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 14 }}>지난 달 대비</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: '#FFF5F5', borderRadius: 12, padding: '12px' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>지출</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{fmt(totalExpense)}원</p>
              {expenseChange !== null && (
                <p style={{ fontSize: 11, marginTop: 4, color: Number(expenseChange) > 0 ? '#ef4444' : '#22c55e', fontWeight: 500 }}>
                  {Number(expenseChange) > 0 ? '▲' : '▼'} {Math.abs(Number(expenseChange))}% {Number(expenseChange) > 0 ? '증가' : '감소'}
                </p>
              )}
              <p style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>지난달 {fmt(lastTotalExpense)}원</p>
            </div>
            <div style={{ flex: 1, background: '#F0FFF4', borderRadius: 12, padding: '12px' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>수입</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{fmt(totalIncome)}원</p>
              {incomeChange !== null && (
                <p style={{ fontSize: 11, marginTop: 4, color: Number(incomeChange) > 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                  {Number(incomeChange) > 0 ? '▲' : '▼'} {Math.abs(Number(incomeChange))}% {Number(incomeChange) > 0 ? '증가' : '감소'}
                </p>
              )}
              <p style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>지난달 {fmt(lastTotalIncome)}원</p>
            </div>
          </div>
        </div>

        {/* 예산 관리 */}
        <div style={{ background: themeData?.card || '#fff', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>예산 관리</p>
                <button onClick={() => setShowAddBudget(true)}
                    style={{ background: themeData.primary, border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                    + 추가
                </button>
            </div>

            {budgets.length === 0 ? (
                <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>예산을 추가해보세요</p>
            ) : (
                budgets.map(b => {
                    const spent = expenses.filter(t => t.date >= b.startDate && t.date <= b.endDate).reduce((s, t) => s + t.amount, 0)
                    const pct = Math.min((spent / b.amount) * 100, 100)
                    const insight = getLocalInsight(b, spent)
                    const aiText = budgetInsights[b.id]

                    return (
                        <div key={b.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f5f5f5' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{b.label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 11, color: '#bbb' }}>{b.startDate.slice(5)} ~ {b.endDate.slice(5)}</span>
                                    <button onClick={() => saveBudgets(budgets.filter(x => x.id !== b.id))}
                                        style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: '#ef4444' }}>-{fmt(spent)}원</span>
                                <span style={{ fontSize: 13, color: '#888' }}>{fmt(b.amount)}원</span>
                            </div>
                            <div style={{ background: '#f0f0f0', borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: 8 }}>
                                <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`,
                                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                                    background: pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : themeData.primary }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: insight.color, fontWeight: 500 }}>{insight.msg}</span>
                                    <span style={{ fontSize: 12, color: '#bbb' }}>{Math.round(pct)}%</span>
                                </div>
                                {aiText && (
                                    <div style={{ background: themeData.primaryLight || '#EEF2FF', borderRadius: 10, padding: '10px 12px', marginTop: 6, borderLeft: `3px solid ${themeData.primary}` }}>
                                        <p style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>{aiText}</p>
                                    </div>
                                )}
                                <button onClick={() => getAiInsight(b, spent)} disabled={loadingInsightId === b.id}
                                    style={{ marginTop: 8, background: 'none', border: `1px solid ${themeData.primary}`, borderRadius: 20, padding: '4px 12px', color: themeData.primary, fontSize: 11, cursor: 'pointer' }}>
                                    {loadingInsightId === b.id ? '분석 중...' : '✨ AI 조언'}
                                </button>
                            </div>
                        )
                    })
                )}

                {showAddBudget && (
                    <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '14px', marginTop: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                                placeholder="예산 이름 (예: 식비, 전체 생활비)" value={newBudget.label}
                                onChange={e => setNewBudget(b => ({ ...b, label: e.target.value }))} />
                            <input style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                                type="number" placeholder="금액" value={newBudget.amount}
                                onChange={e => setNewBudget(b => ({ ...b, amount: e.target.value }))} />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                                    type="date" value={newBudget.startDate}
                                    onChange={e => setNewBudget(b => ({ ...b, startDate: e.target.value }))} />
                                <span style={{ display: 'flex', alignItems: 'center', color: '#888' }}>~</span>
                                <input style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                                    type="date" value={newBudget.endDate}
                                    onChange={e => setNewBudget(b => ({ ...b, endDate: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button onClick={() => setShowAddBudget(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontSize: 13 }}>취소</button>
                            <button onClick={() => {
                                if (!newBudget.label || !newBudget.startDate || !newBudget.endDate || !newBudget.amount) return alert('모든 항목을 입력해주세요.')
                                saveBudgets([...budgets, { id: Date.now(), ...newBudget, amount: Number(newBudget.amount) }])
                                setNewBudget({ label: '', startDate: '', endDate: '', amount: '' })
                                setShowAddBudget(false)
                            }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: themeData.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>추가</button>
                        </div>
                    </div>
            )}
        </div>

        {/* 일별 지출 */}
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>일별 지출</p>
          {dailyData.every(d => d.amount === 0) ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#bbb' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#bbb' }} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `${Math.round(v/1000)}k` : ''} />
                <Tooltip formatter={v => [`${fmt(v)}원`, '지출']} labelFormatter={l => `${l}일`} />
                <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 카테고리별 파이차트 */}
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>카테고리별 지출</p>
          {categoryData.length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#B0B0B0'} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${fmt(v)}원`]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {categoryData.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[c.name] || '#B0B0B0' }} />
                    <span style={{ fontSize: 12, color: '#666' }}>{c.name} {Math.round(c.value / totalExpense * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI 소비 분석 */}
        <div style={{ background: themeData?.card || '#fff', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>AI 소비 분석</p>
                <button onClick={getAiFeedback} disabled={loadingAi}
                    style={{ padding: '7px 16px', borderRadius: 20, border: 'none',
                        cursor: loadingAi ? 'not-allowed' : 'pointer',
                        background: loadingAi ? '#e0e0e0' : (themeData?.primary || '#4F46E5'),
                        color: loadingAi ? '#888' : '#fff', fontSize: 13, fontWeight: 500 }}>
                    {loadingAi ? '분석 중...' : '✨ AI 분석'}
                </button>
            </div>

            {loadingAi && (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🤔</div>
                    <p style={{ fontSize: 14, color: '#888' }}>AI가 소비 패턴을 분석하고 있어요...</p>
                    <p style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>잠시만 기다려주세요</p>
                </div>
            )}

            {!loadingAi && !aiFeedbackData && !aiFeedbackRaw && (
                <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>
                    AI 분석 버튼을 눌러 소비 패턴을 확인해보세요
                </p>
            )}

            {aiFeedbackData && (() => {
                const rc = {
                    good:    { color: '#22c55e', bg: '#F0FFF4', label: '소비 우등생이에요 🌟' },
                    warning: { color: '#f59e0b', bg: '#FFFBEB', label: '지출 관리가 필요해요 ⚠️' },
                    danger:  { color: '#ef4444', bg: '#FFF5F5', label: '지출이 너무 많아요 🚨' },
                }[aiFeedbackData.rating] || { color: '#22c55e', bg: '#F0FFF4', label: '분석 완료' }

                return (
                    <>
                        {/* 점수 카드 */}
                        <div style={{ background: rc.bg, borderRadius: 14, padding: '16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: rc.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{aiFeedbackData.score}</span>
                                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>점</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: rc.color, marginBottom: 5 }}>{rc.label}</p>
                                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{aiFeedbackData.summary}</p>
                            </div>
                        </div>

                        {/* 절감 포인트 */}
                        {aiFeedbackData.cuts?.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>💡 절감 포인트</p>
                                {aiFeedbackData.cuts.map((cut, i) => (
                                    <div key={i} style={{ background: '#f8f8f8', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: themeData?.primary || '#4F46E5',
                                                background: themeData?.primaryLight || '#EEF2FF',
                                                padding: '2px 10px', borderRadius: 20 }}>{cut.category}</span>
                                            {cut.save > 0 && (
                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>최대 {fmt(cut.save)}원 절약</span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{cut.tip}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 이상 지출 감지 */}
                        {aiFeedbackData.unusual?.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>🚨 이상 지출 감지</p>
                                {aiFeedbackData.unusual.map((u, i) => (
                                    <div key={i} style={{ background: '#FFF5F5', borderRadius: 10, padding: '10px 12px', marginBottom: 6, borderLeft: '3px solid #ef4444', display: 'flex', gap: 8 }}>
                                        <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
                                        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{u}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 절감 목표 */}
                        {aiFeedbackData.saving_goal > 0 && (
                            <div style={{ background: '#F0FFF4', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: '#333' }}>🎯 이번 달 절감 목표</span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{fmt(aiFeedbackData.saving_goal)}원</span>
                            </div>
                        )}

                        {/* 응원 메시지 */}
                        {aiFeedbackData.message && (
                            <div style={{ textAlign: 'center', padding: '14px', background: themeData?.primaryLight || '#EEF2FF', borderRadius: 12 }}>
                                <p style={{ fontSize: 14, color: themeData?.primary || '#4F46E5', fontWeight: 500 }}>{aiFeedbackData.message}</p>
                            </div>
                        )}
                    </>
                )
            })()}

            {aiFeedbackRaw && (
                <div style={{ background: themeData?.primaryLight || '#F8F7FF', borderRadius: 12, padding: '14px', borderLeft: `3px solid ${themeData?.primary || '#4F46E5'}` }}>
                    <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7 }}>{aiFeedbackRaw}</p>
                </div>
            )}
        </div>

        {/* 결제수단별 */}
        <div style={{ background: themeData.card, borderRadius: 16, padding: '16px' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 12 }}>결제수단별 지출</p>
          {Object.keys(byPayment).length === 0 ? (
            <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>내역이 없어요</p>
          ) : (
            Object.entries(byPayment).map(([method, amt]) => (
              <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
                <p style={{ fontSize: 14, color: '#333' }}>{method}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{fmt(amt)}원</p>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {showUtilities && activeAnalysisTab === '공과금' && (
        <div style={{ padding: '16px 16px 100px' }}>
            {['관리비', '수도세', '전기세', '가스비'].map(type => {
                const emoji = { 관리비: '🏢', 수도세: '💧', 전기세: '⚡', 가스비: '🔥' }[type]
                const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
                const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
                const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
                const diff = cur && prev ? cur.amount - prev.amount : null
                return (
                    <div key={type} style={{ background: themeData?.card || '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>{emoji}</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{type}</span>
                            </div>
                            <button onClick={() => {
                                setNewUtility({ type, amount: cur?.amount || '', day: cur?.day || '' })
                                setEditingUtility(cur?.id || null)
                                setShowAddUtility(true)
                            }} style={{ background: themeData?.primary || '#4F46E5', border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                                {cur ? '수정' : '+ 추가'}
                            </button>
                        </div>
                        {cur ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                                    <div>
                                        <p style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{fmt(cur.amount)}원</p>
                                        {cur.day && <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>납부일: 매월 {cur.day}일</p>}
                                    </div>
                                {diff !== null && (
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: diff > 0 ? '#ef4444' : '#22c55e' }}>
                                            {diff > 0 ? `▲ +${fmt(diff)}원` : `▼ ${fmt(Math.abs(diff))}원`}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#bbb' }}>전월 {fmt(prev.amount)}원</p>
                                    </div>
                                )}
                            </div>
                            <UtilityChart type={type} utilities={utilities} primary={themeData?.primary || '#4F46E5'} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                <button onClick={() => saveUtilities(utilities.filter(u => u.id !== cur.id))}
                                    style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 12, cursor: 'pointer' }}>삭제</button>
                            </div>
                        </>
                    ) : (
                        <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>이번 달 데이터가 없어요</p>
                    )}
                </div>
            )
        })}

        {/* AI 공과금 분석 */}
        <div style={{ background: themeData?.card || '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>AI 공과금 분석</p>
                <button onClick={getUtilityAI} disabled={loadingUtilityAI}
                    style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: loadingUtilityAI ? 'not-allowed' : 'pointer',
                        background: loadingUtilityAI ? '#e0e0e0' : (themeData?.primary || '#4F46E5'),
                        color: loadingUtilityAI ? '#888' : '#fff', fontSize: 13 }}>
                    {loadingUtilityAI ? '분석 중...' : '✨ AI 분석'}
                </button>
            </div>
            {!utilityAI && !loadingUtilityAI && <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>AI가 전월·전년도와 비교 분석해드려요</p>}
            {loadingUtilityAI && <p style={{ fontSize: 14, color: '#888', textAlign: 'center', padding: '20px 0' }}>공과금 패턴을 분석하고 있어요...</p>}
            {utilityAI && (
                <>
                    {utilityAI.items?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ fontSize: 18 }}>{item.emoji}</span>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2 }}>{item.type}</p>
                                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{item.comment}</p>
                            </div>
                        </div>
                    ))}
                    {utilityAI.overall && (
                        <div style={{ marginTop: 10, background: themeData?.primaryLight || '#EEF2FF', borderRadius: 10, padding: '10px 12px' }}>
                            <p style={{ fontSize: 13, color: themeData?.primary || '#4F46E5', fontWeight: 500 }}>{utilityAI.overall}</p>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* 추가/수정 모달 */}
        {showAddUtility && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 999 }}
                onClick={() => setShowAddUtility(false)}>
                <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }} onClick={e => e.stopPropagation()}>
                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{newUtility.type} 입력</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                        <input type="number" placeholder="금액 (원)" value={newUtility.amount}
                            onChange={e => setNewUtility(p => ({ ...p, amount: e.target.value }))}
                            style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 15, outline: 'none' }} />
                        <input type="number" placeholder="납부일 (예: 15)" min="1" max="31" value={newUtility.day}
                            onChange={e => setNewUtility(p => ({ ...p, day: e.target.value }))}
                            style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 15, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowAddUtility(false)}
                            style={{ flex: 1, padding: 14, borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', fontSize: 15, cursor: 'pointer' }}>취소</button>
                        <button onClick={() => {
                            if (!newUtility.amount) return alert('금액을 입력해주세요.')
                            const entry = { id: editingUtility || Date.now(), type: newUtility.type, amount: Number(newUtility.amount), day: newUtility.day, year: viewYear, month: viewMonth + 1 }
                            const filtered = utilities.filter(u => !(u.type === newUtility.type && u.year === viewYear && u.month === viewMonth + 1))
                            saveUtilities([...filtered, entry])
                            setShowAddUtility(false)
                            setEditingUtility(null)
                        }} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: themeData?.primary || '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>저장</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )}

      <BottomNav />
    </div>
  )
}