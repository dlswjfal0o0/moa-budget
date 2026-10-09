import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStagger } from '../hooks/useStagger'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import ChartContainer from '../components/ChartContainer'
import FixedPortal from '../components/FixedPortal'
import LoadError from '../components/LoadError'
import AmountInput from '../components/AmountInput'
import ThinkingOrbs from '../components/ThinkingOrbs'
import AiConsumptionReport from '../components/AiConsumptionReport'
import { getCategoryColors } from '../styles/theme'
import { useCards } from '../contexts/CardsContext'
import { useSettings } from '../contexts/SettingsContext'
import { useIsPro } from '../contexts/PurchasesContext'
import { ProBadge } from '../components/LockedFeature'
import PaywallModal from '../components/PaywallModal'
import { getDeterminismParams, hashForSeed } from '../utils/aiPrompt'
import { callAI } from '../utils/aiClient'
import AnalysisNeu from './AnalysisNeu'
import FitText from '../components/FitText'

const UTILITY_STYLES = {
  관리비: { bg: '#F3F4F6', color: '#6B7280' },
  수도세: { bg: '#EFF6FF', color: '#3B82F6' },
  전기세: { bg: '#FFFBEB', color: '#F59E0B' },
  가스비: { bg: '#FFF7ED', color: '#F97316' },
}

// AI 캐시 버전. 모델/프롬프트를 바꾸면 이 값을 올려 과거 캐시를 무효화한다.
const AI_CACHE_VERSION = 3

// AI 응답에서 순수 JSON만 추출 (앞뒤 설명/코드블록/추론 텍스트 제거)
function extractJson(text) {
  const stripped = text.replace(/```json\n?|```/g, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) return stripped.slice(start, end + 1)
  return stripped
}

// 한자(CJK) 등 한글 이외 잘못된 문자를 제거하는 안전망 (모델이 실수로 뱉는 깨진 글자 방지)
// 모델이 가끔 뱉는 끝 쉼표(,} ,])를 걷어내고 파싱을 시도한다. 실패하면 null.
function parseAiJson(text) {
  if (!text || !text.trim().startsWith('{')) return null
  for (const candidate of [text, text.replace(/,\s*([}\]])/g, '$1')]) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch { /* 다음 후보 시도 */ }
  }
  return null
}

// JSON이 아닌 응답(서버의 사용량 초과 안내 등)은 그대로 보여주고, 깨진 JSON은 원문 대신 안내 문구로 바꾼다.
function aiFailureMessage(text) {
  const t = (text || '').trim()
  if (!t) return '응답이 비어있어요. 잠시 후 다시 시도해주세요.'
  if (t.includes('{')) return '분석 결과를 정리하지 못했어요. 잠시 후 다시 시도해주세요.'
  return stripHanja(t)
}

// Firestore의 캐시와 기기의 캐시를 합친다. 같은 달 항목이 양쪽에 있으면 더 최근(at) 것을 쓴다.
function mergeAiCache(local, remote) {
  const out = { ...local }
  for (const kind of Object.keys(remote || {})) {
    const merged = { ...(local?.[kind] || {}) }
    for (const [key, entry] of Object.entries(remote[kind] || {})) {
      const mine = merged[key]
      if (!mine || (entry?.at || 0) >= (mine.at || 0)) merged[key] = entry
    }
    out[kind] = merged
  }
  return out
}

function stripHanja(s) {
  return typeof s === 'string'
    ? s.replace(/[㐀-鿿豈-﫿぀-ヿ]/g, '').replace(/[ \t]{2,}/g, ' ').trim()
    : s
}
function sanitizeDeep(obj) {
  if (typeof obj === 'string') return stripHanja(obj)
  if (Array.isArray(obj)) return obj.map(sanitizeDeep)
  if (obj && typeof obj === 'object') {
    const o = {}
    for (const k in obj) o[k] = sanitizeDeep(obj[k])
    return o
  }
  return obj
}

export function UtilityIcon({ type, size = 20, color = '#888' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === '관리비') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  if (type === '수도세') return <svg {...p}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
  if (type === '전기세') return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  if (type === '가스비') return <svg {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
}

export function UtilityChart({ type, utilities, primary, viewYear, viewMonth }) {
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
      <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}><FitText>-{payload[0].value.toLocaleString()}원</FitText></p>
    </div>
  )
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{payload[0].name}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}><FitText>{payload[0].value.toLocaleString()}원</FitText></p>
    </div>
  )
}

