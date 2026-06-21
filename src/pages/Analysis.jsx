import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import BottomNav from '../components/BottomNav'
import { CATEGORY_COLORS, getCategoryColors } from '../styles/theme'

const UTILITY_STYLES = {
  관리비: { bg: '#F3F4F6', color: '#6B7280' },
  수도세: { bg: '#EFF6FF', color: '#3B82F6' },
  전기세: { bg: '#FFFBEB', color: '#F59E0B' },
  가스비: { bg: '#FFF7ED', color: '#F97316' },
}

function UtilityIcon({ type, size = 20, color = '#888' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === '관리비') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  if (type === '수도세') return <svg {...p}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
  if (type === '전기세') return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  if (type === '가스비') return <svg {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
}

function UtilityChart({ type, utilities, primary, viewYear, viewMonth }) {
  const months = Array.from({ length: 4 }, (_, i) => {
    const offset = 3 - i
    let m = viewMonth - offset
    let y = viewYear
    while (m < 0) { m += 12; y-- }
    return { year: y, month: m + 1, label: `${m + 1}월` }
  })
  const data = months.map(m => ({
    label: m.label,
    amount: utilities.find(u => u.type === type && u.year === m.year && u.month === m.month)?.amount || 0
  }))
  const max = Math.max(...data.map(d => d.amount), 1)
  const validCount = data.filter(d => d.amount > 0).length
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48, marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', height: Math.max((d.amount / max) * 38, d.amount > 0 ? 2 : 0), background: i === 3 ? primary : `${primary}44`, borderRadius: '3px 3px 0 0', transition: 'height 0.5s' }} />
            <span style={{ fontSize: 9, color: i === 3 ? '#555' : '#ccc' }}>{d.label}</span>
          </div>
        ))}
      </div>
      {validCount > 0 && (
        <p style={{ fontSize: 10, color: '#ccc', textAlign: 'right', marginTop: 2 }}>최근 {validCount}개월</p>
      )}
    </div>
  )
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{label}일</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>-{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{payload[0].name}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

export default function Analysis() {
  const { themeData, themeName, showUtilities } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [lastMonthTx, setLastMonthTx] = useState([])
  const [aiFeedbackData, setAiFeedbackData] = useState(null)
  const [aiFeedbackRaw, setAiFeedbackRaw] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('소비')
  const [utilities, setUtilities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moa_utilities') || '[]') } catch { return [] }
  })
  const [showAddUtility, setShowAddUtility] = useState(false)
  const [editingUtility, setEditingUtility] = useState(null)
  const [newUtility, setNewUtility] = useState({ type: '전기세', amount: '', day: '' })
  const [utilityAI, setUtilityAI] = useState(null)
  const [loadingUtilityAI, setLoadingUtilityAI] = useState(false)
  const [expandedPayments, setExpandedPayments] = useState(new Set())
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [expandedUtilities, setExpandedUtilities] = useState(new Set())
  const toggleUtility = (type) => setExpandedUtilities(prev => {
    const next = new Set(prev)
    next.has(type) ? next.delete(type) : next.add(type)
    return next
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
          const data = snap.data()
          if (data.utilities) {
            setUtilities(data.utilities)
            localStorage.setItem('moa_utilities', JSON.stringify(data.utilities))
          }
        }
      }
    })
    return unsub
  }, [])

  useEffect(() => { if (user) fetchData() }, [user, viewYear, viewMonth])

  const fetchData = async () => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const snap1 = await getDocs(query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', monthStr)))
    setTransactions(snap1.docs.map(d => ({ id: d.id, ...d.data() })))
    const lm = viewMonth === 0 ? 11 : viewMonth - 1
    const ly = viewMonth === 0 ? viewYear - 1 : viewYear
    const lastStr = `${ly}-${String(lm + 1).padStart(2, '0')}`
    const snap2 = await getDocs(query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', lastStr)))
    setLastMonthTx(snap2.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const fmt = n => n.toLocaleString('ko-KR')
  const showLoan = localStorage.getItem('moa_showLoan') === 'true'
  const cards = JSON.parse(localStorage.getItem('moa_cards') || '[]')
  const isCredit = p => cards.some(c => c.name === p && c.cardType === 'credit')
  const expenses = transactions.filter(t => t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && (!showLoan || !t.isLoan))
  const incomes = transactions.filter(t => t.type === 'income' && (!showLoan || !t.isLoan))
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
  const lastExpenses = lastMonthTx.filter(t => t.type === 'expense')
  const lastIncomes = lastMonthTx.filter(t => t.type === 'income')
  const lastTotalExpense = lastExpenses.reduce((s, t) => s + t.amount, 0)
  const lastTotalIncome = lastIncomes.reduce((s, t) => s + t.amount, 0)
  const expenseDiff = totalExpense - lastTotalExpense
  const incomeDiff = totalIncome - lastTotalIncome

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${d}`
    return { day: i + 1, amount: expenses.filter(t => t.date === dateStr).reduce((s, t) => s + t.amount, 0) }
  })
  const maxExpense = dailyData.reduce((max, d) => Math.max(max, d.amount), 0)

  const byCategory = expenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
  const categoryData = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  const colorMap = getCategoryColors(categoryData.map(c => c.name))

  // 공과금 합계
  const utilityTypes = ['관리비', '수도세', '전기세', '가스비']
  const currentMonthTotal = utilityTypes.reduce((sum, type) => {
    const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
    return sum + (cur?.amount || 0)
  }, 0)
  const prevMonthTotal = utilityTypes.reduce((sum, type) => {
    const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
    const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
    return sum + (prev?.amount || 0)
  }, 0)
  const utilityTotalDiff = currentMonthTotal - prevMonthTotal

  const getAiFeedback = async () => {
    if (expenses.length === 0) return alert('지출 내역이 없어요.')
    setLoadingAi(true); setAiFeedbackData(null); setAiFeedbackRaw('')
    const byCat = Object.entries(byCategory).map(([c, a]) => `${c}: ${fmt(a)}원`).join(', ')
    const lastByCat = Object.entries(
      lastExpenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
    ).map(([c, a]) => `${c}: ${fmt(a)}원`).join(', ') || '없음'
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          system: '당신은 한국어로 응답하는 개인 재무 분석 AI입니다. 반드시 유효한 JSON만 출력하세요. 마크다운, 코드블록, 설명 없이 순수 JSON만 출력하세요.',
          messages: [{ role: 'user', content: `소비 데이터를 분석하고 JSON으로만 응답해주세요:\n\n이번 달: ${byCat} / 총 ${fmt(totalExpense)}원 지출, ${fmt(totalIncome)}원 수입\n지난 달: ${lastByCat} / 총 ${fmt(lastTotalExpense)}원 지출\n\n규칙:\n- save는 반드시 순수 정수 숫자만 (계산식, 수식 절대 금지)\n- save는 해당 카테고리에서 절약 가능한 예상 금액 (0 이상)\n- 모든 숫자 필드는 정수만 허용\n\n응답 형식 (이 형식 그대로만):\n{"rating":"good","score":75,"summary":"2줄 요약","cuts":[{"category":"카테고리명","tip":"절감 팁","save":50000}],"unusual":[],"saving_goal":100000,"message":"이모지 포함 응원 메시지"}` }]
        })
      })
      const data = await res.json()
      const text = data.content[0].text.replace(/```json\n?|```/g, '').trim()
      if (!text) { setAiFeedbackRaw('응답이 비어있어요. 잠시 후 다시 시도해주세요.'); setLoadingAi(false); return }
      try { setAiFeedbackData(JSON.parse(text)) } catch { setAiFeedbackRaw(text) }
    } catch { setAiFeedbackRaw('AI 분석을 불러오는 데 실패했어요.') }
    setLoadingAi(false)
  }

  const saveUtilities = async (updated) => {
    setUtilities(updated)
    localStorage.setItem('moa_utilities', JSON.stringify(updated))
    if (user) await setDoc(doc(db, 'users', user.uid), { utilities: updated }, { merge: true })
  }

  const getUtilityAI = async () => {
    const summary = utilityTypes.map(type => {
      const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
      if (!cur) return null
      const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
      const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
      const prevYear = utilities.find(u => u.type === type && u.year === viewYear - 1 && u.month === viewMonth + 1)
      let comparison = prevYear
        ? `전월 ${prev ? fmt(prev.amount) + '원' : '없음'} / 전년도 ${fmt(prevYear.amount)}원`
        : prev ? `전월 ${fmt(prev.amount)}원` : '비교 데이터 없음'
      return `${type}: 이번달 ${fmt(cur.amount)}원 / ${comparison}`
    }).filter(Boolean).join('\n')
    if (!summary) return alert('이번 달 공과금 데이터를 먼저 입력해주세요.')
    setLoadingUtilityAI(true); setUtilityAI(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 600,
          system: '한국어로 응답하는 공과금 분석 AI. 순수 JSON만 출력. 마크다운 금지.',
          messages: [{ role: 'user', content: `공과금 현황:\n${summary}\n\n각 항목을 친근하게 분석해줘.\n\n{"items":[{"type":"관리비","status":"up","comment":"이모지 포함 친근한 한 줄 코멘트"}],"overall":"이모지 포함 전체 총평","tip":"이모지 포함 절약 팁 한 줄"}` }]
        })
      })
      const data = await res.json()
      const text = data.content[0].text.replace(/```json\n?|```/g, '').trim()
      try { setUtilityAI(JSON.parse(text)) } catch { setUtilityAI({ overall: text }) }
    } catch { setUtilityAI({ overall: '분석에 실패했어요.' }) }
    setLoadingUtilityAI(false)
  }

  const primary = themeData?.primary || '#4F46E5'
  const primaryLight = themeData?.primaryLight || '#EEF2FF'

  return (
    <div style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 80 }} className={themeName === 'pastel' ? 'theme-pastel-bg' : ''}>

      {/* 헤더 */}
      <div style={{ background: themeData.card, padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>‹</button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{viewYear}년 {viewMonth + 1}월 분석</p>
          <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}>›</button>
        </div>
      </div>

      {/* 탭 (iOS 세그먼트 스타일) */}
      {showUtilities && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 9999, padding: 3 }}>
            {['소비', '공과금'].map(tab => (
              <button key={tab} onClick={() => setActiveAnalysisTab(tab)}
                style={{ flex: 1, padding: '10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: activeAnalysisTab === tab ? 700 : 500,
                  background: activeAnalysisTab === tab ? primary : 'transparent',
                  color: activeAnalysisTab === tab ? '#fff' : '#888',
                  boxShadow: 'none',
                  transition: 'all 0.15s' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 소비 탭 ── */}
      {(!showUtilities || activeAnalysisTab === '소비') && (
        <div style={{ padding: '16px' }}>

          {/* 지난 달 대비 */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, border: `1.5px solid ${primary}33` }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111', marginBottom: 16 }}>지난 달 대비</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: themeData.card, borderRadius: 16, padding: '14px' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>지출</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#ef4444' }}>{fmt(totalExpense)}원</p>
                {lastTotalExpense > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, color: expenseDiff > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                    {expenseDiff > 0 ? '↑' : '↓'} {fmt(Math.abs(expenseDiff))}원 {expenseDiff > 0 ? '증가' : '감소'}
                  </p>
                )}
              </div>
              <div style={{ flex: 1, background: themeData.card, borderRadius: 16, padding: '14px' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>수입</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#22c55e' }}>{fmt(totalIncome)}원</p>
                {lastTotalIncome > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, color: incomeDiff > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {incomeDiff > 0 ? '↑' : '↓'} {fmt(Math.abs(incomeDiff))}원 {incomeDiff > 0 ? '증가' : '감소'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 일별 지출 */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, border: `1.5px solid ${primary}33` }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111', marginBottom: 16 }}>일별 지출</p>
            {dailyData.every(d => d.amount === 0) ? (
              <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#bbb' }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: '#bbb' }} tickLine={false} axisLine={false}
                      tickFormatter={v => {
                        if (v === 0) return ''
                        if (v >= 10000) return `${Math.round(v / 10000)}만`
                        if (v >= 1000) return `${Math.round(v / 1000)}천`
                        return `${v}`
                      }} />
                    <Tooltip content={<CustomBarTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {dailyData.map((entry, i) => (
                        <Cell key={i} fill={entry.amount > 0 && entry.amount === maxExpense ? primary : '#c8c8c8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {maxExpense > 0 && (() => {
                  const maxDay = dailyData.find(d => d.amount === maxExpense)
                  return (
                    <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 6 }}>
                      최고 지출일: <span style={{ color: primary, fontWeight: 700 }}>{maxDay?.day}일</span> (-{fmt(maxExpense)}원)
                    </p>
                  )
                })()}
              </>
            )}
          </div>

          {/* 카테고리별 지출 – 도넛 + 2열 그리드 */}
          <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111', marginBottom: 16 }}>카테고리별 지출</p>
            {categoryData.length === 0 ? (
              <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
            ) : (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {/* 왼쪽: 도넛 차트 + 중앙 총지출 */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <PieChart width={130} height={130}>
                    <Pie data={categoryData} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || '#B0B0B0'} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                  </PieChart>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', width: 70 }}>
                    <p style={{ fontSize: 9, color: '#aaa', marginBottom: 1 }}>총 지출</p>
                    <p style={{ fontSize: totalExpense >= 10000000 ? 9 : 11, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
                      {totalExpense >= 10000 ? `${Math.round(totalExpense / 10000)}만원` : `${fmt(totalExpense)}원`}
                    </p>
                  </div>
                </div>
                {/* 오른쪽: 카테고리별 가로 바 */}
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

          {/* AI 소비 분석 */}
          <div style={{ background: themeData?.card || '#fff', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111' }}>AI 소비 분석</p>
              <button onClick={getAiFeedback} disabled={loadingAi}
                style={{ padding: '7px 16px', borderRadius: 9999, border: 'none', cursor: loadingAi ? 'not-allowed' : 'pointer',
                  background: loadingAi ? '#e0e0e0' : primary, color: loadingAi ? '#888' : '#fff', fontSize: 13, fontWeight: 500 }}>
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

              const levelColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#f59e0b']
              const levelNames = ['위험', '주의', '보통', '양호', '우수']
              const filledCount = Math.min(5, Math.max(1, Math.ceil((aiFeedbackData.score || 50) / 20)))

              return (
                <>
                  {/* 점수 카드 */}
                  <div style={{ background: rc.bg, borderRadius: 16, padding: '16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: rc.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{aiFeedbackData.score}</span>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>점</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: rc.color, marginBottom: 4 }}>{rc.label}</p>
                      <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{aiFeedbackData.summary}</p>
                      {/* 5단계 스케일 */}
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        {levelColors.map((color, i) => (
                          <div key={i} style={{ width: 15, height: 15, borderRadius: '50%', background: i < filledCount ? color : '#e5e7eb', transition: 'background 0.3s' }} />
                        ))}
                        <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>{levelNames[filledCount - 1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* 절감 포인트 */}
                  {aiFeedbackData.cuts?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>💡 절감 포인트</p>
                      {aiFeedbackData.cuts.map((cut, i) => (
                        <div key={i} style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: primary, background: primaryLight, padding: '2px 10px', borderRadius: 9999 }}>{cut.category}</span>
                            {cut.save > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>최대 {fmt(cut.save)}원 절약</span>}
                          </div>
                          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{typeof cut.tip === 'string' ? cut.tip : String(cut.tip ?? '')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 이상 지출 */}
                  {aiFeedbackData.unusual?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>🚨 이상 지출 감지</p>
                      {aiFeedbackData.unusual.map((u, i) => (
                        <div key={i} style={{ background: '#FFF5F5', borderRadius: 8, padding: '10px 12px', marginBottom: 6, borderLeft: '3px solid #ef4444', display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
                          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{typeof u === 'string' ? u : (u?.tip || u?.reason || u?.description || u?.message || JSON.stringify(u))}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 절감 목표 */}
                  {aiFeedbackData.saving_goal > 0 && (
                    <div style={{ background: '#F0FFF4', borderRadius: 16, padding: '12px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#333' }}>🎯 이번 달 절감 목표</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{fmt(aiFeedbackData.saving_goal)}원</span>
                    </div>
                  )}

                  {/* 응원 메시지 */}
                  {aiFeedbackData.message && (
                    <div style={{ textAlign: 'center', padding: '14px', background: primaryLight, borderRadius: 16 }}>
                      <p style={{ fontSize: 14, color: primary, fontWeight: 500 }}>{aiFeedbackData.message}</p>
                    </div>
                  )}
                </>
              )
            })()}
            {aiFeedbackRaw && (
              <div style={{ background: primaryLight, borderRadius: 16, padding: '14px', borderLeft: `3px solid ${primary}` }}>
                <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7 }}>{aiFeedbackRaw}</p>
              </div>
            )}
          </div>

          {/* 결제수단별 지출 – 아코디언 */}
          <div style={{ background: themeData.card, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111', marginBottom: 16 }}>결제수단별 지출</p>
            {expenses.length === 0 ? (
              <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>내역이 없어요</p>
            ) : (() => {
              const userAccounts = (() => { try { return JSON.parse(localStorage.getItem('moa_accounts') || '[]').map(a => a.name) } catch { return [] } })()
              const isCardPayment = p => p !== '현금' && p !== '계좌이체' && !userAccounts.includes(p)
              const isTransferPayment = p => p === '계좌이체' || userAccounts.includes(p)
              const cardExps = expenses.filter(t => isCardPayment(t.payment || '카드'))
              const transferExps = expenses.filter(t => isTransferPayment(t.payment || ''))
              const cashExps = expenses.filter(t => (t.payment || '') === '현금')
              const cardTotal = cardExps.reduce((s, t) => s + t.amount, 0)
              const transferTotal = transferExps.reduce((s, t) => s + t.amount, 0)
              const cashTotal = cashExps.reduce((s, t) => s + t.amount, 0)
              const grandTotal = cardTotal + transferTotal + cashTotal

              const byCard = cardExps.reduce((acc, t) => { const k = t.payment || '카드'; acc[k] = (acc[k] || 0) + t.amount; return acc }, {})
              const byAccount = transferExps.reduce((acc, t) => { const k = t.payment || '이체'; acc[k] = (acc[k] || 0) + t.amount; return acc }, {})
              const byCash = { '현금': cashTotal }

              const cardIconSvg = (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              )
              const transferIconSvg = (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              )
              const cashIconSvg = (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
                </svg>
              )

              const PaymentRow = ({ groupKey, icon, label, amount, detail }) => {
                if (amount === 0) return null
                const isExpanded = expandedPayments.has(groupKey)
                const pct = grandTotal > 0 ? Math.round(amount / grandTotal * 100) : 0
                return (
                  <div style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <div onClick={() => setExpandedPayments(prev => { const next = new Set(prev); next.has(groupKey) ? next.delete(groupKey) : next.add(groupKey); return next })}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {icon}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: primary, background: `${primary}18`, padding: '2px 8px', borderRadius: 9999 }}>{pct}%</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#111', textAlign: 'right' }}>{fmt(amount)}원</span>
                      <span style={{ fontSize: 15, color: '#bbb', marginLeft: 4, display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                    </div>
                    {isExpanded && (
                      <div style={{ paddingLeft: 46, paddingBottom: 10 }}>
                        {Object.entries(detail).filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f9f9f9' }}>
                            <span style={{ fontSize: 13, color: '#666' }}>{k}</span>
                            <span style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{fmt(v)}원</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div>
                  <PaymentRow groupKey="card" icon={cardIconSvg} label="카드" amount={cardTotal} detail={byCard} />
                  <PaymentRow groupKey="transfer" icon={transferIconSvg} label="이체" amount={transferTotal} detail={byAccount} />
                  <PaymentRow groupKey="cash" icon={cashIconSvg} label="현금" amount={cashTotal} detail={byCash} />
                </div>
              )
            })()}
          </div>

        </div>
      )}

      {/* ── 공과금 탭 ── */}
      {showUtilities && activeAnalysisTab === '공과금' && (
        <div style={{ padding: '16px 16px 100px' }}>

          {/* 총합 배너 - 항상 표시 */}
          <div style={{ background: primary, borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>이번 달 공과금 합계</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: prevMonthTotal > 0 || currentMonthTotal === 0 ? 6 : 0 }}>
              {fmt(currentMonthTotal)}원
            </p>
            {prevMonthTotal > 0 && (
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                전월 대비 {utilityTotalDiff > 0 ? '+' : ''}{fmt(utilityTotalDiff)}원 {utilityTotalDiff > 0 ? '증가' : '감소'}
              </p>
            )}
            {currentMonthTotal === 0 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>이번 달 공과금을 입력해주세요</p>
            )}
          </div>

          {/* 공과금 카드 */}
          {utilityTypes.map(type => {
            const ustyle = UTILITY_STYLES[type] || { bg: '#f5f5f5', color: '#888' }
            const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
            const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
            const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
            const diff = cur && prev ? cur.amount - prev.amount : null
            const isExpand = expandedUtilities.has(type)
            const cardBg = themeData?.card || '#fff'

            return (
              <div key={type} style={{ background: cardBg, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ padding: 16 }}>
                  {/* 카드 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: ustyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UtilityIcon type={type} color={ustyle.color} size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{type}</p>
                        {cur?.day && <p style={{ fontSize: 12, color: '#aaa' }}>매월 {cur.day}일</p>}
                      </div>
                    </div>
                    {/* 연필 아이콘: 데이터 없으면 모달, 있으면 하단 펼침 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleUtility(type) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isExpand ? primary : '#bbb', padding: 4, lineHeight: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>

                  {/* 금액 + 차트 */}
                  {cur ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                        <p style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{fmt(cur.amount)}원</p>
                        <div style={{ textAlign: 'right' }}>
                          {diff !== null ? (
                            <>
                              <p style={{ fontSize: 13, fontWeight: 600, color: diff > 0 ? '#f97316' : '#22c55e' }}>
                                {diff > 0 ? '↑' : '↓'} {diff > 0 ? '+' : ''}{fmt(diff)}원
                              </p>
                              <p style={{ fontSize: 11, color: '#bbb' }}>전월 {fmt(prev.amount)}원</p>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, background: `${primary}18`, color: primary, padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>첫 등록</span>
                          )}
                        </div>
                      </div>
                      <UtilityChart type={type} utilities={utilities} primary={primary} viewYear={viewYear} viewMonth={viewMonth} />
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>이번 달 데이터가 없어요</p>
                  )}
                </div>

                {/* 수정/삭제 펼침 – 카드색과 동일 배경 */}
                {isExpand && (
                  <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0' }}>
                    {cur ? (
                      <>
                        <button onClick={() => {
                          setNewUtility({ type, amount: cur.amount, day: cur.day || '' })
                          setEditingUtility(cur.id)
                          setShowAddUtility(true)
                          toggleUtility(type)
                        }} style={{ flex: 1, padding: '11px', border: 'none', background: cardBg, color: '#555', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          수정
                        </button>
                        <div style={{ width: 1, background: '#f0f0f0' }} />
                        <button onClick={() => { saveUtilities(utilities.filter(u => u.id !== cur.id)); toggleUtility(type) }}
                          style={{ flex: 1, padding: '11px', border: 'none', background: cardBg, color: '#ef4444', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          삭제
                        </button>
                      </>
                    ) : (
                      <button onClick={() => {
                        setNewUtility({ type, amount: '', day: '' })
                        setEditingUtility(null)
                        setShowAddUtility(true)
                        toggleUtility(type)
                      }} style={{ flex: 1, padding: '11px', border: 'none', background: cardBg, color: primary, fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        추가
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* AI 공과금 분석 */}
          <div style={{ background: themeData?.card || '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#111' }}>AI 공과금 분석</p>
              <button onClick={getUtilityAI} disabled={loadingUtilityAI}
                style={{ padding: '7px 16px', borderRadius: 9999, border: 'none', cursor: loadingUtilityAI ? 'not-allowed' : 'pointer',
                  background: loadingUtilityAI ? '#e0e0e0' : primary, color: loadingUtilityAI ? '#888' : '#fff', fontSize: 13 }}>
                {loadingUtilityAI ? '분석 중...' : '✨ AI 분석'}
              </button>
            </div>
            {!utilityAI && !loadingUtilityAI && <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>AI가 전월·전년도와 비교 분석해드려요</p>}
            {loadingUtilityAI && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, color: '#888' }}>공과금 패턴을 분석하고 있어요...</p>
              </div>
            )}
            {utilityAI && (
              <div>
                {/* 항목별 리스트 */}
                {utilityAI.items?.map((item, i) => {
                  const type = item.type
                  const ustyle = UTILITY_STYLES[type] || { bg: '#f5f5f5', color: '#888' }
                  const cur = utilities.find(u => u.type === type && u.year === viewYear && u.month === viewMonth + 1)
                  const lm = viewMonth === 0 ? { year: viewYear - 1, month: 12 } : { year: viewYear, month: viewMonth }
                  const prev = utilities.find(u => u.type === type && u.year === lm.year && u.month === lm.month)
                  const diff = cur && prev ? cur.amount - prev.amount : null
                  const isUp = diff !== null ? diff > 0 : item.status === 'up'
                  const badgeColor = isUp ? '#f97316' : '#22c55e'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < utilityAI.items.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: ustyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UtilityIcon type={type} color={ustyle.color} size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{type}</span>
                          {diff !== null && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: badgeColor, background: `${badgeColor}18`, padding: '2px 8px', borderRadius: 9999 }}>
                              {isUp ? '↑' : '↓'} {diff > 0 ? '+' : ''}{fmt(diff)}원
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: '#888', lineHeight: 1.45 }}>{item.comment}</p>
                      </div>
                    </div>
                  )
                })}

                {/* 전체 총평 */}
                {utilityAI.overall && (
                  <div style={{ background: primaryLight, borderRadius: 16, padding: '12px 14px', marginTop: utilityAI.items?.length ? 12 : 0, marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: primary, lineHeight: 1.6 }}>{utilityAI.overall}</p>
                  </div>
                )}

                {/* 절약 팁 */}
                {utilityAI.tip && (
                  <div style={{ background: '#F0FFF4', borderRadius: 16, padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, color: '#16a34a', lineHeight: 1.6 }}>💡 {utilityAI.tip}</p>
                  </div>
                )}
              </div>
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
                    style={{ padding: '11px 14px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none' }} />
                  <input type="number" placeholder="납부일 (예: 15)" min="1" max="31" value={newUtility.day}
                    onChange={e => setNewUtility(p => ({ ...p, day: e.target.value }))}
                    style={{ padding: '11px 14px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowAddUtility(false)}
                    style={{ flex: 1, padding: 14, borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', fontSize: 15, cursor: 'pointer' }}>취소</button>
                  <button onClick={() => {
                    if (!newUtility.amount) return alert('금액을 입력해주세요.')
                    const entry = { id: editingUtility || Date.now(), type: newUtility.type, amount: Number(newUtility.amount), day: newUtility.day, year: viewYear, month: viewMonth + 1 }
                    const filtered = utilities.filter(u => !(u.type === newUtility.type && u.year === viewYear && u.month === viewMonth + 1))
                    saveUtilities([...filtered, entry])
                    setShowAddUtility(false); setEditingUtility(null)
                  }} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>저장</button>
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
