import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, orderBy,
  getDoc, setDoc
} from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import YearMonthPicker from '../components/YearMonthPicker'
import { CATEGORY_COLORS, DEFAULT_CATEGORIES, getCategoryColor } from '../styles/theme'
import { inputStyle } from '../styles/styles'

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
const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, paddingLeft: 4 }}>{children}</p>
)

export default function Ledger() {
  const { themeData, themeName, showUtilities, setShowUtilities } = useTheme()
  const navigate = useNavigate()
  const now = new Date()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [tab, setTab] = useState('전체')
  const [period, setPeriod] = useState('월간')
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [swipedId, setSwipedId] = useState(null)
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [weekOffset, setWeekOffset] = useState(0)
  const [sortOrder, setSortOrder] = useState('desc')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [rolloverBudget, setRolloverBudget] = useState(false)
  const [catTab, setCatTab] = useState('expense')
  const [newCatName, setNewCatName] = useState('')
  const [userPayments, setUserPayments] = useState(['현금'])
  const [form, setForm] = useState({ type: 'expense', title: '', amount: '', category: '식비', date: today(), time: '12:00', memo: '', payment: '카드', cardBilling: false, toAccount: '', isLoan: false, creditCardBilling: false })
  const touchStartX = useRef(null)
  const [showYMPicker, setShowYMPicker] = useState(false)
  const [showCardBilling, setShowCardBilling] = useState(false)
  const [showLoan, setShowLoan] = useState(() => localStorage.getItem('moa_showLoan') === 'true')
  const [showCardSelector, setShowCardSelector] = useState(false)
  const [showAccountSelector, setShowAccountSelector] = useState(false)
  const [userCardsList, setUserCardsList] = useState([])
  const [userAccountsList, setUserAccountsList] = useState([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
          const data = snap.data()
          if (data.categories) setCategories({ ...DEFAULT_CATEGORIES, ...data.categories })
          if (data.rolloverBudget !== undefined) setRolloverBudget(data.rolloverBudget)
          if (data.showCardBilling !== undefined) setShowCardBilling(data.showCardBilling)
          if (data.showLoan !== undefined) {
            setShowLoan(data.showLoan)
            localStorage.setItem('moa_showLoan', String(data.showLoan))
          }
        }
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    fetchTransactions()
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.cards) setUserCardsList(data.cards)
        const accounts = data.accounts ? data.accounts.map(a => a.name).filter(Boolean) : []
        setUserAccountsList(accounts)
        setUserPayments(['현금'])
      }
    })
  }, [user])

  const fetchTransactions = async () => {
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const saveUserData = async (updates) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const updated = { ...categories, [catTab]: [...categories[catTab], newCatName.trim()] }
    setCategories(updated)
    saveUserData({ categories: updated })
    setNewCatName('')
  }

  const handleDeleteCategory = (type, cat) => {
    const updated = { ...categories, [type]: categories[type].filter(c => c !== cat) }
    setCategories(updated)
    saveUserData({ categories: updated })
  }

  const handleToggleRollover = (val) => {
    setRolloverBudget(val)
    saveUserData({ rolloverBudget: val })
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
    let filtered = [...transactions]
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
    if (!form.title || !form.amount) return alert('제목과 금액을 입력해주세요.')
    const monthDate = new Date(form.date)
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,'0')}`
    const data = { ...form, amount: Number(form.amount), uid: user.uid, month: monthStr, createdAt: new Date().toISOString() }
    if (editItem) {
      await updateDoc(doc(db, 'transactions', editItem.id), data)
    } else {
      await addDoc(collection(db, 'transactions'), data)
    }
    if (form.type === 'expense') await autoUpdateUtility(form.title, form.amount, form.date)
    setShowForm(false)
    setEditItem(null)
    setForm({ type: 'expense', title: '', amount: '', category: categories.expense[0] || '기타', date: today(), time: '12:00', memo: '', payment: '카드', cardBilling: false, toAccount: '', isLoan: false, creditCardBilling: false })
    fetchTransactions()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('삭제할까요?')) return
    await deleteDoc(doc(db, 'transactions', id))
    setSelectedId(null); setSwipedId(null)
    fetchTransactions()
  }

  const handleEdit = (t) => {
    setEditItem(t)
    setForm({ type: t.type, title: t.title, amount: String(t.amount),
      category: t.category || (t.type === 'transfer' ? '이체' : '기타'),
      date: t.date, time: t.time || '12:00', memo: t.memo || '',
      payment: t.payment || '카드', cardBilling: t.cardBilling || false, isLoan: t.isLoan || false,
      creditCardBilling: t.creditCardBilling || false, toAccount: t.toAccount || '' })
    setShowForm(true); setSelectedId(null)
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e, id) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -60) setSwipedId(id)
    else if (dx > 30) setSwipedId(null)
  }

  const filtered = getFiltered()
  const isCredit = (paymentName) => userCardsList.some(c => c.name === paymentName && c.cardType === 'credit')
  const totalExpense = filtered.filter(t => t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0)
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
  const segBtn = (active) => ({
    flex: 1, padding: '11px', borderRadius: 9999, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: active ? 700 : 500,
    background: active ? themeData.primary : 'transparent',
    color: active ? '#fff' : '#888',
    boxShadow: active ? `0 2px 8px ${themeData.primary}44` : 'none',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ background: themeData.bg, minHeight: '100vh', paddingBottom: 80 }} className={themeData.bgClass}>

      {/* ── 헤더 ── */}
      <div style={{ background: '#fff', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 0', borderBottom: '1px solid #f0f0f0' }}>

        {/* 제목 + 설정 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>가계부</p>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#888' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* 기간 탭 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['주간', '월간', '직접'].map(p => (
            <button key={p} onClick={() => { setPeriod(p); setWeekOffset(0) }}
              style={{ padding: '6px 16px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                background: period === p ? themeData.primary : '#f0f0f0',
                color: period === p ? '#fff' : '#888',
                fontSize: 13, fontWeight: period === p ? 700 : 500,
                boxShadow: period === p ? `0 2px 8px ${themeData.primary}44` : 'none',
                transition: 'all 0.15s' }}>{p}</button>
          ))}
        </div>

        {/* 날짜 네비게이션 */}
        {period === '주간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', marginBottom: 12 }}>
            <button onClick={() => setWeekOffset(o => o-1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '0 8px' }}>‹</button>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{formatWeekLabel()}</p>
            <button onClick={() => setWeekOffset(o => o+1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '0 8px' }}>›</button>
          </div>
        )}
        {period === '월간' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '0 8px' }}>‹</button>
            <p onClick={() => setShowYMPicker(true)} style={{ fontSize: 14, fontWeight: 600, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {viewYear}년 {viewMonth + 1}월 <span style={{ fontSize: 12, color: '#bbb' }}>▾</span>
            </p>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '0 8px' }}>›</button>
          </div>
        )}
        {period === '직접' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none' }} />
            <span style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 13 }}>~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none' }} />
          </div>
        )}

        {/* 지출 / 수입 요약 — 날짜 바 바로 아래 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, background: '#fff8f8', borderRadius: 16, padding: '13px 16px', border: '1px solid #fee2e2' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>지출</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#ef4444' }}>-{fmt(totalExpense)}원</p>
          </div>
          <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 16, padding: '13px 16px', border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>수입</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#22c55e' }}>+{fmt(totalIncome)}원</p>
          </div>
        </div>

        {/* 필터 탭 + 정렬 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['전체', '소비', '수입', '이체'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '6px 13px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  background: tab === t ? '#111' : 'transparent',
                  color: tab === t ? '#fff' : '#888', fontSize: 13, fontWeight: tab === t ? 600 : 400 }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            style={{ background: 'none', border: 'none', color: '#999', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            {sortOrder === 'desc' ? '↓ 최신순' : '↑ 오래된순'}
          </button>
        </div>
      </div>

      {/* ── 내역 리스트 ── */}
      <div style={{ padding: '12px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 14 }}>내역이 없어요</div>
        ) : (
          sortedDates.map(date => (
            <div key={date}>
              {/* 날짜 구분선 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 8px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#aaa', whiteSpace: 'nowrap' }}>
                  {date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3')}
                </span>
                <div style={{ flex: 1, height: 0.5, background: '#e8e8e8' }} />
                <span style={{ fontSize: 11, whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                  {dateGroups[date].some(t => t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && !t.creditCardBilling && (!showLoan || !t.isLoan)) && (
                    <span style={{ color: '#ef4444' }}>-{dateGroups[date].filter(t => t.type === 'expense' && !t.cardBilling && !isCredit(t.payment) && !t.creditCardBilling && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0).toLocaleString()}원</span>
                  )}
                  {(() => {
                    const grayAmt = dateGroups[date].filter(t => t.type === 'expense' && (t.cardBilling || isCredit(t.payment) || t.creditCardBilling)).reduce((s, t) => s + t.amount, 0)
                    return grayAmt > 0 ? <span style={{ color: '#bbb' }}>-{grayAmt.toLocaleString()}원</span> : null
                  })()}
                  {dateGroups[date].some(t => t.type === 'income' && (!showLoan || !t.isLoan)) && (
                    <span style={{ color: '#22c55e' }}>+{dateGroups[date].filter(t => t.type === 'income' && (!showLoan || !t.isLoan)).reduce((s, t) => s + t.amount, 0).toLocaleString()}원</span>
                  )}
                </span>
              </div>

              {dateGroups[date].map(t => {
                const iconKey = t.type === 'transfer' ? 'transfer' : guessIconKey(t.category || '')
                const iconColor = t.type === 'transfer' ? '#888' : getCategoryColor(t.category || '기타')
                return (
                  <div key={t.id} style={{ position: 'relative', marginBottom: 8, borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    {swipedId === t.id && (
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 70, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() => handleDelete(t.id)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </div>
                    )}
                    <div
                      onTouchStart={handleTouchStart}
                      onTouchEnd={e => handleTouchEnd(e, t.id)}
                      onClick={() => { setSelectedId(selectedId === t.id ? null : t.id); setSwipedId(null) }}
                      style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                        background: t.creditCardBilling ? '#fff5f5' : showLoan && t.isLoan ? (t.type === 'expense' ? '#fff5f5' : '#f0fdf4') : (t.cardBilling || isCredit(t.payment)) ? '#f9f9f9' : '#fff',
                        transform: swipedId === t.id ? 'translateX(-70px)' : 'translateX(0)',
                        transition: 'transform 0.25s ease', position: 'relative', zIndex: 1, cursor: 'pointer' }}>
                      {/* 카테고리 아이콘 */}
                      <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: iconColor + '18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CatIcon cat={iconKey} size={18} color={iconColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                        <p style={{ fontSize: 11, color: '#bbb' }}>
                          {t.type === 'transfer'
                            ? `${t.time} · ${t.payment || '-'} → ${t.toAccount || '-'}`
                            : `${t.time} · ${t.category} · ${t.payment || '현금'}`}
                        </p>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0,
                        color: t.type === 'transfer' ? '#888' : t.creditCardBilling ? '#ef4444' : (t.cardBilling || isCredit(t.payment)) ? '#bbb' : (showLoan && t.isLoan) ? (t.type === 'expense' ? '#fca5a5' : '#86efac') : t.type === 'expense' ? '#ef4444' : '#22c55e' }}>
                        {t.type === 'transfer' ? '↔' : t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}원
                      </p>
                    </div>

                    {/* 수정/삭제 — 항목과 동일한 흰 배경 */}
                    {selectedId === t.id && (
                      <div style={{ display: 'flex', borderTop: '1px solid #f5f5f5' }}>
                        <button onClick={() => handleEdit(t)}
                          style={{ flex: 1, padding: '11px', border: 'none', background: '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          수정
                        </button>
                        <div style={{ width: 1, background: '#f5f5f5' }} />
                        <button onClick={() => handleDelete(t.id)}
                          style={{ flex: 1, padding: '11px', border: 'none', background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
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

      {/* ── FAB ── */}
      <button onClick={() => { setEditItem(null); setForm({ type: 'expense', title: '', amount: '', category: categories.expense[0] || '기타', date: today(), time: '12:00', memo: '', payment: '카드', cardBilling: false, toAccount: '', isLoan: false, creditCardBilling: false }); setShowForm(true) }}
        style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', right: '16px', width: 52, height: 52, borderRadius: '50%', background: themeData.primary, border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 100, boxShadow: `0 4px 12px ${themeData.primary}66` }}>+</button>

      {/* ── 설정 — 전체화면 ── */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: '#f5f6f8', zIndex: 200, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, padding: 4, color: '#333' }}><BackIcon /></button>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>가계부 설정</p>
          </div>

          <div style={{ padding: '20px 16px 60px' }}>

            {/* 주 시작 요일 */}
            <SectionLabel>주 시작 요일</SectionLabel>
            <div style={{ display: 'flex', background: '#e8e8e8', borderRadius: 9999, padding: 4, marginBottom: 20 }}>
              {[{ label: '월요일부터', val: 1 }, { label: '일요일부터', val: 0 }].map(opt => (
                <button key={opt.val} onClick={() => setWeekStartDay(opt.val)} style={segBtn(weekStartDay === opt.val)}>{opt.label}</button>
              ))}
            </div>

            {/* 정렬 순서 */}
            <SectionLabel>정렬 순서</SectionLabel>
            <div style={{ display: 'flex', background: '#e8e8e8', borderRadius: 9999, padding: 4, marginBottom: 20 }}>
              {[{ label: '↓ 최신순', val: 'desc' }, { label: '↑ 오래된순', val: 'asc' }].map(opt => (
                <button key={opt.val} onClick={() => setSortOrder(opt.val)} style={segBtn(sortOrder === opt.val)}>{opt.label}</button>
              ))}
            </div>

            {/* 토글 그룹 */}
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
              {[
                { label: '잔여 예산 이월', desc: '남은 예산을 다음 달로 이월', on: rolloverBudget, onChange: handleToggleRollover },
                { label: '체크카드 소액 신용 대금 표시', desc: '회색 표시, 지출 합계에서 제외', on: showCardBilling, onChange: async (val) => { setShowCardBilling(val); if (user) await setDoc(doc(db, 'users', user.uid), { showCardBilling: val }, { merge: true }) } },
                { label: '대출 / 상환 표시', desc: '지출·수입 합계에서 제외, 연한 색으로 표시', on: showLoan, onChange: async (val) => { setShowLoan(val); localStorage.setItem('moa_showLoan', String(val)); if (user) await setDoc(doc(db, 'users', user.uid), { showLoan: val }, { merge: true }) } },
                { label: '분석 공과금 탭', desc: '분석 화면에 공과금 탭을 추가해요', on: showUtilities, onChange: async (val) => { setShowUtilities(val); localStorage.setItem('moa_showUtilities', String(val)); if (user) await setDoc(doc(db, 'users', user.uid), { showUtilities: val }, { merge: true }) } },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <div style={{ flex: 1, paddingRight: 16 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>{item.desc}</p>
                  </div>
                  <Toggle on={item.on} onChange={item.onChange} />
                </div>
              ))}
            </div>

            {/* 카테고리 관리 */}
            <SectionLabel>카테고리 관리</SectionLabel>
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 9999, padding: 3, marginBottom: 14 }}>
                {[{ label: '지출', val: 'expense' }, { label: '수입', val: 'income' }].map(opt => (
                  <button key={opt.val} onClick={() => setCatTab(opt.val)}
                    style={{ flex: 1, padding: '8px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: catTab === opt.val ? themeData.primary : 'transparent',
                      color: catTab === opt.val ? '#fff' : '#888' }}>{opt.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {categories[catTab].map(cat => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f5f5', borderRadius: 9999, padding: '6px 10px 6px 8px' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 8, background: getCategoryColor(cat) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CatIcon cat={guessIconKey(cat)} size={13} color={getCategoryColor(cat)} />
                    </div>
                    <span style={{ fontSize: 13, color: '#333' }}>{cat}</span>
                    <button onClick={() => handleDeleteCategory(catTab, cat)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="새 카테고리 이름"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none', background: '#fafafa' }}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                <button onClick={handleAddCategory} style={{ padding: '10px 16px', borderRadius: 16, border: 'none', background: themeData.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>추가</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 내역 추가/수정 폼 ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#f5f6f8', zIndex: 200, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
            <button onClick={() => { setShowForm(false); setEditItem(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, padding: 4, color: '#333' }}><BackIcon /></button>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{editItem ? '내역 수정' : '내역 추가'}</p>
          </div>

          <div style={{ padding: '16px 16px 80px' }}>
            {/* 지출/수입/이체 탭 */}
            <div style={{ display: 'flex', background: '#e8e8e8', borderRadius: 9999, padding: 4, marginBottom: 20 }}>
              {[
                { type: 'expense', label: '지출' },
                { type: 'income', label: '수입' },
                { type: 'transfer', label: '↔ 이체' }
              ].map(({ type, label }) => (
                <button key={type}
                  onClick={() => setForm(f => ({ ...f, type, category: type === 'expense' ? categories.expense[0] : type === 'income' ? categories.income[0] : '이체', cardBilling: false, toAccount: '' }))}
                  style={{ flex: 1, padding: '11px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: form.type === type ? 700 : 500,
                    background: form.type === type ? (type === 'expense' ? '#ef4444' : type === 'income' ? '#22c55e' : themeData.primary) : 'transparent',
                    color: form.type === type ? '#fff' : '#888',
                    boxShadow: form.type === type ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* 금액 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 500 }}>금액</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 34, fontWeight: 700,
                    color: form.type === 'expense' ? '#ef4444' : form.type === 'income' ? '#22c55e' : '#111',
                    background: 'transparent' }} />
                <span style={{ fontSize: 20, fontWeight: 600, color: '#888' }}>원</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {[1000, 5000, 10000, 50000].map(amt => (
                  <button key={amt} onClick={() => setForm(f => ({ ...f, amount: String(Number(f.amount || 0) + amt) }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 20, border: 'none', background: '#f0f0f0', color: '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>제목</p>
              <input style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '0', fontSize: 15 }}
                placeholder="어디에 썼나요?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            {/* 카테고리 — 아이콘 없는 텍스트 그리드 */}
            {form.type !== 'transfer' && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12, fontWeight: 500 }}>카테고리</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {categories[form.type === 'expense' ? 'expense' : 'income'].map(cat => (
                    <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                      style={{ padding: '11px 4px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.category === cat ? themeData.primary : '#f5f5f5',
                        color: form.category === cat ? '#fff' : '#555',
                        fontWeight: form.category === cat ? 600 : 400, textAlign: 'center' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 이체 정보 */}
            {form.type === 'transfer' && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>이체 정보</p>
                <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>출금 계좌</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {userAccountsList.length > 0 ? userAccountsList.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, payment: a }))}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.payment === a ? themeData.primary : '#f0f0f0',
                        color: form.payment === a ? '#fff' : '#666' }}>{a}</button>
                  )) : (
                    <input style={inputStyle} placeholder="출금 계좌" value={form.payment === '카드' ? '' : form.payment}
                      onChange={e => setForm(f => ({ ...f, payment: e.target.value }))} />
                  )}
                </div>
                <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>입금 계좌</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {userAccountsList.length > 0 ? userAccountsList.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, toAccount: a }))}
                      style={{ padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 13,
                        background: form.toAccount === a ? themeData.primary : '#f0f0f0',
                        color: form.toAccount === a ? '#fff' : '#666' }}>{a}</button>
                  )) : (
                    <input style={inputStyle} placeholder="입금 계좌" value={form.toAccount}
                      onChange={e => setForm(f => ({ ...f, toAccount: e.target.value }))} />
                  )}
                </div>
              </div>
            )}

            {/* 결제수단 (현재 디자인 유지) */}
            {form.type !== 'transfer' && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 500 }}>결제수단</p>
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

            {/* 신용카드 대금 납부 — 단독 토글 박스 */}
            {form.type === 'expense' && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>신용카드 대금 납부</p>
                  <p style={{ fontSize: 12, color: '#888' }}>카드 실적 제외</p>
                </div>
                <Toggle on={form.creditCardBilling || false} onChange={val => setForm(f => ({ ...f, creditCardBilling: val }))} />
              </div>
            )}

            {/* 체크카드 소액 신용 대금 납부 — 단독 토글 박스 */}
            {form.type === 'expense' && showCardBilling && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>체크카드 소액 신용 대금 납부</p>
                  <p style={{ fontSize: 12, color: '#888' }}>지출 합계에서 제외</p>
                </div>
                <Toggle on={form.cardBilling || false} onChange={val => setForm(f => ({ ...f, cardBilling: val }))} />
              </div>
            )}

            {/* 대출 / 상환 — 단독 토글 박스 */}
            {form.type === 'expense' && showLoan && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>대출 / 상환</p>
                  <p style={{ fontSize: 12, color: '#888' }}>합계에서 제외</p>
                </div>
                <Toggle on={form.isLoan || false} onChange={val => setForm(f => ({ ...f, isLoan: val }))} />
              </div>
            )}

            {/* 날짜 및 시간 — Pill 버튼 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 500 }}>날짜 및 시간</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ padding: '13px 0', borderRadius: 16, background: '#f5f5f5', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#111' }}>
                    {form.date ? form.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1. $2. $3.') : '날짜'}
                  </div>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ padding: '13px 0', borderRadius: 16, background: '#f5f5f5', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#111' }}>
                    {formatTime(form.time)}
                  </div>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>메모 (선택)</p>
              <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="메모를 입력하세요"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#111', background: 'transparent', resize: 'none', height: 72, lineHeight: 1.6, boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleSubmit}
              style={{ width: '100%', padding: '16px', borderRadius: 16,
                background: form.type === 'expense' ? '#ef4444' : form.type === 'income' ? '#22c55e' : themeData.primary,
                color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              {editItem ? '수정 완료' : '추가하기'}
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

      <BottomNav />
    </div>
  )
}