export default function Analysis() {
  const navigate = useNavigate()
  const { themeData, themeName, showUtilities, neumorphism } = useTheme()
  const { cards } = useCards()
  const { aiAnalysisStyle, aiShowAdvice } = useSettings()
  const isPro = useIsPro()
  const [showPaywall, setShowPaywall] = useState(false)
  const [user, setUser] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [lastMonthTx, setLastMonthTx] = useState([])
  const [aiFeedbackData, setAiFeedbackData] = useState(null)
  const [aiFeedbackRaw, setAiFeedbackRaw] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  // AI 분석 캐시 (계정 기준 동기화). localStorage로 즉시 로드 후 Firestore로 덮어씀
  const [aiCache, setAiCache] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moa_ai_cache') || '{}') } catch { return {} }
  })
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
  const [expandedUtilities, setExpandedUtilities] = useState(new Set())
  const [monthSlideDir, setMonthSlideDir] = useState(null) // 'prev' | 'next' | null
  const monthSlideTimerRef = useRef(null)
  // Stagger: 0=compare, 1=daily, 2=category, 3=AI, 4=payment
  const isVisible = useStagger(5, 40, 80)
  const toggleUtility = (type) => setExpandedUtilities(prev => {
    const next = new Set(prev)
    next.has(type) ? next.delete(type) : next.add(type)
    return next
  })

  function fetchDemoData() {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    const lm = viewMonth === 0 ? 11 : viewMonth - 1
    const ly = viewMonth === 0 ? viewYear - 1 : viewYear
    const lastStr = `${ly}-${String(lm + 1).padStart(2, '0')}`
    try { const t = localStorage.getItem(`moa_txns_${monthStr}`); setTransactions(t ? JSON.parse(t) : []) } catch { /* ignore */ }
    try { const t = localStorage.getItem(`moa_txns_${lastStr}`); setLastMonthTx(t ? JSON.parse(t) : []) } catch { /* ignore */ }
    setAiFeedbackData({
      score: 72,
      rating: 'warning',
      summary: '이번 달 식비 지출이 지난달보다 18% 증가했습니다. 배달음식 횟수를 줄이면 절약에 도움이 됩니다.',
      cuts: [
        { category: '식비', save: 50000, tip: '배달음식을 주 2회로 줄여보는 건 어떨까요? 집에서 간단히 조리하는 습관을 들이면 약 5만원을 아낄 수 있으니 함께 시작해보는 게 어떨까요?' },
        { category: '쇼핑', save: 30000, tip: '충동 구매 대신 위시리스트를 활용해보는 건 어떨까요? 하루 정도 고민한 뒤 구매하면 불필요한 지출을 줄일 수 있으니 한번 실천해보는 게 어떨까요?' },
      ],
      unusual: ['배달음식 지출이 이번 달 2회로, 지난달 대비 2배 증가했습니다.'],
      saving_goal: 80000,
      message: '조금만 더 노력하면 저축 목표를 달성할 수 있습니다! 화이팅 💪',
    })
    setUtilityAI({
      items: [
        { type: '전기세', status: 'up',   comment: '지난달보다 4,000원 증가했습니다. 초여름 에어컨 사용이 늘어난 것으로 보입니다. ⚡' },
        { type: '수도세', status: 'same', comment: '지난달과 비슷한 수준으로 안정적으로 유지되고 있습니다. 💧' },
        { type: '가스비', status: 'down', comment: '날씨가 따뜻해지면서 지난달보다 3,000원 줄었습니다. 🔥' },
        { type: '관리비', status: 'up',   comment: '지난달보다 3,000원 소폭 증가했습니다. 계절별 공용부분 관리비 영향으로 보입니다. 🏠' },
      ],
      overall: '전반적으로 공과금 지출이 안정적입니다. 여름철 전기세 관리에 집중하는 것이 좋습니다. 😊',
      tip: '에어컨 설정 온도를 1도 올려보는 건 어떨까요? 전기세를 약 7% 아낄 수 있으니 이번 여름에 함께 실천해보는 게 어떨까요?',
    })
  }

  async function fetchData() {
    try {
      const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
      const snap1 = await getDocs(query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', monthStr)))
      setTransactions(snap1.docs.map(d => ({ id: d.id, ...d.data() })))
      const lm = viewMonth === 0 ? 11 : viewMonth - 1
      const ly = viewMonth === 0 ? viewYear - 1 : viewYear
      const lastStr = `${ly}-${String(lm + 1).padStart(2, '0')}`
      const snap2 = await getDocs(query(collection(db, 'transactions'), where('uid', '==', user.uid), where('month', '==', lastStr)))
      setLastMonthTx(snap2.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('[Analysis] 거래내역 로딩 실패', err)
      setLoadError('거래내역을 불러오지 못했어요.')
    }
  }

  useEffect(() => {
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (isDemo) return // 데모 데이터는 아래 월 변경 effect가 불러온다
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) {
        // 세션 복원이 아직 안 끝난 상태에서 첫 콜백이 null로 먼저 올 수 있다 —
        // 실제로 로그아웃된 게 맞는지 authStateReady()로 한 번 더 확인한다.
        await auth.authStateReady()
        u = auth.currentUser
      }
      if (!u) navigate('/auth', { replace: true })
      else setUser(u)
    })
    return unsub
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (user) fetchData() }, [user, viewYear, viewMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // 데모 모드는 user가 없어 위 effect가 돌지 않으므로, 월을 넘길 때마다 해당 월의 로컬 시드 거래를 다시 읽는다
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem('moa_demo_mode') === 'true') fetchDemoData()
  }, [viewYear, viewMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // 계정 기준 AI 캐시 로드: 로그인 시 Firestore에서 저장된 분석 결과를 불러옴
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().aiCache) {
        const remote = snap.data().aiCache
        setAiCache(prev => {
          const next = mergeAiCache(prev, remote)
          try { localStorage.setItem('moa_ai_cache', JSON.stringify(next)) } catch { /* ignore */ }
          return next
        })
      }
    }).catch(() => { /* ignore */ })
  }, [user])

  // AI 캐시 저장: 로컬 + 계정(Firestore) 동시 반영. kind='consume'|'utility', key='YYYY-M'
  const persistAiCache = async (kind, key, sig, data) => {
    // eslint-disable-next-line react-hooks/purity -- 렌더가 아닌 분석 완료 시점(이벤트 핸들러)에서만 호출된다
    const entry = { sig, data, at: Date.now() }
    setAiCache(prev => {
      const next = { ...prev, [kind]: { ...(prev[kind] || {}), [key]: entry } }
      try { localStorage.setItem('moa_ai_cache', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { aiCache: { [kind]: { [key]: entry } } }, { merge: true })
      } catch { /* ignore */ }
    }
  }

  const fmt = n => n.toLocaleString('ko-KR')
  const cacheMonthKey = `${viewYear}-${viewMonth + 1}`
  const showLoan = localStorage.getItem('moa_showLoan') === 'true'
  const getCreditCard = (p) => cards.find(c => c.name === p && c.cardType === 'credit')
  const isCreditExcluded = (t) => {
    // 홈에서 자동 기재한 신용카드 대금: 카드 사용이 이미 지출로 잡히는 경우(Pro 아님 / 지출 모드) 이중 집계 방지
    if (t.billingCardId) {
      if (!isPro) return true
      return cards.find(c => c.id === t.billingCardId)?.creditTracking !== 'billing'
    }
    if (!isPro) return false // Pro 아니면 대금 기준 추적을 적용하지 않고 항상 지출로 집계
    if (t.cardBilling) {
      const card = getCreditCard(t.payment)
      return card?.creditTracking !== 'billing'
    }
    const card = getCreditCard(t.payment)
    return card?.creditTracking === 'billing'
  }
  const expenses = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan))
  const incomes = transactions.filter(t => !t.mergedInto && !t.isHidden && t.type === 'income' && (!showLoan || !t.isLoan))
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
  const lastExpenses = lastMonthTx.filter(t => !t.mergedInto && !t.isHidden && t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan))
  const lastIncomes = lastMonthTx.filter(t => !t.mergedInto && !t.isHidden && t.type === 'income' && (!showLoan || !t.isLoan))
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

  // 데이터 시그니처: 동일 데이터 + 동일 설정(스타일/조언)이면 계정에 저장된 결과를 그대로 사용 → 매번 결과가 달라지지 않음.
  // 카테고리는 이름순으로 정렬해 거래 조회 순서가 바뀌어도 같은 값이 나오게 한다.
  const catLine = (obj) => Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)).map(([c, a]) => `${c}: ${fmt(a)}원`).join(', ')
  const byCat = catLine(byCategory)
  const lastByCat = catLine(lastExpenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})) || '없음'
  const consumeSig = hashForSeed(JSON.stringify({ v: AI_CACHE_VERSION, byCat, lastByCat, totalExpense, totalIncome, lastTotalExpense, y: viewYear, m: viewMonth, style: aiAnalysisStyle, advice: aiShowAdvice }))
  const consumeCached = aiCache.consume?.[cacheMonthKey]
  const aiIsSaved = !!(consumeCached?.data && consumeCached.sig === consumeSig)

  const getAiFeedback = async () => {
    if (expenses.length === 0) return alert('지출 내역이 없어요.')
    const sig = consumeSig
    if (aiIsSaved) { setAiFeedbackData(consumeCached.data); setAiFeedbackRaw(''); return }
    setLoadingAi(true); setAiFeedbackData(null); setAiFeedbackRaw('')
    try {
      const adviceContentRule = aiShowAdvice
        ? '\n- cuts는 지출 상위 카테고리 위주로 최소 1개, 최대 3개 작성하세요. 각 조언(tip)은 서로 내용이 겹치지 않게, 해당 카테고리에 딱 맞는 서로 다른 구체적 방법을 제시하세요.\n- save는 각 카테고리 지출액을 고려한 현실적인 정수 금액으로, 카테고리마다 다르게 산정하세요.\n- saving_goal은 이번 달 소비 패턴을 바탕으로 현실적인 절감 목표 금액을 제시하세요.'
        : ''
      const schema = aiShowAdvice
        ? '{"rating":"good|warning|danger 중 하나","score":0~100 정수,"summary":"실제 수치 근거 2줄 요약","cuts":[{"category":"카테고리명","tip":"카테고리별로 서로 다른 구체적 조언 (청유형)","save":정수}],"unusual":["평소와 다른 지출이 있으면 구체적으로, 없으면 빈 배열"],"saving_goal":정수,"message":"응원 메시지"}'
        : '{"rating":"good|warning|danger 중 하나","score":0~100 정수,"summary":"실제 수치 근거 2줄 요약","unusual":["평소와 다른 지출이 있으면 구체적으로, 없으면 빈 배열"],"message":"응원 메시지"}'
      const data = await callAI({
        max_tokens: 2000, ...getDeterminismParams(),
        domain: 'consumption', styleLevel: aiAnalysisStyle, showAdvice: aiShowAdvice,
        messages: [{ role: 'user', content: `아래 소비 데이터를 분석해 JSON으로만 응답해주세요.\n\n이번 달 카테고리별: ${byCat}\n이번 달 총 지출 ${fmt(totalExpense)}원, 총 수입 ${fmt(totalIncome)}원\n지난 달 카테고리별: ${lastByCat} / 총 지출 ${fmt(lastTotalExpense)}원\n\n[JSON 필드 규칙]\n- summary는 실제 수치를 근거로 이번 달 소비 특징을 구체적으로 요약하세요. 증가/감소 금액이나 비중이 큰 카테고리를 언급하세요.${adviceContentRule}\n- summary, unusual, message는 "-입니다/-습니다"로 끝나는 구어체 존댓말로 작성하세요. 예: "식비가 지난달보다 3만원 늘었습니다".\n- 문어체(-다, -하였다, -되었다, -이다) 금지. 한자, 영어, 일본어 등 한글 이외의 문자 절대 금지.\n\n응답 형식(이 형식 그대로만, 값은 위 규칙대로 새로 작성):\n${schema}` }]
      })
      const raw = data.content?.[0]?.text || ''
      const parsed = parseAiJson(extractJson(raw))
      if (parsed) {
        const clean = sanitizeDeep(parsed)
        setAiFeedbackData(clean)
        persistAiCache('consume', cacheMonthKey, sig, clean)
      } else {
        setAiFeedbackRaw(aiFailureMessage(raw))
      }
    } catch { setAiFeedbackRaw('AI 분석을 불러오는 데 실패했어요.') }
    setLoadingAi(false)
  }

  const saveUtilities = async (updated) => {
    setUtilities(updated)
    localStorage.setItem('moa_utilities', JSON.stringify(updated))
    if (user) await setDoc(doc(db, 'users', user.uid), { utilities: updated }, { merge: true })
  }

  const utilitySummary = utilityTypes.map(type => {
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
  // 데이터 시그니처: 동일 데이터 + 동일 설정(스타일/조언)이면 계정에 저장된 결과를 그대로 사용 → 매번 결과가 달라지지 않음
  const utilitySig = hashForSeed(JSON.stringify({ v: AI_CACHE_VERSION, summary: utilitySummary, y: viewYear, m: viewMonth, style: aiAnalysisStyle, advice: aiShowAdvice }))
  const utilityCached = aiCache.utility?.[cacheMonthKey]
  const utilityAIIsSaved = !!(utilityCached?.data && utilityCached.sig === utilitySig)

  const getUtilityAI = async () => {
    const summary = utilitySummary
    if (!summary) return alert('이번 달 공과금 데이터를 먼저 입력해주세요.')
    const sig = utilitySig
    if (utilityAIIsSaved) { setUtilityAI(utilityCached.data); return }
    setLoadingUtilityAI(true); setUtilityAI(null)
    try {
      const adviceOverallRule = aiShowAdvice
        ? ' overall은 전체 공과금 흐름을 요약하고, tip은 이번 데이터에서 가장 아낄 여지가 큰 항목을 골라 구체적 절약 방법을 제안하세요.'
        : ' overall은 전체 공과금 흐름을 요약하세요.'
      const schema = aiShowAdvice
        ? '{"items":[{"type":"관리비","status":"up|down|same 중 하나","comment":"데이터 근거의 서로 다른 구체적 한두 줄"}],"overall":"전체 총평","tip":"구체적 절약 제안 (청유형)"}'
        : '{"items":[{"type":"관리비","status":"up|down|same 중 하나","comment":"데이터 근거의 서로 다른 구체적 한두 줄"}],"overall":"전체 총평"}'
      const data = await callAI({
        max_tokens: 1500, ...getDeterminismParams(),
        domain: 'utility', styleLevel: aiAnalysisStyle, showAdvice: aiShowAdvice,
        messages: [{ role: 'user', content: `아래 공과금 현황을 항목별로 분석해 JSON으로만 응답해주세요.\n\n${summary}\n\n[JSON 필드 규칙]\n- 각 항목의 comment는 전월 대비 증감 금액이나 계절적 요인 등 실제 데이터에 근거해 서로 다르게, 구체적으로 작성하세요.\n- "관리비가 줄었습니다"처럼 숫자만 반복하는 성의 없는 한 줄은 금지합니다. 왜 그런지 또는 어떤 의미인지 한 가지를 덧붙이세요.\n-${adviceOverallRule}\n- items의 comment, overall은 "-입니다/-습니다"로 끝나는 구어체 존댓말로 작성하세요.\n- 문어체(-다, -하였다, -되었다, -이다) 금지. 한자, 영어, 일본어 등 한글 이외의 문자 절대 금지.\n\n아래 형식 그대로, 값은 위 규칙대로 새로 작성:\n${schema}` }]
      })
      const raw = data.content?.[0]?.text || ''
      const parsed = parseAiJson(extractJson(raw))
      if (parsed) {
        const clean = sanitizeDeep(parsed)
        setUtilityAI(clean)
        persistAiCache('utility', cacheMonthKey, sig, clean)
      } else {
        setUtilityAI({ overall: aiFailureMessage(raw) })
      }
    } catch { setUtilityAI({ overall: '분석에 실패했어요.' }) }
    setLoadingUtilityAI(false)
  }

  // 저장된 분석 자동 복원: 같은 달·같은 데이터로 이미 분석한 결과가 있으면 그대로 보여주고,
  // 달이 바뀌거나 데이터가 달라졌으면 이전 결과를 내린다(다른 달의 분석이 남아 보이지 않도록).
  const isDemoMode = localStorage.getItem('moa_demo_mode') === 'true'
  useEffect(() => {
    if (isDemoMode || loadingAi) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 캐시(외부 저장소)와 화면 결과를 동기화
    setAiFeedbackData(aiIsSaved ? consumeCached.data : null)
    setAiFeedbackRaw('')
  }, [consumeSig, cacheMonthKey, aiCache]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isDemoMode || loadingUtilityAI) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 캐시(외부 저장소)와 화면 결과를 동기화
    setUtilityAI(utilityAIIsSaved ? utilityCached.data : null)
  }, [utilitySig, cacheMonthKey, aiCache]) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerMonthSlide = (dir) => {
    setMonthSlideDir(dir)
    if (monthSlideTimerRef.current) clearTimeout(monthSlideTimerRef.current)
    monthSlideTimerRef.current = setTimeout(() => setMonthSlideDir(null), 260)
  }

  const primary = themeData?.primary || '#4F46E5'
  const primaryLight = themeData?.primaryLight || '#EEF2FF'

  if (neumorphism) {
    return (
      <>
      <AnalysisNeu
        showUtilities={showUtilities} loadError={loadError}
        setShowPaywall={setShowPaywall}
        viewMonth={viewMonth} viewYear={viewYear} setViewYear={setViewYear} setViewMonth={setViewMonth}
        monthSlideDir={monthSlideDir} triggerMonthSlide={triggerMonthSlide}
        activeAnalysisTab={activeAnalysisTab} setActiveAnalysisTab={setActiveAnalysisTab}
        primary={primary} primaryLight={primaryLight} fmt={fmt}
        totalExpense={totalExpense} totalIncome={totalIncome}
        lastTotalExpense={lastTotalExpense} lastTotalIncome={lastTotalIncome}
        expenseDiff={expenseDiff} incomeDiff={incomeDiff}
        dailyData={dailyData} maxExpense={maxExpense}
        categoryData={categoryData} colorMap={colorMap}
        aiFeedbackData={aiFeedbackData} aiFeedbackRaw={aiFeedbackRaw} loadingAi={loadingAi} getAiFeedback={getAiFeedback} aiIsSaved={aiIsSaved}
        aiAnalysisStyle={aiAnalysisStyle} byCategory={byCategory} aiShowAdvice={aiShowAdvice}
        expenses={expenses}
        expandedPayments={expandedPayments} setExpandedPayments={setExpandedPayments}
        utilities={utilities} utilityTypes={utilityTypes}
        currentMonthTotal={currentMonthTotal} prevMonthTotal={prevMonthTotal} utilityTotalDiff={utilityTotalDiff}
        expandedUtilities={expandedUtilities} toggleUtility={toggleUtility}
        utilityAI={utilityAI} loadingUtilityAI={loadingUtilityAI} getUtilityAI={getUtilityAI}
        showAddUtility={showAddUtility} setShowAddUtility={setShowAddUtility}
        editingUtility={editingUtility} setEditingUtility={setEditingUtility}
        newUtility={newUtility} setNewUtility={setNewUtility} saveUtilities={saveUtilities}
      />
      {showPaywall && <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />}
      </>
    )
  }

  return (
    <div style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 'calc(95px + env(safe-area-inset-bottom, 0px))' }} className={themeName === 'pastel' ? 'theme-pastel-bg' : ''}>

      {loadError && (
        <div style={{ padding: '12px 20px 0' }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: themeData.card, padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', borderBottom: '1px solid #F2F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => { triggerMonthSlide('prev'); if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }} aria-label="이전 달"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>‹</button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28',
            animation: monthSlideDir === 'prev' ? 'slideContentRight 260ms ease' : monthSlideDir === 'next' ? 'slideContentLeft 260ms ease' : undefined }}>
            {viewYear}년 {viewMonth + 1}월 분석
          </p>
          <button onClick={() => { triggerMonthSlide('next'); if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }} aria-label="다음 달"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8B95A1', padding: '4px 8px' }}>›</button>
        </div>
      </div>

      {/* 탭 (iOS 세그먼트 스타일) */}
      {showUtilities && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', background: '#F2F4F6', borderRadius: 9999, padding: 3 }}>
            {['소비', '공과금'].map(tab => (
              <button key={tab} onClick={() => (tab === '공과금' && !isPro) ? setShowPaywall(true) : setActiveAnalysisTab(tab)}
                style={{ flex: 1, padding: '10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: activeAnalysisTab === tab ? 700 : 500,
                  background: activeAnalysisTab === tab ? primary : 'transparent',
                  color: activeAnalysisTab === tab ? '#fff' : '#8B95A1',
                  boxShadow: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s' }}>
                {tab}
                {tab === '공과금' && !isPro && <ProBadge />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 소비 탭 ── */}
      {(!showUtilities || activeAnalysisTab === '소비') && (
        <div style={{ padding: '16px 20px' }}>

          {/* 지난 달 대비 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginBottom: 16, border: `1.5px solid ${primary}33`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            opacity: isVisible(0) ? 1 : 0, transform: isVisible(0) ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 300ms ease, transform 300ms ease' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28', marginBottom: 16 }}>지난 달 대비</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>지출</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#FF5A5F' }}><FitText>{fmt(totalExpense)}원</FitText></p>
                {lastTotalExpense > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, color: expenseDiff > 0 ? '#FF5A5F' : '#2ECC71', fontWeight: 600 }}>
                    {expenseDiff > 0 ? '↑' : '↓'} {fmt(Math.abs(expenseDiff))}원 {expenseDiff > 0 ? '증가' : '감소'}
                  </p>
                )}
              </div>
              <div style={{ flex: 1, background: themeData.card, borderRadius: 20, padding: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>수입</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#2ECC71' }}><FitText>{fmt(totalIncome)}원</FitText></p>
                {lastTotalIncome > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, color: incomeDiff > 0 ? '#2ECC71' : '#FF5A5F', fontWeight: 600 }}>
                    {incomeDiff > 0 ? '↑' : '↓'} {fmt(Math.abs(incomeDiff))}원 {incomeDiff > 0 ? '증가' : '감소'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 일별 지출 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginBottom: 16, border: `1.5px solid ${primary}33`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            opacity: isVisible(1) ? 1 : 0, transform: isVisible(1) ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 300ms ease 40ms, transform 300ms ease 40ms' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28', marginBottom: 16 }}>일별 지출</p>
            {dailyData.every(d => d.amount === 0) ? (
              <p style={{ fontSize: 14, color: '#C9CDD4', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
            ) : (
              <>
                <ChartContainer height={180}>
                  <BarChart data={dailyData} margin={{ top: 0, right: 12, left: 10, bottom: 0 }}>
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
                </ChartContainer>
                {maxExpense > 0 && (() => {
                  const maxDay = dailyData.find(d => d.amount === maxExpense)
                  return (
                    <p style={{ fontSize: 12, color: '#8B95A1', textAlign: 'center', marginTop: 6 }}>
                      최고 지출일: <span style={{ color: primary, fontWeight: 700 }}>{maxDay?.day}일</span> (-{fmt(maxExpense)}원)
                    </p>
                  )
                })()}
              </>
            )}
          </div>

          {/* 카테고리별 지출 – 도넛 + 2열 그리드 */}
          <div style={{ background: themeData.card, borderRadius: 20, padding: '16px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            opacity: isVisible(2) ? 1 : 0, transform: isVisible(2) ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 300ms ease 80ms, transform 300ms ease 80ms' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28', marginBottom: 16 }}>카테고리별 지출</p>
            {categoryData.length === 0 ? (
              <p style={{ fontSize: 14, color: '#C9CDD4', textAlign: 'center', padding: '20px 0' }}>지출 내역이 없어요</p>
            ) : (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {/* 왼쪽: 도넛 차트 + 중앙 총지출 */}
                <div style={{ position: 'relative', flexShrink: 0, width: 130, height: 130 }}>
                  <PieChart width={130} height={130}>
                    <Pie data={categoryData} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || '#B0B0B0'} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }} />
                  </PieChart>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <p style={{ fontSize: 9, color: '#8B95A1', marginBottom: 1 }}>총 지출</p>
                    <p style={{ fontSize: totalExpense >= 10000000 ? 9 : 11, fontWeight: 700, color: '#191F28', whiteSpace: 'nowrap' }}>
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
                            <span style={{ fontSize: 11, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>{pct}%</span>
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
          <div style={{ background: themeData?.card || '#fff', borderRadius: 20, padding: '20px 18px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            opacity: isVisible(3) ? 1 : 0, transform: isVisible(3) ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 300ms ease 120ms, transform 300ms ease 120ms' }}>
            <AiConsumptionReport
              data={aiFeedbackData} raw={aiFeedbackRaw} loading={loadingAi} saved={aiIsSaved} onAnalyze={getAiFeedback}
              primary={primary} primaryLight={primaryLight} text={themeData.text || '#191F28'} fmt={fmt}
              styleLevel={aiAnalysisStyle} categorySpend={byCategory} showAdvice={aiShowAdvice} hasData={expenses.length > 0}
              month={viewMonth + 1} totalExpense={totalExpense} lastTotalExpense={lastTotalExpense}
            />
          </div>

          {/* 결제수단별 지출 – 아코디언 */}
          <div style={{ background: themeData.card, borderRadius: 20, padding: '16px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28', marginBottom: 16 }}>결제수단별 지출</p>
            {expenses.length === 0 ? (
              <p style={{ fontSize: 14, color: '#C9CDD4', textAlign: 'center', padding: '20px 0' }}>내역이 없어요</p>
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
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: primary, background: `${primary}18`, padding: '2px 8px', borderRadius: 9999 }}>{pct}%</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#191F28', textAlign: 'right' }}><FitText>{fmt(amount)}원</FitText></span>
                      <span style={{ fontSize: 15, color: '#C9CDD4', marginLeft: 4, display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                    </div>
                    {isExpanded && (
                      <div style={{ paddingLeft: 46, paddingBottom: 10 }}>
                        {Object.entries(detail).filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f9f9f9' }}>
                            <span style={{ fontSize: 13, color: '#8B95A1' }}>{k}</span>
                            <span style={{ fontSize: 13, color: '#191F28', fontWeight: 500 }}><FitText>{fmt(v)}원</FitText></span>
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
      {showUtilities && isPro && activeAnalysisTab === '공과금' && (
        <div style={{ padding: '16px 20px 100px' }}>

          {/* 총합 배너 - 항상 표시 */}
          <div style={{ background: primary, borderRadius: 20, padding: '18px 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>이번 달 공과금 합계</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: prevMonthTotal > 0 || currentMonthTotal === 0 ? 6 : 0 }}>
              <FitText>{fmt(currentMonthTotal)}원</FitText>
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
              <div key={type} style={{ background: cardBg, borderRadius: 20, overflow: 'hidden', marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: 16 }}>
                  {/* 카드 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: ustyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UtilityIcon type={type} color={ustyle.color} size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>{type}</p>
                        {cur?.day && <p style={{ fontSize: 12, color: '#C9CDD4' }}>매월 {cur.day}일</p>}
                      </div>
                    </div>
                    {/* 연필 아이콘: 데이터 없으면 모달, 있으면 하단 펼침 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleUtility(type) }} aria-label="공과금 수정"
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
                        <p style={{ fontSize: 22, fontWeight: 700, color: '#191F28' }}><FitText>{fmt(cur.amount)}원</FitText></p>
                        <div style={{ textAlign: 'right' }}>
                          {diff !== null ? (
                            <>
                              <p style={{ fontSize: 13, fontWeight: 600, color: diff > 0 ? '#f97316' : '#2ECC71' }}>
                                {diff > 0 ? '↑' : '↓'} {diff > 0 ? '+' : ''}{fmt(diff)}원
                              </p>
                              <p style={{ fontSize: 11, color: '#C9CDD4' }}>전월 {fmt(prev.amount)}원</p>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, background: `${primary}18`, color: primary, padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>첫 등록</span>
                          )}
                        </div>
                      </div>
                      <UtilityChart type={type} utilities={utilities} primary={primary} viewYear={viewYear} viewMonth={viewMonth} />
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: '#C9CDD4', textAlign: 'center', padding: '12px 0' }}>이번 달 데이터가 없어요</p>
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
                        }} style={{ flex: 1, padding: '11px', border: 'none', background: cardBg, color: '#8B95A1', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
          <div style={{ background: themeData?.card || '#fff', borderRadius: 20, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: themeData.text || '#191F28' }}>AI 공과금 분석</p>
              <button onClick={getUtilityAI} disabled={loadingUtilityAI}
                style={{ padding: '7px 16px', borderRadius: 9999, border: 'none', cursor: loadingUtilityAI ? 'not-allowed' : 'pointer',
                  background: loadingUtilityAI ? '#e0e0e0' : primary, color: loadingUtilityAI ? '#888' : '#fff', fontSize: 13 }}>
                {loadingUtilityAI ? '분석 중...' : '✨ AI 분석'}
              </button>
            </div>
            {!utilityAI && !loadingUtilityAI && <p style={{ fontSize: 13, color: '#C9CDD4', textAlign: 'center', padding: '12px 0' }}>AI가 전월·전년도와 비교 분석해드려요</p>}
            {loadingUtilityAI && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <ThinkingOrbs color={primary} size={36} label="공과금 패턴을 비교하는 중...." fontSize={14} />
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
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{type}</span>
                          {diff !== null && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: badgeColor, background: `${badgeColor}18`, padding: '2px 8px', borderRadius: 9999 }}>
                              {isUp ? '↑' : '↓'} {diff > 0 ? '+' : ''}{fmt(diff)}원
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: '#4E5968', lineHeight: 1.6, wordBreak: 'keep-all' }}>{item.comment}</p>
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
            <FixedPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 999 }}
              onClick={() => setShowAddUtility(false)}>
              <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)' }} onClick={e => e.stopPropagation()}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E8EB', margin: '0 auto 20px' }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#191F28', marginBottom: 16 }}>{newUtility.type} 입력</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <AmountInput placeholder="금액 (원)" value={newUtility.amount}
                    onChange={v => setNewUtility(p => ({ ...p, amount: v }))}
                    style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid #E5E8EB', fontSize: 15, outline: 'none', background: '#F7F8FA', color: '#191F28' }} />
                  <input type="number" placeholder="납부일 (예: 15)" min="1" max="31" value={newUtility.day}
                    onChange={e => setNewUtility(p => ({ ...p, day: e.target.value }))}
                    style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid #E5E8EB', fontSize: 15, outline: 'none', background: '#F7F8FA', color: '#191F28' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowAddUtility(false)}
                    style={{ flex: 1, height: 56, borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', fontSize: 15, cursor: 'pointer', color: '#8B95A1' }}>취소</button>
                  <button onClick={() => {
                    if (!newUtility.amount) return alert('금액을 입력해주세요.')
                    const entry = { id: editingUtility || Date.now(), type: newUtility.type, amount: Number(newUtility.amount), day: newUtility.day, year: viewYear, month: viewMonth + 1 }
                    const filtered = utilities.filter(u => !(u.type === newUtility.type && u.year === viewYear && u.month === viewMonth + 1))
                    saveUtilities([...filtered, entry])
                    setShowAddUtility(false); setEditingUtility(null)
                  }} style={{ flex: 1, height: 56, borderRadius: 16, border: 'none', background: primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>저장</button>
                </div>
              </div>
            </div>
            </FixedPortal>
          )}

        </div>
      )}

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
