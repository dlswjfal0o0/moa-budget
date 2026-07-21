import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import { haptic } from '../utils/haptics'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, orderBy,
  getDoc, setDoc
} from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import LoadError from '../components/LoadError'
import YearMonthPicker from '../components/YearMonthPicker'
import { getCategoryColor } from '../styles/theme'
import { inputStyle } from '../styles/styles'
import { useCards } from '../contexts/CardsContext'
import { useSettings } from '../contexts/SettingsContext'
import { useLoans } from '../contexts/LoansContext'

const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const today = () => toDateStr(new Date())

const getWeekStart = (baseDate, startDay) => {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = startDay === 1 ? (day === 0 ? -6 : 1 - day) : -day
  d.setDate(d.getDate() + diff)
  return d
}

const formatTime = (time) => {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${hour}:${String(m).padStart(2, '0')}`
}

// ── 카테고리 SVG 아이콘 ──────────────────────────────
const CatIcon = ({ cat, size = 18, color = '#888' }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (cat) {
    case '식비': return <svg {...p}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
    case '교통': return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>
    case '쇼핑': return <svg {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    case '문화': return <svg {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
    case '의료': return <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    case '주거': return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case '통신': return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.37 2 2 0 0 1 3.57 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    case '급여': return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    case '부업': return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    case '용돈': return <svg {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
    case '투자': return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    case '환전': return <svg {...p}><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    case '학업': return <svg {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    case '화장품': return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    case '금융': return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case '구독': return <svg {...p}><path d="M21.5 2h-19A1.5 1.5 0 0 0 1 3.5v17A1.5 1.5 0 0 0 2.5 22h19a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 21.5 2z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
    case '선물': return <svg {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
    case '취미': return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    case '유흥': return <svg {...p}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
    case '헤어': return <svg {...p}><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>
    case 'transfer': return <svg {...p}><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    default: return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  }
}

// 키워드 → 아이콘 키 자동 매핑
const guessIconKey = (name) => {
  // 정확한 카테고리명 우선 매핑
  const exact = {
    '환불': '환전', '환급': '환전', '반품': '환전', '캐시백': '환전', '리워드': '환전',
    '중고거래': '쇼핑', '중고': '쇼핑',
    '결제대금': '금융', '체크할인': '금융', '1/n': '금융', 'n빵': '금융', '더치페이': '금융',
  }
  if (exact[name]) return exact[name]

  const map = [
    [['식', '밥', '먹', '카페', '커피', '음식', '외식', '분식', '식당', '레스토랑'], '식비'],
    [['교통', '버스', '지하철', '택시', '주유', '기름', '기차', 'KTX', '고속'], '교통'],
    [['쇼핑', '옷', '의류', '신발', '잡화', '패션', '백화점', '마트'], '쇼핑'],
    [['문화', '영화', '공연', '전시', '여행', '여가', '콘서트', '뮤지컬'], '문화'],
    [['의료', '병원', '약', '헬스', '건강', '치과', '약국', '진료'], '의료'],
    [['주거', '월세', '관리비', '전세', '집', '주택', '임대', '전기', '수도', '가스'], '주거'],
    [['통신', '인터넷', '폰', '전화', '데이터', '요금제'], '통신'],
    [['급여', '월급', '연봉', '보너스', '성과금', '임금'], '급여'],
    [['부업', '프리랜서', '알바', '아르바이트', '외주', '과외'], '부업'],
    [['용돈', '축의금', '부조', '경조사', '보조'], '용돈'],
    [['투자', '주식', '코인', '펀드', '저축', '예금', '적금'], '투자'],
    [['환전', '외화', '달러', '엔화', '위안'], '환전'],
    [['학업', '교육', '학원', '학비', '책', '강의', '수강', '공부'], '학업'],
    [['화장품', '뷰티', '스킨', '로션', '메이크업', '향수'], '화장품'],
    [['금융', '카드대금', '이자', '보험료', '수수료'], '금융'],
    [['구독', '넷플릭스', '유튜브', '스포티파이', '왓챠', '월정액'], '구독'],
    [['선물', '기념일', '생일', '크리스마스', '어버이'], '선물'],
    [['취미', '낚시', '독서', '음악', '사진', '그림', '게임', '캠핑', '골프'], '취미'],
    [['유흥', '술', '나이트', '클럽', '바', '호프', '노래방'], '유흥'],
    [['헤어', '미용', '미용실', '네일', '피부', '왁싱'], '헤어'],
    [['환불', '환급', '반품', '캐시백', '리워드', '포인트환급'], '환전'],
    [['중고거래', '중고', '당근', '번개장터', '재판매'], '쇼핑'],
    [['결제대금', '체크할인', '1/n', 'n빵', '더치', '정산', '소액신용'], '금융'],
  ]
  for (const [keywords, iconKey] of map) {
    if (keywords.some(k => name.includes(k))) return iconKey
  }
  return '기타'
}

// ── 토글 컴포넌트 ────────────────────────────────────
const Toggle = ({ on, onChange }) => {
  const { themeData } = useTheme()
  return (
    <div onClick={() => onChange(!on)}
      style={{ width: 48, height: 28, borderRadius: 9999, background: on ? themeData.primary : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
    </div>
  )
}

// ── 뒤로가기 아이콘 ──────────────────────────────────
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

// ── 설정 섹션 레이블 ──────────────────────────────────
// eslint-disable-next-line no-unused-vars
const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, paddingLeft: 4 }}>{children}</p>
)

export default function Ledger() {
  const { themeData } = useTheme()
  const { cards: userCardsList } = useCards()
  const { loans } = useLoans()
  const { weekStartDay, sortOrder, setSortOrder, showCardBilling, showLoan, categories } = useSettings()
  const navigate = useNavigate()
  const now = new Date()
  const [user, setUser] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [tab, setTab] = useState('전체')
  const [period, setPeriod] = useState('월간')
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [swipedId, setSwipedId] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [userPayments, setUserPayments] = useState(['현금'])
  const [form, setForm] = useState({ type: 'expense', title: '', amount: '', category: '식비', date: today(), time: '12:00', memo: '', payment: '카드', cardBilling: false, toAccount: '', isLoan: false, creditCardBilling: false, loanId: '', daysElapsed: '', installmentMonths: '' })
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const [showYMPicker, setShowYMPicker] = useState(false)
  const [showCardSelector, setShowCardSelector] = useState(false)
  const [showAccountSelector, setShowAccountSelector] = useState(false)
  // ── Ledger motion state ──────────────────────────
  const [formSaveState, setFormSaveState] = useState(null) // null | 'loading' | 'success'
  const submittingRef = useRef(false) // 동기 가드: 연타 시 중복 저장 방지
  const [formBtnPressed, setFormBtnPressed] = useState(false)
  const [deleteConfirmTxnId, setDeleteConfirmTxnId] = useState(null)
  const [txnExitId, setTxnExitId] = useState(null)
  const [deletedTxn, setDeletedTxn] = useState(null)
  const [txnUndoSnackbar, setTxnUndoSnackbar] = useState(false)
  const txnUndoTimerRef = useRef(null)
  const [newTxnId, setNewTxnId] = useState(null)
  // ────────────────────────────────────────────────
  const [userAccountsList, setUserAccountsList] = useState([])

  // ── 검색 & 숨기기 state ─────────────────────────────
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState(null)
  const [showHiddenView, setShowHiddenView] = useState(false)
  // ────────────────────────────────────────────────────

  // ── 선택 모드 state ──────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const longPressTimer = useRef(null)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergeTitle, setMergeTitle] = useState('')
  const [expandedMergeId, setExpandedMergeId] = useState(null)
  const [selectedSubId, setSelectedSubId] = useState(null)
  const [mergeUndoData, setMergeUndoData] = useState(null)
  const [mergeUndoSnackbar, setMergeUndoSnackbar] = useState(false)
  const mergeUndoTimerRef = useRef(null)
  // ────────────────────────────────────────────────────

  useEffect(() => {
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (isDemo) {
      try {
        const allTxns = []
        let demoMonths = []
        try { demoMonths = JSON.parse(localStorage.getItem('moa_demo_months') || '[]') } catch { demoMonths = [] }
        demoMonths.forEach(m => {
          const t = localStorage.getItem(`moa_txns_${m}`)
          if (t) allTxns.push(...JSON.parse(t))
        })
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTransactions(allTxns)
      } catch { /* ignore */ }
      try {
        const a = localStorage.getItem('moa_accounts')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (a) setUserAccountsList(JSON.parse(a).map(x => x.name))
      } catch { /* ignore */ }
      return
    }
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) {
        // 세션 복원이 아직 안 끝난 상태에서 첫 콜백이 null로 먼저 올 수 있다 —
        // 실제로 로그아웃된 게 맞는지 authStateReady()로 한 번 더 확인한다.
        await auth.authStateReady()
        u = auth.currentUser
      }
      if (!u) { navigate('/auth', { replace: true }); return }
      setUser(u)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    fetchTransactions()
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        const accounts = data.accounts ? data.accounts.map(a => a.name).filter(Boolean) : []
        setUserAccountsList(accounts)
        setUserPayments(['현금'])
      }
    }).catch(err => {
      console.error('[Ledger] 계좌 정보 로딩 실패', err)
      setLoadError('계좌 정보를 불러오지 못했어요.')
    })
  }, [user])

  async function fetchTransactions() {
    try {
      const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), orderBy('date', 'desc'))
      const snap = await getDocs(q)
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('[Ledger] 거래내역 로딩 실패', err)
      setLoadError('거래내역을 불러오지 못했어요.')
    }
  }

  const getWeekRange = () => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    const start = getWeekStart(base, weekStartDay)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start: toDateStr(start), end: toDateStr(end) }
  }

  const weekRange = getWeekRange()

  const formatWeekLabel = () => {
    const { start, end } = weekRange
    const s = new Date(start), e = new Date(end)
    return `${s.getMonth()+1}/${s.getDate()} ~ ${e.getMonth()+1}/${e.getDate()}`
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }

  const getFiltered = () => {
    let filtered = [...transactions].filter(t => !t.mergedInto && !t.isHidden)
    if (period === '주간') {
      filtered = filtered.filter(t => t.date >= weekRange.start && t.date <= weekRange.end)
    } else if (period === '월간') {
      const monthStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`
      filtered = filtered.filter(t => t.date?.startsWith(monthStr))
    } else if (period === '직접' && customStart && customEnd) {
      filtered = filtered.filter(t => t.date >= customStart && t.date <= customEnd)
    }
    if (tab === '소비') filtered = filtered.filter(t => t.type === 'expense')
    if (tab === '수입') filtered = filtered.filter(t => t.type === 'income')
    if (tab === '이체') filtered = filtered.filter(t => t.type === 'transfer')
    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.memo?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      )
    }
    if (searchCategory) {
      filtered = filtered.filter(t => t.category === searchCategory)
    }
    filtered.sort((a, b) => {
      const aKey = `${a.date} ${a.time || '00:00'}`
      const bKey = `${b.date} ${b.time || '00:00'}`
      return sortOrder === 'desc' ? bKey.localeCompare(aKey) : aKey.localeCompare(bKey)
    })
    return filtered
  }

  const autoUpdateUtility = async (title, amount, date) => {
    const UTILITY_KEYWORDS = ['관리비', '수도세', '전기세', '가스비']
    const matched = UTILITY_KEYWORDS.find(k => title.includes(k))
    if (!matched || !user) return
    const d = new Date(date)
    let year = d.getFullYear(), month = d.getMonth() + 1
    const monthMatch = title.match(/(\d{1,2})월/)
    if (monthMatch) {
      const mentioned = parseInt(monthMatch[1])
      if (mentioned >= 1 && mentioned <= 12) {
        if (month === 1 && mentioned === 12) year = year - 1
        month = mentioned
      }
    }
    const snap = await getDoc(doc(db, 'users', user.uid))
    const utilities = snap.exists() && snap.data().utilities ? snap.data().utilities : []
    const existing = utilities.find(u => u.type === matched && u.year === year && u.month === month)
    const updated = existing
      ? utilities.map(u => u.type === matched && u.year === year && u.month === month ? { ...u, amount: Number(amount) } : u)
      : [...utilities, { id: Date.now(), type: matched, year, month, amount: Number(amount) }]
    await setDoc(doc(db, 'users', user.uid), { utilities: updated }, { merge: true })
    localStorage.setItem('moa_utilities', JSON.stringify(updated))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.amount) { haptic.warning(); return }
    // 이미 저장이 진행 중이면 무시 (추가하기 버튼 연타로 인한 중복 생성 방지)
    if (submittingRef.current) return
    submittingRef.current = true
    haptic.light()
    setFormBtnPressed(true)
    setTimeout(() => setFormBtnPressed(false), 80)

    const loadingTimer = setTimeout(() => setFormSaveState('loading'), 300)
    try {
      const monthDate = new Date(form.date)
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,'0')}`
      const isInstallmentEligible = form.type === 'expense' && userCardsList.some(c => c.name === form.payment && c.cardType === 'credit')
      const installmentMonths = isInstallmentEligible && form.installmentMonths ? Number(form.installmentMonths) : null
      const data = { ...form, amount: Number(form.amount), uid: user.uid, month: monthStr, createdAt: new Date().toISOString(), installmentMonths }
      let savedId
      if (editItem) {
        await updateDoc(doc(db, 'transactions', editItem.id), data)
        savedId = editItem.id
      } else {
        const ref = await addDoc(collection(db, 'transactions'), data)
        savedId = ref.id
      }
      if (form.type === 'expense') await autoUpdateUtility(form.title, form.amount, form.date)

      // 합산 내역의 세부 항목 수정 시 부모 합산 내역 재계산
      if (editItem) {
        const mergedParent = transactions.find(tx => tx.isMerged && (tx.mergedItems || []).some(mi => mi.id === editItem.id))
        if (mergedParent) {
          const updatedMergedItems = mergedParent.mergedItems.map(mi =>
            mi.id === editItem.id
              ? { ...mi, title: form.title, amount: Number(form.amount), type: form.type, category: form.category, date: form.date, time: form.time }
              : mi
          )
          let net = 0
          for (const mi of updatedMergedItems) {
            if (mi.type === 'income') net += mi.amount
            else if (mi.type === 'expense') net -= mi.amount
          }
          let newType, newAmount
          if (net > 0) { newType = 'income'; newAmount = net }
          else if (net < 0) { newType = 'expense'; newAmount = Math.abs(net) }
          else { newType = 'excluded'; newAmount = 0 }
          const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
          if (!isDemo && user) {
            await updateDoc(doc(db, 'transactions', mergedParent.id), { mergedItems: updatedMergedItems, type: newType, amount: newAmount })
          }
        }
      }

      // 대출 상환 연동: 트랜잭션에 isLoan/loanId/daysElapsed가 저장되므로
      // MY 대출 페이지가 Firestore 트랜잭션을 직접 읽어 상환 내역을 표시합니다.
      clearTimeout(loadingTimer)
      setFormSaveState('success')
      haptic.success()
      await new Promise(r => setTimeout(r, 500))
      setFormSaveState(null)
      setShowForm(false)
      setEditItem(null)
      setForm({ type: 'expense', title: '', amount: '', category: categories.expense[0] || '기타', date: today(), time: '12:00', memo: '', payment: '카드', cardBilling: false, toAccount: '', isLoan: false, creditCardBilling: false, loanId: '', daysElapsed: '', installmentMonths: '' })
      if (savedId && !editItem) setNewTxnId(savedId)
      await fetchTransactions()
      setTimeout(() => setNewTxnId(null), 1000)
    } catch {
      clearTimeout(loadingTimer)
      setFormSaveState(null)
      haptic.warning()
      alert('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      submittingRef.current = false
    }
  }

  const handleDelete = (id) => {
    setDeleteConfirmTxnId(id)
    setSwipedId(null)
  }

  const confirmDeleteTxn = async (id) => {
    haptic.light()
    setDeleteConfirmTxnId(null)
    const txn = transactions.find(t => t.id === id)
    setTxnExitId(id)
    await new Promise(r => setTimeout(r, 250))
    await deleteDoc(doc(db, 'transactions', id))
    setTransactions(prev => prev.filter(t => t.id !== id))
    setSelectedId(null)
    setTxnExitId(null)
    setDeletedTxn(txn)
    if (txnUndoTimerRef.current) clearTimeout(txnUndoTimerRef.current)
    setTxnUndoSnackbar(true)
    txnUndoTimerRef.current = setTimeout(() => { setTxnUndoSnackbar(false); setDeletedTxn(null) }, 5000)
  }

  const handleUndoTxn = async () => {
    if (!deletedTxn) return
    haptic.success()
    if (txnUndoTimerRef.current) clearTimeout(txnUndoTimerRef.current)
    setTxnUndoSnackbar(false)
    // eslint-disable-next-line no-unused-vars
    const { id: _id, ...data } = deletedTxn
    const ref = await addDoc(collection(db, 'transactions'), data)
    const restoredId = ref.id
    setTransactions(prev => [{ ...data, id: restoredId }, ...prev])
    setNewTxnId(restoredId)
    setTimeout(() => setNewTxnId(null), 800)
    setDeletedTxn(null)
  }

  const handleEdit = (t) => {
    setEditItem(t)
    setForm({ type: t.type, title: t.title, amount: String(t.amount),
      category: t.category || (t.type === 'transfer' ? '이체' : '기타'),
      date: t.date, time: t.time || '12:00', memo: t.memo || '',
      payment: t.payment || '카드', cardBilling: t.cardBilling || false, isLoan: t.isLoan || false,
      creditCardBilling: t.creditCardBilling || false, toAccount: t.toAccount || '',
      loanId: t.loanId || '', daysElapsed: t.daysElapsed != null ? String(t.daysElapsed) : '',
      installmentMonths: t.installmentMonths ? String(t.installmentMonths) : '' })
    setShowForm(true); setSelectedId(null)
  }

  const handleItemTouchStart = (e, t) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    if (selectionMode) return
    longPressTimer.current = setTimeout(() => {
      haptic.light()
      setSelectionMode(true)
      setSelectedIds(new Set([t.id]))
      setSwipedId(null)
      longPressTimer.current = null
    }, 500)
  }
  const handleItemTouchMove = (e) => {
    if (longPressTimer.current) {
      const dx = Math.abs(e.touches[0].clientX - (touchStartX.current || 0))
      const dy = Math.abs(e.touches[0].clientY - (touchStartY.current || 0))
      if (dx > 8 || dy > 8) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    }
  }
  const handleItemTouchEnd = (e, id) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    if (!selectionMode) {
      const dx = e.changedTouches[0].clientX - (touchStartX.current || 0)
      if (dx < -60) setSwipedId(id)
      else if (dx > 30) setSwipedId(null)
    }
  }

  // ── 숨기기 핸들러 ────────────────────────────────────
  const handleHide = async (id) => {
    haptic.light()
    setSelectedId(null)
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (!isDemo && user) await updateDoc(doc(db, 'transactions', id), { isHidden: true })
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, isHidden: true } : t))
  }
  const handleUnhide = async (id) => {
    haptic.light()
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (!isDemo && user) await updateDoc(doc(db, 'transactions', id), { isHidden: null })
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, isHidden: null } : t))
  }
  // ────────────────────────────────────────────────────

  // ── 선택 모드 핸들러 ─────────────────────────────────
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()) }
  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const getSelectedTxns = () => filtered.filter(t => selectedIds.has(t.id))
  const getMergedNet = () => {
    let net = 0
    for (const t of getSelectedTxns()) {
      if (t.type === 'income') net += t.amount
      else if (t.type === 'expense') net -= t.amount
    }
    return net
  }
  const handleMerge = async () => {
    const selectedTxns = getSelectedTxns()
    if (selectedTxns.length < 2) return
    const title = mergeTitle.trim() || `합산 내역 (${selectedTxns.length}건)`
    const net = getMergedNet()
    let type, amount
    if (net > 0) { type = 'income'; amount = net }
    else if (net < 0) { type = 'expense'; amount = Math.abs(net) }
    else { type = 'excluded'; amount = 0 }
    const sortedItems = [...selectedTxns].sort((a, b) => b.date.localeCompare(a.date))
    const date = sortedItems[0].date
    const monthDate = new Date(date)
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,'0')}`
    const mergedData = {
      uid: user?.uid,
      isMerged: true,
      title,
      mergedItems: selectedTxns.map(t => ({ id: t.id, title: t.title, amount: t.amount, type: t.type, category: t.category, date: t.date, time: t.time })),
      type,
      amount,
      date,
      month,
      category: '기타',
      payment: '',
      time: '12:00',
      createdAt: new Date().toISOString()
    }
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    let mergedId
    const originalIds = selectedTxns.map(t => t.id)
    if (!isDemo && user) {
      const ref = await addDoc(collection(db, 'transactions'), mergedData)
      mergedId = ref.id
      for (const t of selectedTxns) {
        await updateDoc(doc(db, 'transactions', t.id), { mergedInto: mergedId })
      }
    } else {
      mergedId = `merged_${Date.now()}`
    }
    setTransactions(prev => {
      const updated = prev.map(t => originalIds.includes(t.id) ? { ...t, mergedInto: mergedId } : t)
      return [...updated, { ...mergedData, id: mergedId }]
    })
    setMergeUndoData({ mergedId, originalIds })
    exitSelectionMode()
    setShowMergeModal(false)
    setMergeTitle('')
    haptic.success()
    if (mergeUndoTimerRef.current) clearTimeout(mergeUndoTimerRef.current)
    setMergeUndoSnackbar(true)
    mergeUndoTimerRef.current = setTimeout(() => { setMergeUndoSnackbar(false); setMergeUndoData(null) }, 5000)
  }
  const handleUndoMerge = async () => {
    if (!mergeUndoData) return
    const { mergedId, originalIds } = mergeUndoData
    haptic.success()
    if (mergeUndoTimerRef.current) clearTimeout(mergeUndoTimerRef.current)
    setMergeUndoSnackbar(false)
    const isDemo = localStorage.getItem('moa_demo_mode') === 'true'
    if (!isDemo && user) {
      await deleteDoc(doc(db, 'transactions', mergedId))
      for (const id of originalIds) {
        await updateDoc(doc(db, 'transactions', id), { mergedInto: null })
      }
    }
    setTransactions(prev => {
      const without = prev.filter(t => t.id !== mergedId)
      return without.map(t => originalIds.includes(t.id) ? { ...t, mergedInto: null } : t)
    })
    setMergeUndoData(null)
  }
  // ────────────────────────────────────────────────────

  const filtered = getFiltered()
  const hiddenTransactions = transactions.filter(t => !t.mergedInto && t.isHidden)
  const allSearchCategories = [...new Set([...categories.expense, ...categories.income])]

  // 신용카드 추적 방식에 따라 집계 제외 여부 판단
  const getCreditCard = (p) => userCardsList.find(c => c.name === p && c.cardType === 'credit')
  const isCreditExcluded = (t) => {
    if (t.cardBilling) {
      const card = getCreditCard(t.payment)
      return card?.creditTracking !== 'billing'
    }
    const card = getCreditCard(t.payment)
    return card?.creditTracking === 'billing'
  }
  const totalExpense = filtered.filter(t => t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const totalIncome = filtered.filter(t => t.type === 'income' && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
  const fmt = n => n.toLocaleString('ko-KR')

  const dateGroups = filtered.reduce((acc, t) => {
    const d = t.date || '날짜 없음'
    if (!acc[d]) acc[d] = []
    acc[d].push(t)
    return acc
  }, {})

  const sortedDates = Object.keys(dateGroups).sort((a, b) =>
    sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
  )

  // ── 세그먼트 버튼 공통 스타일 ──
  // eslint-disable-next-line no-unused-vars
  const segBtn = (active) => ({
    flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: active ? 700 : 500,
    background: active ? themeData.primary : 'transparent',
    color: active ? '#fff' : '#8B95A1',
    transition: 'all 0.2s',
  })

  return (
    <div style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} className={themeData.bgClass}>

      {loadError && (
        <div style={{ padding: '12px 20px 0' }}>
          <LoadError message={loadError} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={{ background: '#fff', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 0', borderBottom: '1px solid #F2F4F6' }}>

        {/* 제목 / 선택 모드 헤더 */}
        {selectionMode ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 2 }}>
            <button onClick={exitSelectionMode}
              style={{ background: 'none', border: 'none', fontSize: 15, color: '#191F28', cursor: 'pointer', fontWeight: 500, padding: '4px 0' }}>
              취소
            </button>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191F28' }}>{selectedIds.size}개 선택됨</p>
            <button onClick={() => {
              if (selectedIds.size === filtered.length) setSelectedIds(new Set())
              else setSelectedIds(new Set(filtered.map(t => t.id)))
            }} style={{ background: 'none', border: 'none', fontSize: 14, color: themeData.primary, cursor: 'pointer', fontWeight: 700, padding: '4px 0' }}>
              {selectedIds.size === filtered.length ? '전체 취소' : '전체 선택'}
            </button>
          </div>
        ) : showSearch ? (
          /* ── 검색 모드 헤더 ── */
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchCategory(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#191F28', flexShrink: 0 }}>
                <BackIcon />
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#F2F4F6', borderRadius: 14, padding: '0 14px', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="내역 검색..."
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '11px 0', fontSize: 15, outline: 'none', color: '#191F28' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B95A1', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
                )}
              </div>
            </div>
            {/* 카테고리 칩 */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <button onClick={() => setSearchCategory(null)}
                style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: searchCategory === null ? 700 : 500,
                  background: searchCategory === null ? themeData.primary : '#F2F4F6',
                  color: searchCategory === null ? '#fff' : '#8B95A1', transition: 'all 0.15s' }}>
                전체
              </button>
              {allSearchCategories.map(cat => (
                <button key={cat} onClick={() => setSearchCategory(searchCategory === cat ? null : cat)}
                  style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: searchCategory === cat ? 700 : 500,
                    background: searchCategory === cat ? themeData.primary : '#F2F4F6',
                    color: searchCategory === cat ? '#fff' : '#8B95A1', transition: 'all 0.15s' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#191F28' }}>가계부</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hiddenTransactions.length > 0 && (
                <button onClick={() => setShowHiddenView(true)}
                  style={{ padding: '6px 12px', borderRadius: 9999, border: 'none', background: '#F2F4F6', color: '#8B95A1', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  숨김 {hiddenTransactions.length}건
                </button>
              )}
              <button onClick={() => setShowSearch(true)}
                style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: '#F2F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B95A1' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 기간 탭 - 검색 모드엔 숨김 */}
        {showSearch ? null : <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['주간', '월간', '직접'].map(p => (
            <button key={p} onClick={() => { setPeriod(p); setWeekOffset(0) }}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: period === p ? themeData.primary : '#F2F4F6',
                color: period === p ? '#fff' : '#8B95A1',
                fontSize: 14, fontWeight: period === p ? 700 : 500,
                transition: 'all 0.2s' }}>{p}</button>
          ))}
        </div>}

        {/* 날짜 네비게이션 - 검색 모드엔 숨김 */}
        {!showSearch && period === '주간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: 16 }}>
            <button onClick={() => setWeekOffset(o => o-1)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>‹</button>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>{formatWeekLabel()}</p>
            <button onClick={() => setWeekOffset(o => o+1)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>›</button>
          </div>
        )}
        {!showSearch && period === '월간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>‹</button>
            <p onClick={() => setShowYMPicker(true)} style={{ fontSize: 16, fontWeight: 700, color: '#191F28', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {viewYear}년 {viewMonth + 1}월 <span style={{ fontSize: 13, color: '#8B95A1' }}>▾</span>
            </p>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8B95A1', padding: '0 4px', lineHeight: 1 }}>›</button>
          </div>
        )}
        {!showSearch && period === '직접' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none' }} />
            <span style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 13 }}>~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none' }} />
          </div>
        )}

        {/* 지출 / 수입 요약 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: '#FFF1F1', borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 4 }}>지출</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#FF5A5F' }}>-{fmt(totalExpense)}원</p>
          </div>
          <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 20, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 4 }}>수입</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#2ECC71' }}>+{fmt(totalIncome)}원</p>
          </div>
        </div>

        {/* 필터 탭 + 정렬 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['전체', '소비', '수입', '이체'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '7px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: tab === t ? '#191F28' : 'transparent',
                  color: tab === t ? '#fff' : '#8B95A1', fontSize: 14, fontWeight: tab === t ? 700 : 500,
                  transition: 'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            style={{ background: 'none', border: 'none', color: '#8B95A1', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
            {sortOrder === 'desc' ? '↓ 최신순' : '↑ 오래된순'}
          </button>
        </div>
      </div>

      {/* ── 선택 모드 힌트 배너 ── */}
      {selectionMode && (
        <div style={{ margin: '10px 24px 2px', background: `${themeData.primary}12`, borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={themeData.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          <p style={{ fontSize: 13, color: themeData.primary, fontWeight: 600 }}>합칠 내역을 선택하세요</p>
        </div>
      )}

      {/* ── 내역 리스트 ── */}
      <div style={{ padding: '8px 24px', paddingBottom: selectionMode ? 'calc(96px + env(safe-area-inset-bottom, 0px))' : undefined }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#8B95A1', fontSize: 15 }}>내역이 없어요</div>
        ) : (
          sortedDates.map(date => (
            <div key={date}>
              {/* 날짜 구분선 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 10px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1', whiteSpace: 'nowrap' }}>
                  {date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3')}
                </span>
                <div style={{ flex: 1, height: 1, background: '#F2F4F6' }} />
                <span style={{ fontSize: 12, whiteSpace: 'nowrap', display: 'flex', gap: 8, fontWeight: 600 }}>
                  {dateGroups[date].some(t => t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)) && (
                    <span style={{ color: '#FF5A5F' }}>-{dateGroups[date].filter(t => t.type === 'expense' && !isCreditExcluded(t) && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0).toLocaleString()}원</span>
                  )}
                  {(() => {
                    const grayAmt = dateGroups[date].filter(t => t.type === 'expense' && isCreditExcluded(t)).reduce((s, t) => s + t.amount, 0)
                    return grayAmt > 0 ? <span style={{ color: '#C9CDD4' }}>-{grayAmt.toLocaleString()}원</span> : null
                  })()}
                  {dateGroups[date].some(t => t.type === 'income' && (!showLoan || !t.isLoan)) && (
                    <span style={{ color: '#2ECC71' }}>+{dateGroups[date].filter(t => t.type === 'income' && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0).toLocaleString()}원</span>
                  )}
                </span>
              </div>

              {dateGroups[date].map(t => {
                const isMerged = !!t.isMerged
                const isSelected = selectedIds.has(t.id)
                const iconKey = t.type === 'transfer' ? 'transfer' : guessIconKey(t.category || '')
                const iconColor = t.type === 'transfer' ? '#888' : isMerged ? themeData.primary : getCategoryColor(t.category || '기타')
                const isExpanded = expandedMergeId === t.id

                // ── 합산 내역 아이템 ──────────────────────────
                if (isMerged) {
                  const amtColor = t.type === 'income' ? '#2ECC71' : t.type === 'expense' ? '#FF5A5F' : '#C9CDD4'
                  const amtPrefix = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''
                  const selBg = isSelected ? `${themeData.primary}15` : '#fff'
                  return (
                    <div key={t.id} style={{ borderRadius: 20, overflow: 'hidden', background: selBg, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 10,
                      border: isSelected ? `1.5px solid ${themeData.primary}` : '1.5px solid transparent',
                      transition: 'border-color 0.15s, background 0.15s' }}>
                      <div
                        onClick={() => {
                          if (selectionMode) { handleSelectItem(t.id) }
                          else { setExpandedMergeId(isExpanded ? null : t.id); setSelectedSubId(null) }
                        }}
                        onTouchStart={e => handleItemTouchStart(e, t)}
                        onTouchMove={handleItemTouchMove}
                        onTouchEnd={e => handleItemTouchEnd(e, t.id)}
                        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minHeight: 68 }}>
                        {/* 선택 체크박스 */}
                        {selectionMode && (
                          <div style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${isSelected ? themeData.primary : '#C9CDD4'}`, background: isSelected ? themeData.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                        )}
                        {/* 합산 아이콘 */}
                        <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: themeData.primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={themeData.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                            <span style={{ fontSize: 10, fontWeight: 600, color: themeData.primary, background: themeData.primary + '15', borderRadius: 9999, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0 }}>합산</span>
                          </div>
                          <p style={{ fontSize: 12, color: '#8B95A1' }}>{(t.mergedItems || []).length}건 묶음 {!selectionMode && (isExpanded ? '▲' : '▼')}</p>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, flexShrink: 0, color: amtColor }}>
                          {t.type === 'excluded' ? '0원 (미포함)' : `${amtPrefix}${fmt(t.amount)}원`}
                        </p>
                      </div>
                      {/* 합산 상세 내역 - 일반 내역 스타일 */}
                      {!selectionMode && isExpanded && (
                        <div style={{ borderTop: '1px solid #F2F4F6', padding: '10px 12px 12px', background: '#F7F8FA' }}>
                          {(t.mergedItems || []).map((item, idx) => {
                            const subKey = `${t.id}_${item.id || idx}`
                            const isSubSel = selectedSubId === subKey
                            const subIconKey = item.type === 'transfer' ? 'transfer' : guessIconKey(item.category || '')
                            const subIconColor = item.type === 'transfer' ? '#888' : getCategoryColor(item.category || '기타')
                            return (
                              <div key={subKey} style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', marginBottom: idx < t.mergedItems.length - 1 ? 8 : 0, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                                <div
                                  onClick={() => setSelectedSubId(isSubSel ? null : subKey)}
                                  style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minHeight: 60 }}>
                                  <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: subIconColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CatIcon cat={subIconKey} size={18} color={subIconColor} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.title}</p>
                                    <p style={{ fontSize: 12, color: '#8B95A1' }}>
                                      {item.time ? `${item.time} · ` : ''}{item.category || '-'}
                                    </p>
                                  </div>
                                  <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: item.type === 'income' ? '#2ECC71' : '#FF5A5F' }}>
                                    {item.type === 'income' ? '+' : '-'}{item.amount?.toLocaleString()}원
                                  </p>
                                </div>
                                {isSubSel && (
                                  <div style={{ borderTop: '1px solid #F2F4F6' }}>
                                    <button
                                      onClick={() => {
                                        const fullTxn = transactions.find(tx => tx.id === item.id)
                                        if (fullTxn) { handleEdit(fullTxn); setSelectedSubId(null) }
                                      }}
                                      style={{ width: '100%', padding: '13px', border: 'none', background: '#fff', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                      </svg>
                                      수정
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                // ── 일반 내역 아이템 ──────────────────────────
                return (
                  <div key={t.id} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden',
                    background: selectionMode && isSelected ? `${themeData.primary}12` : '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    border: selectionMode && isSelected ? `1.5px solid ${themeData.primary}` : '1.5px solid transparent',
                    marginBottom: txnExitId === t.id ? 0 : 10,
                    maxHeight: txnExitId === t.id ? 0 : 300,
                    opacity: txnExitId === t.id ? 0 : 1,
                    transition: txnExitId === t.id ? 'opacity 250ms ease, max-height 250ms ease, margin-bottom 250ms ease' : 'border-color 0.15s, background 0.15s',
                    animation: newTxnId === t.id ? 'fadeSlideUp 250ms ease forwards' : undefined }}>
                    {!selectionMode && swipedId === t.id && (
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 70, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() => handleDelete(t.id)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </div>
                    )}
                    <div
                      onTouchStart={e => handleItemTouchStart(e, t)}
                      onTouchMove={handleItemTouchMove}
                      onTouchEnd={e => handleItemTouchEnd(e, t.id)}
                      onClick={() => {
                        if (selectionMode) { handleSelectItem(t.id) }
                        else { setSelectedId(selectedId === t.id ? null : t.id); setSwipedId(null) }
                      }}
                      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: selectionMode ? 10 : 14,
                        background: t.creditCardBilling ? '#FFF6F6' : showLoan && t.isLoan ? (t.type === 'expense' ? '#FFF6F6' : '#F0FDF4') : (t.type === 'expense' && isCreditExcluded(t)) ? '#FAFAFA' : (selectionMode && isSelected) ? 'transparent' : '#fff',
                        transform: (!selectionMode && swipedId === t.id) ? 'translateX(-70px)' : 'translateX(0)',
                        transition: 'transform 0.25s ease', position: 'relative', zIndex: 1, cursor: 'pointer', minHeight: 68 }}>
                      {/* 선택 체크박스 */}
                      {selectionMode && (
                        <div style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${isSelected ? themeData.primary : '#C9CDD4'}`, background: isSelected ? themeData.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      )}
                      {/* 카테고리 아이콘 */}
                      <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: iconColor + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CatIcon cat={iconKey} size={20} color={iconColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                          {t.isAutoRegistered && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#8B95A1', background: '#F2F4F6', borderRadius: 9999, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>자동</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: '#8B95A1' }}>
                          {t.type === 'transfer'
                            ? `${t.time} · ${t.payment || '-'} → ${t.toAccount || '-'}`
                            : `${t.time} · ${t.category} · ${t.payment || '현금'}`}
                        </p>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 700, flexShrink: 0,
                        color: t.type === 'transfer' ? '#8B95A1' : t.creditCardBilling ? '#FF5A5F' : (t.type === 'expense' && isCreditExcluded(t)) ? '#C9CDD4' : (showLoan && t.isLoan) ? (t.type === 'expense' ? '#FFAEAE' : '#86EFAC') : t.type === 'expense' ? '#FF5A5F' : '#2ECC71' }}>
                        {t.type === 'transfer' ? '↔' : t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                      </p>
                    </div>

                    {/* 수정/숨기기/삭제 - 선택 모드가 아닐 때만 */}
                    {!selectionMode && selectedId === t.id && (
                      <div style={{ display: 'flex', borderTop: '1px solid #F2F4F6' }}>
                        <button onClick={() => handleEdit(t)}
                          style={{ flex: 1, padding: '14px', border: 'none', background: '#fff', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          수정
                        </button>
                        <div style={{ width: 1, background: '#F2F4F6' }} />
                        <button onClick={() => handleHide(t.id)}
                          style={{ flex: 1, padding: '14px', border: 'none', background: '#fff', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                          숨기기
                        </button>
                        <div style={{ width: 1, background: '#F2F4F6' }} />
                        <button onClick={() => handleDelete(t.id)}
                          style={{ flex: 1, padding: '14px', border: 'none', background: '#fff', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* ── FAB (선택 모드 아닐 때만) ── */}
      {!selectionMode && (
        <button onClick={() => { setEditItem(null); setForm({ type: 'expense', title: '', amount: '', category: categories.expense[0] || '기타', date: today(), time: '12:00', memo: '', payment: '카드', cardBilling: false, toAccount: '', isLoan: false, creditCardBilling: false, loanId: '', daysElapsed: '', installmentMonths: '' }); setShowForm(true) }}
          style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', right: 20, width: 56, height: 56, borderRadius: 24, background: themeData.primary, border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 100, boxShadow: `0 4px 20px ${themeData.primary}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      )}

      {/* ── 선택 모드 하단 액션 바 ── */}
      {selectionMode && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F2F4F6', padding: '14px 20px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', zIndex: 200, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 2 }}>선택 합산</p>
            {(() => {
              const net = getMergedNet()
              return (
                <p style={{ fontSize: 18, fontWeight: 700, color: net < 0 ? '#FF5A5F' : net > 0 ? '#2ECC71' : '#191F28' }}>
                  {net > 0 ? '+' : ''}{net.toLocaleString()}원
                </p>
              )
            })()}
          </div>
          <div style={{ flex: 1 }}>
            <button
              onClick={() => selectedIds.size >= 2 && setShowMergeModal(true)}
              style={{ width: '100%', height: 52, borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 700, cursor: selectedIds.size >= 2 ? 'pointer' : 'not-allowed',
                background: selectedIds.size >= 2 ? themeData.primary : '#E5E8EB',
                color: selectedIds.size >= 2 ? '#fff' : '#8B95A1',
                transition: 'all 0.2s' }}>
              {selectedIds.size < 2 ? '2개 이상 선택하세요' : `합치기 (${selectedIds.size}개)`}
            </button>
          </div>
        </div>
      )}

      {/* ── 내역 추가/수정 폼 ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#F7F8FA', zIndex: 200, overflowY: 'auto', overflowX: 'hidden',
          animation: 'slideInUp 400ms cubic-bezier(0.25,0.46,0.45,0.94) forwards' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', background: '#fff', borderBottom: '1px solid #F2F4F6', position: 'sticky', top: 0, zIndex: 10 }}>
            <button onClick={() => { setShowForm(false); setEditItem(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, padding: 4, color: '#191F28' }}><BackIcon /></button>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{editItem ? '내역 수정' : '내역 추가'}</p>
          </div>

          <div style={{ padding: '20px 24px 80px' }}>
            {/* 지출/수입/이체 탭 */}
            <div style={{ display: 'flex', background: '#E5E8EB', borderRadius: 16, padding: 4, marginBottom: 20 }}>
              {[
                { type: 'expense', label: '지출' },
                { type: 'income', label: '수입' },
                { type: 'transfer', label: '↔ 이체' }
              ].map(({ type, label }) => (
                <button key={type}
                  onClick={() => setForm(f => ({ ...f, type, category: type === 'expense' ? categories.expense[0] : type === 'income' ? categories.income[0] : '이체', cardBilling: false, toAccount: '' }))}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: form.type === type ? 700 : 500,
                    background: form.type === type ? (type === 'expense' ? '#FF5A5F' : type === 'income' ? '#2ECC71' : themeData.primary) : 'transparent',
                    color: form.type === type ? '#fff' : '#8B95A1',
                    transition: 'all 0.2s' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* 금액 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>금액</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 38, fontWeight: 700,
                    color: form.type === 'expense' ? '#FF5A5F' : form.type === 'income' ? '#2ECC71' : '#191F28',
                    background: 'transparent', letterSpacing: '-1px' }} />
                <span style={{ fontSize: 22, fontWeight: 600, color: '#8B95A1' }}>원</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {[1000, 5000, 10000, 50000].map(amt => (
                  <button key={amt} onClick={() => setForm(f => ({ ...f, amount: String(Number(f.amount || 0) + amt) }))}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: '#F2F4F6', color: '#191F28', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>제목</p>
              <input style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '0', fontSize: 16 }}
                placeholder={form.type === 'income' ? '어디서 받았나요?' : form.type === 'transfer' ? '이체 내용을 입력하세요' : '어디에 썼나요?'} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            {/* 카테고리 */}
            {form.type !== 'transfer' && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 14, fontWeight: 600 }}>카테고리</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {categories[form.type === 'expense' ? 'expense' : 'income'].map(cat => (
                    <button key={cat} onClick={() => { haptic.selection(); setForm(f => ({ ...f, category: cat })) }}
                      style={{ padding: '12px 4px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.category === cat ? themeData.primary : '#F2F4F6',
                        color: form.category === cat ? '#fff' : '#191F28',
                        fontWeight: form.category === cat ? 700 : 500, textAlign: 'center',
                        transform: form.category === cat ? 'scale(1)' : 'scale(1)',
                        transition: 'all 0.15s, transform 120ms cubic-bezier(0.34,1.56,0.64,1)' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 이체 정보 */}
            {form.type === 'transfer' && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>이체 정보</p>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>출금 계좌</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  <button onClick={() => setForm(f => ({ ...f, payment: '현금' }))}
                    style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                      background: form.payment === '현금' ? themeData.primary : '#F2F4F6',
                      color: form.payment === '현금' ? '#fff' : '#8B95A1' }}>현금</button>
                  {userAccountsList.length > 0 ? userAccountsList.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, payment: a }))}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.payment === a ? themeData.primary : '#F2F4F6',
                        color: form.payment === a ? '#fff' : '#8B95A1' }}>{a}</button>
                  )) : (
                    <input style={inputStyle} placeholder="출금 계좌" value={form.payment === '카드' ? '' : form.payment}
                      onChange={e => setForm(f => ({ ...f, payment: e.target.value }))} />
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 8, fontWeight: 600 }}>입금 계좌</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button onClick={() => setForm(f => ({ ...f, toAccount: '현금' }))}
                    style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                      background: form.toAccount === '현금' ? themeData.primary : '#F2F4F6',
                      color: form.toAccount === '현금' ? '#fff' : '#8B95A1' }}>현금</button>
                  {userAccountsList.length > 0 ? userAccountsList.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, toAccount: a }))}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.toAccount === a ? themeData.primary : '#F2F4F6',
                        color: form.toAccount === a ? '#fff' : '#8B95A1' }}>{a}</button>
                  )) : (
                    <input style={inputStyle} placeholder="입금 계좌" value={form.toAccount}
                      onChange={e => setForm(f => ({ ...f, toAccount: e.target.value }))} />
                  )}
                </div>
              </div>
            )}

            {/* 결제수단 */}
            {form.type !== 'transfer' && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>결제수단</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {userPayments.map(p => (
                    <button key={p} onClick={() => { setForm(f => ({ ...f, payment: p })); setShowCardSelector(false); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.payment === p ? themeData.primary : '#f0f0f0',
                        color: form.payment === p ? '#fff' : '#666' }}>{p}</button>
                  ))}
                  {userAccountsList.length > 0 ? (
                    <button onClick={() => { setShowAccountSelector(s => !s); setShowCardSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: userAccountsList.some(a => a === form.payment) ? themeData.primary : '#f0f0f0',
                        color: userAccountsList.some(a => a === form.payment) ? '#fff' : '#666' }}>
                      {userAccountsList.some(a => a === form.payment) ? `이체 (${form.payment})` : '이체 ▾'}
                    </button>
                  ) : (
                    <button onClick={() => { setForm(f => ({ ...f, payment: '계좌이체' })); setShowCardSelector(false); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.payment === '계좌이체' ? themeData.primary : '#f0f0f0',
                        color: form.payment === '계좌이체' ? '#fff' : '#666' }}>계좌이체</button>
                  )}
                  {userCardsList.length > 0 ? (
                    <button onClick={() => { setShowCardSelector(s => !s); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: userCardsList.some(c => c.name === form.payment) ? themeData.primary : '#f0f0f0',
                        color: userCardsList.some(c => c.name === form.payment) ? '#fff' : '#666' }}>
                      {userCardsList.some(c => c.name === form.payment) ? `카드 (${form.payment})` : '카드 ▾'}
                    </button>
                  ) : (
                    <button onClick={() => { setForm(f => ({ ...f, payment: '카드' })); setShowCardSelector(false); setShowAccountSelector(false) }}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.payment === '카드' ? themeData.primary : '#f0f0f0',
                        color: form.payment === '카드' ? '#fff' : '#666' }}>카드</button>
                  )}
                </div>

                {showAccountSelector && userAccountsList.length > 0 && (
                  <div style={{ background: '#f8f8f8', borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                    <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>어떤 계좌에서 이체했나요?</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {userAccountsList.map(account => (
                        <button key={account} onClick={() => { setForm(f => ({ ...f, payment: account })); setShowAccountSelector(false) }}
                          style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${form.payment === account ? 'transparent' : '#e8e8e8'}`, cursor: 'pointer', fontSize: 13,
                            background: form.payment === account ? themeData.primary : '#fff',
                            color: form.payment === account ? '#fff' : '#555' }}>{account}</button>
                      ))}
                    </div>
                  </div>
                )}

                {showCardSelector && userCardsList.length > 0 && (
                  <div style={{ background: '#f8f8f8', borderRadius: 16, padding: '10px 12px', marginBottom: 4 }}>
                    <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>어떤 카드로 결제했나요?</p>
                    {userCardsList.some(c => c.cardType === 'credit') && (
                      <>
                        <p style={{ fontSize: 10, color: '#bbb', marginBottom: 6, fontWeight: 600 }}>신용카드</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                          {userCardsList.filter(c => c.cardType === 'credit').map(card => (
                            <button key={card.id || card.name} onClick={() => { setForm(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}
                              style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${form.payment === card.name ? 'transparent' : '#e8e8e8'}`, cursor: 'pointer', fontSize: 13,
                                background: form.payment === card.name ? themeData.primary : '#fff',
                                color: form.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                          ))}
                        </div>
                      </>
                    )}
                    {userCardsList.some(c => c.cardType === 'debit') && (
                      <>
                        {userCardsList.some(c => c.cardType === 'credit') && <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0 10px' }} />}
                        <p style={{ fontSize: 10, color: '#bbb', marginBottom: 6, fontWeight: 600 }}>체크카드</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                          {userCardsList.filter(c => c.cardType === 'debit').map(card => (
                            <button key={card.id || card.name} onClick={() => { setForm(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}
                              style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${form.payment === card.name ? 'transparent' : '#e8e8e8'}`, cursor: 'pointer', fontSize: 13,
                                background: form.payment === card.name ? themeData.primary : '#fff',
                                color: form.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                          ))}
                        </div>
                      </>
                    )}
                    {userCardsList.some(c => !c.cardType) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {userCardsList.filter(c => !c.cardType).map(card => (
                          <button key={card.id || card.name} onClick={() => { setForm(f => ({ ...f, payment: card.name })); setShowCardSelector(false) }}
                            style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${form.payment === card.name ? 'transparent' : '#e8e8e8'}`, cursor: 'pointer', fontSize: 13,
                              background: form.payment === card.name ? themeData.primary : '#fff',
                              color: form.payment === card.name ? '#fff' : '#555' }}>{card.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* 할부 개월 — 신용카드 결제 시에만 노출 */}
            {form.type === 'expense' && userCardsList.some(c => c.name === form.payment && c.cardType === 'credit') && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>할부 개월</p>
                <select value={form.installmentMonths || ''} onChange={e => setForm(f => ({ ...f, installmentMonths: e.target.value }))}
                  style={inputStyle}>
                  <option value="">일시불</option>
                  {Array.from({ length: 35 }, (_, i) => i + 2).map(m => (
                    <option key={m} value={m}>{m}개월</option>
                  ))}
                </select>
              </div>
            )}

            {/* 신용카드 대금 납부 — 단독 토글 박스 */}
            {form.type === 'expense' && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>신용카드 대금 납부</p>
                  <p style={{ fontSize: 13, color: '#8B95A1' }}>카드 실적 제외</p>
                </div>
                <Toggle on={form.creditCardBilling || false} onChange={val => setForm(f => ({ ...f, creditCardBilling: val }))} />
              </div>
            )}

            {/* 체크카드 소액 신용 대금 납부 */}
            {form.type === 'expense' && showCardBilling && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>체크카드 소액 신용 대금 납부</p>
                  <p style={{ fontSize: 13, color: '#8B95A1' }}>지출 합계에서 제외</p>
                </div>
                <Toggle on={form.cardBilling || false} onChange={val => setForm(f => ({ ...f, cardBilling: val }))} />
              </div>
            )}

            {/* 대출 / 상환 - 수입 */}
            {form.type === 'income' && showLoan && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>대출 / 상환</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>합계에서 제외</p>
                  </div>
                  <Toggle on={form.isLoan || false} onChange={val => setForm(f => ({ ...f, isLoan: val }))} />
                </div>
              </div>
            )}

            {/* 대출 / 상환 - 지출 */}
            {form.type === 'expense' && showLoan && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 3 }}>대출 / 상환</p>
                    <p style={{ fontSize: 13, color: '#8B95A1' }}>합계에서 제외</p>
                  </div>
                  <Toggle on={form.isLoan || false} onChange={val => setForm(f => ({ ...f, isLoan: val, loanId: '', daysElapsed: '' }))} />
                </div>
                {form.isLoan && loans.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1', marginBottom: 8 }}>어떤 대출의 상환인가요?</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {loans.map(loan => {
                        const sel = form.loanId === String(loan.id)
                        return (
                          <button key={loan.id} onClick={() => setForm(f => ({ ...f, loanId: String(loan.id) }))}
                            style={{ padding: '7px 14px', borderRadius: 12, border: `1.5px solid ${sel ? themeData.primary : '#E5E8EB'}`, background: sel ? `${themeData.primary}15` : '#F7F8FA', color: sel ? themeData.primary : '#8B95A1', fontSize: 13, fontWeight: sel ? 700 : 500, cursor: 'pointer' }}>
                            {loan.name}
                          </button>
                        )
                      })}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#8B95A1', marginBottom: 8 }}>경과일수 <span style={{ fontWeight: 400 }}>(선택)</span></p>
                    <input type="number" placeholder="직전 상환일로부터 경과된 일수"
                      value={form.daysElapsed} onChange={e => setForm(f => ({ ...f, daysElapsed: e.target.value }))}
                      style={{ ...inputStyle }} />
                  </div>
                )}
                {form.isLoan && loans.length === 0 && (
                  <p style={{ fontSize: 13, color: '#8B95A1', marginTop: 10 }}>MY에서 대출을 먼저 등록해주세요</p>
                )}
              </div>
            )}

            {/* 날짜 및 시간 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>날짜 및 시간</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ padding: '14px 0', borderRadius: 12, background: '#F2F4F6', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#191F28' }}>
                    {form.date ? form.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1. $2. $3.') : '날짜'}
                  </div>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ padding: '14px 0', borderRadius: 12, background: '#F2F4F6', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#191F28' }}>
                    {formatTime(form.time)}
                  </div>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>메모 (선택)</p>
              <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="메모를 입력하세요"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: '#191F28', background: 'transparent', resize: 'none', height: 80, lineHeight: 1.6, boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleSubmit}
              disabled={!!formSaveState}
              style={{ width: '100%', height: 56, borderRadius: 16,
                background: formSaveState === 'success' ? '#22c55e' : (form.type === 'expense' ? '#FF5A5F' : form.type === 'income' ? '#2ECC71' : themeData.primary),
                color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: formSaveState ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.2px', transition: 'background 200ms, transform 80ms ease-out',
                transform: formBtnPressed ? 'scale(0.97)' : 'scale(1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {formSaveState === 'loading' ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />
                  저장 중...
                </>
              ) : formSaveState === 'success' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  저장 완료
                </>
              ) : (
                editItem ? '수정 완료' : '추가하기'
              )}
            </button>
          </div>
        </div>
      )}

      {showYMPicker && (
        <YearMonthPicker
          viewYear={viewYear}
          viewMonth={viewMonth}
          onConfirm={(y, m) => { setViewYear(y); setViewMonth(m) }}
          onClose={() => setShowYMPicker(false)}
        />
      )}

      {/* ── 숨긴 내역 보기 ── */}
      {showHiddenView && (
        <div style={{ position: 'fixed', inset: 0, background: '#F7F8FA', zIndex: 200, overflowY: 'auto', overflowX: 'hidden',
          animation: 'slideInUp 400ms cubic-bezier(0.25,0.46,0.45,0.94) forwards' }}>
          <div style={{ background: '#fff', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', borderBottom: '1px solid #F2F4F6', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setShowHiddenView(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, padding: 4, color: '#191F28' }}><BackIcon /></button>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>숨긴 내역</p>
              <span style={{ marginLeft: 8, fontSize: 13, color: '#8B95A1', fontWeight: 500 }}>{hiddenTransactions.length}건</span>
            </div>
          </div>

          <div style={{ padding: '16px 24px 80px' }}>
            {hiddenTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: '#8B95A1', fontSize: 15 }}>숨긴 내역이 없어요</div>
            ) : (
              hiddenTransactions
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(t => {
                  const iconKey = t.type === 'transfer' ? 'transfer' : guessIconKey(t.category || '')
                  const iconColor = t.type === 'transfer' ? '#888' : getCategoryColor(t.category || '기타')
                  return (
                    <div key={t.id} style={{ borderRadius: 20, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 10 }}>
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, minHeight: 68 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: iconColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon cat={iconKey} size={20} color={iconColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{t.title}</p>
                          <p style={{ fontSize: 12, color: '#8B95A1' }}>
                            {t.date} · {t.type === 'transfer' ? `${t.payment} → ${t.toAccount}` : `${t.category} · ${t.payment || '현금'}`}
                          </p>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, flexShrink: 0,
                          color: t.type === 'transfer' ? '#8B95A1' : t.type === 'income' ? '#2ECC71' : '#FF5A5F' }}>
                          {t.type === 'transfer' ? '↔' : t.type === 'income' ? '+' : '-'}{fmt(t.amount)}원
                        </p>
                      </div>
                      <div style={{ borderTop: '1px solid #F2F4F6' }}>
                        <button onClick={() => handleUnhide(t.id)}
                          style={{ width: '100%', padding: '13px', border: 'none', background: '#fff', color: themeData.primary, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          숨김 해제
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      )}

      {/* ── 합치기 모달 ── */}
      {showMergeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowMergeModal(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '28px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            zIndex: 1, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E8EB', margin: '0 auto 24px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 20 }}>내역 합치기</p>

            {/* 선택 항목 목록 */}
            <div style={{ background: '#F7F8FA', borderRadius: 16, padding: '4px 16px', marginBottom: 20 }}>
              {getSelectedTxns().map((t, idx) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0',
                  borderBottom: idx < getSelectedTxns().length - 1 ? '1px solid #EDEEF0' : 'none' }}>
                  <p style={{ fontSize: 14, color: '#191F28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 12 }}>{t.title}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: t.type === 'income' ? '#2ECC71' : '#FF5A5F' }}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}원
                  </p>
                </div>
              ))}
              {(() => {
                const net = getMergedNet()
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0 2px' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>합산</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: net < 0 ? '#FF5A5F' : net > 0 ? '#2ECC71' : '#8B95A1' }}>
                      {net > 0 ? '+' : ''}{net.toLocaleString()}원{net === 0 ? ' (미포함)' : ''}
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* 합쳐질 이름 입력 */}
            <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 10, fontWeight: 600 }}>합쳐질 내역 이름</p>
            <input
              value={mergeTitle}
              onChange={e => setMergeTitle(e.target.value)}
              placeholder={`합산 내역 (${selectedIds.size}건)`}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: `1.5px solid ${themeData.primary}40`, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#191F28', marginBottom: 24 }}
            />

            <button onClick={handleMerge}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none', background: themeData.primary, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              확인
            </button>
          </div>
        </div>
      )}

      {/* ── 내역 삭제 확인 Bottom Sheet ── */}
      {deleteConfirmTxnId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setDeleteConfirmTxnId(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '28px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', zIndex: 1 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E8EB', margin: '0 auto 24px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 10 }}>내역을 삭제할까요?</p>
            <p style={{ fontSize: 14, color: '#8B95A1', lineHeight: 1.65, marginBottom: 28 }}>삭제 후 5초 이내에 되돌릴 수 있어요.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirmTxnId(null)}
                style={{ flex: 1, height: 52, borderRadius: 16, border: 'none', background: '#F2F4F6', color: '#191F28', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={() => confirmDeleteTxn(deleteConfirmTxnId)}
                style={{ flex: 1, height: 52, borderRadius: 16, border: 'none', background: '#FF5A5F', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 합치기 Undo Snackbar ── */}
      <div style={{
        position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 400,
        transform: mergeUndoSnackbar ? 'translateY(0)' : 'translateY(120px)',
        opacity: mergeUndoSnackbar ? 1 : 0,
        transition: mergeUndoSnackbar
          ? 'transform 250ms cubic-bezier(0.34,1.4,0.64,1), opacity 250ms ease'
          : 'transform 200ms ease-in, opacity 200ms ease-in',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#191F28', borderRadius: 16, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        pointerEvents: mergeUndoSnackbar ? 'auto' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>내역이 합쳐졌습니다.</span>
        </div>
        <button onClick={handleUndoMerge}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeData.primary, fontSize: 14, fontWeight: 700, padding: '4px 8px', flexShrink: 0 }}>
          되돌리기
        </button>
      </div>

      {/* ── Undo Snackbar ── */}
      <div style={{
        position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 400,
        transform: txnUndoSnackbar ? 'translateY(0)' : 'translateY(120px)',
        opacity: txnUndoSnackbar ? 1 : 0,
        transition: txnUndoSnackbar
          ? 'transform 250ms cubic-bezier(0.34,1.4,0.64,1), opacity 250ms ease'
          : 'transform 200ms ease-in, opacity 200ms ease-in',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#191F28', borderRadius: 16, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        pointerEvents: txnUndoSnackbar ? 'auto' : 'none',
      }}>
        <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>내역이 삭제되었습니다.</span>
        <button onClick={handleUndoTxn}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeData.primary, fontSize: 14, fontWeight: 700, padding: '4px 8px', flexShrink: 0 }}>
          실행 취소
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
