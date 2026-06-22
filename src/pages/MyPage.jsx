import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut, updateProfile, deleteUser } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import BottomNav from '../components/BottomNav'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { THEMES } from '../styles/theme'
import { inputStyle } from '../styles/styles'
import { useTheme } from '../contexts/ThemeContext'
import { useCards } from '../contexts/CardsContext'
import { useSettings } from '../contexts/SettingsContext'

// 설정 화면용 토글
const SToggle = ({ on, onChange, primary }) => (
  <div onClick={() => onChange(!on)}
    style={{ width: 48, height: 28, borderRadius: 9999, background: on ? primary : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
  </div>
)

// 설정 화면용 아이콘 (Apple Settings 스타일)
const SIcon = ({ bg, children }) => (
  <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {children}
  </div>
)
const SI = (props) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} />

export default function MyPage() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const { themeName, setThemeName, themeData: t, showUtilities, setShowUtilities } = useTheme()
  const { cards, setCards } = useCards()
  const { weekStartDay, setWeekStartDay, sortOrder, setSortOrder, showCardBilling, setShowCardBilling, rolloverBudget, setRolloverBudget, showLoan, setShowLoan, categories, setCategories } = useSettings()
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardDetailTab, setCardDetailTab] = useState('benefits')
  const [cardHistoryMonth, setCardHistoryMonth] = useState(null)
  const [cardTransactions, setCardTransactions] = useState([])
  const [user, setUser] = useState(null)
  const [nickname, setNickname] = useState(() => localStorage.getItem('moa_nickname') || '')
  const [editingNick, setEditingNick] = useState(false)
  const [profileImg, setProfileImg] = useState(() => localStorage.getItem('moa_profileImg') || null)
  const [settingsPage, setSettingsPage] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteChecked, setDeleteChecked] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [settingsCatTab, setSettingsCatTab] = useState('expense')
  const [settingsNewCatName, setSettingsNewCatName] = useState('')
  const [accounts, setAccounts] = useState(() => {
    try { const a = localStorage.getItem('moa_accounts'); return a ? JSON.parse(a) : [] } catch { return [] }
  })
  const [cash, setCash] = useState(() => {
    const c = localStorage.getItem('moa_cash'); return c !== null && c !== '' ? Number(c) : ''
  })
  const [editingCash, setEditingCash] = useState(false)
  const [cashInput, setCashInput] = useState('')
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [editAccountData, setEditAccountData] = useState({})
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const EMPTY_CARD = { cardType: '', name: '', limit: '', cardNumber: '', expiry: '', linkedAccount: '', billingDay: '', creditTracking: '' }
  const [newCard, setNewCard] = useState(EMPTY_CARD)
  const [newAccount, setNewAccount] = useState({ name: '', balance: '', number: '' })
  const [exporting, setExporting] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState(null)
  const [allTxns, setAllTxns] = useState([])
  const [editingCardId, setEditingCardId] = useState(null)
  const [editCardData, setEditCardData] = useState({})
  const [expandedAccountHistoryId, setExpandedAccountHistoryId] = useState(null)
  const [expandedCardId, setExpandedCardId] = useState(null)
  const [showAccountNumbers, setShowAccountNumbers] = useState(false)
  const [expandedAccountEditId, setExpandedAccountEditId] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [accountHistoryMonth, setAccountHistoryMonth] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) navigate('/auth', { replace: true })
      else {
        setUser(u)
        setNickname(u.displayName || u.email?.split('@')[0] || '사용자')
        localStorage.setItem('moa_nickname', u.displayName || u.email?.split('@')[0] || '사용자')

        if (u.photoURL) {
            setProfileImg(u.photoURL)
            localStorage.setItem('moa_profileImg', u.photoURL)
        }

        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
            const data = snap.data()
            if (data.theme) setThemeName(data.theme)
            if (data.cards) {
                setCards(data.cards)
            }
            if (data.accounts) {
                setAccounts(data.accounts)
                localStorage.setItem('moa_accounts', JSON.stringify(data.accounts))
            }
            if (data.cash !== undefined) {
                setCash(data.cash)
                setCashInput(String(data.cash))
                localStorage.setItem('moa_cash', String(data.cash))
            }
            if (data.profileImg) {
                setProfileImg(data.profileImg)
                localStorage.setItem('moa_profileImg', data.profileImg)
            }
            // 전체 거래내역 fetch (계좌 잔액 자동 연동)
            const txSnap = await getDocs(query(collection(db, 'transactions'), where('uid', '==', u.uid)))
            setAllTxns(txSnap.docs.map(d => d.data()))
        }
      }
    })
    return unsub
  }, [])                       // ← 첫 번째 useEffect 여기서 닫기

  useEffect(() => {            // ← 별도 useEffect
    localStorage.setItem('moa_accounts', JSON.stringify(accounts))
  }, [accounts])

  const saveToFirestore = async (updates) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
  }

  const handleNicknameSave = async () => {
    await updateProfile(auth.currentUser, { displayName: nickname })
    setEditingNick(false)
  }

  const handleProfileImg = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      setProfileImg(base64)
      await saveToFirestore({ profileImg: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleThemeChange = (name) => {
    setThemeName(name)
    saveToFirestore({ theme: name })
  }

  const handleWithdrawAccount = async () => {
    if (!user || deletingAccount) return
    setDeletingAccount(true)
    try {
      const batch = writeBatch(db)
      const txSnap = await getDocs(query(collection(db, 'transactions'), where('uid', '==', user.uid)))
      txSnap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      await deleteDoc(doc(db, 'users', user.uid))
      localStorage.clear()
      await deleteUser(user)
      navigate('/', { replace: true })
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        alert('보안을 위해 재로그인 후 탈퇴를 진행해주세요.')
        await signOut(auth)
        navigate('/auth', { replace: true })
      } else {
        alert('탈퇴 중 오류가 발생했습니다.')
      }
      setDeletingAccount(false)
    }
  }

  const handleCashSave = () => {
    const currentAmount = Number(cashInput)
    let net = 0
    try {
        net = allTxns.reduce((s, t) => {
            if (t.type === 'expense' && t.payment === '현금') return s - (t.amount || 0)
            if (t.type === 'income' && t.payment === '현금') return s + (t.amount || 0)
            if (t.type === 'transfer') {
                if (t.payment === '현금') return s - (t.amount || 0)
                if (t.toAccount === '현금') return s + (t.amount || 0)
            }
            return s
        }, 0)
    } catch { net = 0 }
    const baseBalance = currentAmount - net
    setCash(baseBalance)
    saveToFirestore({ cash: baseBalance })
    setEditingCash(false)
  }

  const handleAddCard = () => {
    if (!newCard.name || !newCard.cardType) return
    if (newCard.cardType === 'credit' && !newCard.creditTracking) return
    const updated = [...cards, {
        id: Date.now(),
        cardType: newCard.cardType,
        name: newCard.name,
        limit: Number(newCard.limit) || 0,
        used: 0,
        cardNumber: newCard.cardNumber || '',
        expiry: newCard.expiry || '',
        linkedAccount: newCard.linkedAccount || '',
        billingDay: newCard.billingDay ? Number(newCard.billingDay) : null,
        creditTracking: newCard.creditTracking || '',
        benefits: [],
    }]
    setCards(updated); saveToFirestore({ cards: updated })
    setNewCard(EMPTY_CARD)
    setShowAddCard(false)
  }

  const handleDeleteCard = (id) => {
    const updated = cards.filter(c => c.id !== id)
    setCards(updated); saveToFirestore({ cards: updated })
  }

  const handleSaveCard = () => {
    if (!editCardData.name || !editCardData.cardType) return
    if (editCardData.cardType === 'credit' && !editCardData.creditTracking) return
    const updated = cards.map(c => c.id === editingCardId
        ? { ...c,
            cardType: editCardData.cardType || c.cardType,
            name: editCardData.name,
            cardNumber: editCardData.cardNumber,
            expiry: editCardData.expiry,
            linkedAccount: editCardData.linkedAccount,
            limit: Number(editCardData.limit) || 0,
            billingDay: editCardData.billingDay ? Number(editCardData.billingDay) : null,
            creditTracking: editCardData.creditTracking || '',
          }
        : c)
    setCards(updated); saveToFirestore({ cards: updated })
    setEditingCardId(null)
  }

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.balance) return
    const updated = [...accounts, { id: Date.now(), name: newAccount.name, balance: Number(newAccount.balance), number: newAccount.number || '' }]
    setAccounts(updated); saveToFirestore({ accounts: updated })
    setNewAccount({ name: '', balance: '', number: '' }); setShowAddAccount(false)
  }

  const handleDeleteAccount = (id) => {
    const updated = accounts.filter(a => a.id !== id)
    setAccounts(updated); saveToFirestore({ accounts: updated })
  }
  
  const handleEditAccount = (acc) => {
    setEditingAccountId(acc.id)
    setEditAccountData({ name: acc.name, balance: String(getAccountBalance(acc)), number: acc.number || '' })
  }

  const handleSaveAccount = () => {
    const origAcc = accounts.find(a => a.id === editingAccountId)
    let net = 0
    try {
      net = allTxns.reduce((s, t) => {
        if (t.type === 'expense' && t.payment === origAcc.name) return s - (t.amount || 0)
        if (t.type === 'income' && t.payment === origAcc.name) return s + (t.amount || 0)
        if (t.type === 'transfer') {
          if (t.payment === origAcc.name) return s - (t.amount || 0)
          if (t.toAccount === origAcc.name) return s + (t.amount || 0)
        }
        // 카드 대금: 결제수단이 카드 이름인 경우 → 연동 계좌에서 차감
        if (t.cardBilling && t.payment !== origAcc.name) {
          const linkedCard = cards.find(c => c.name === t.payment && c.linkedAccount === origAcc.name)
          if (linkedCard) return s - (t.amount || 0)
        }
        return s
      }, 0)
    } catch { net = 0 }
    const newBaseBalance = Number(editAccountData.balance) - net
    const updated = accounts.map(a => a.id === editingAccountId
        ? { ...a, name: editAccountData.name, balance: newBaseBalance, number: editAccountData.number }
        : a)
    setAccounts(updated); saveToFirestore({ accounts: updated }); setEditingAccountId(null)
  }

  const exportToExcel = async () => {
    if (!user) return
    setExporting(true)
    try {
      const q = query(collection(db, 'transactions'), where('uid', '==', user.uid))
      const snap = await getDocs(q)
      const txs = snap.docs.map(d => d.data()).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      const data = txs.map(tx => ({
        '날짜': tx.date || '', '시간': tx.time || '',
        '구분': tx.type === 'expense' ? '지출' : '수입',
        '제목': tx.title || '', '카테고리': tx.category || '',
        '결제수단': tx.payment || '',
        '금액': tx.type === 'expense' ? -(tx.amount || 0) : (tx.amount || 0),
        '메모': tx.memo || '',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '가계부')
      XLSX.writeFile(wb, 'moa_가계부.xlsx')
    } catch (e) { alert('엑셀 내보내기 실패: ' + e.message) }
    setExporting(false)
  }

  const exportToPDF = async () => {
    if (!user) return
    setExporting(true)
    try {
      const q = query(collection(db, 'transactions'), where('uid', '==', user.uid))
      const snap = await getDocs(q)
      const txs = snap.docs.map(d => d.data()).sort((a, b) => (a.date || '').localeCompare(b.date || ''))

      const div = document.createElement('div')
      div.style.cssText = 'padding:24px;background:#fff;font-family:sans-serif;width:720px;position:fixed;top:-9999px;left:-9999px;'
      div.innerHTML = `
        <h2 style="margin-bottom:4px;font-size:20px">모아 가계부</h2>
        <p style="color:#888;font-size:12px;margin-bottom:16px">${user.email} · 총 ${txs.length}건</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f0f0f0">
              <th style="padding:8px;text-align:left;border:1px solid #ddd">날짜</th>
              <th style="padding:8px;text-align:left;border:1px solid #ddd">제목</th>
              <th style="padding:8px;text-align:left;border:1px solid #ddd">카테고리</th>
              <th style="padding:8px;text-align:right;border:1px solid #ddd">금액</th>
            </tr>
          </thead>
          <tbody>
            ${txs.map(tx => `
              <tr>
                <td style="padding:7px 8px;border:1px solid #eee">${tx.date || ''}</td>
                <td style="padding:7px 8px;border:1px solid #eee">${tx.title || ''}</td>
                <td style="padding:7px 8px;border:1px solid #eee">${tx.category || ''}</td>
                <td style="padding:7px 8px;border:1px solid #eee;text-align:right;color:${tx.type === 'expense' ? '#ef4444' : '#22c55e'};font-weight:600">
                  ${tx.type === 'expense' ? '-' : '+'}${(tx.amount || 0).toLocaleString()}원
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      document.body.appendChild(div)
      const canvas = await html2canvas(div, { scale: 2, useCORS: true })
      document.body.removeChild(div)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pdfW) / canvas.width
      let remaining = imgH, pos = 0

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH)
      remaining -= pdfH
      while (remaining > 0) {
        pos -= pdfH; pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH)
        remaining -= pdfH
      }
      pdf.save('moa_가계부.pdf')
    } catch (e) { alert('PDF 내보내기 실패: ' + e.message) }
    setExporting(false)
  }

  const fmt = n => Number(n).toLocaleString('ko-KR')
  const maskAccountNumber = (num) => {
    if (!num) return ''
    const digits = num.replace(/[\s-]/g, '')
    if (digits.length <= 4) return '****'
    const parts = num.trim().split(/[\s-]/)
    if (parts.length >= 3) return `${parts[0]} **** ${parts[parts.length - 1]}`
    return num.slice(0, 4) + ' **** ' + num.slice(-4)
  }
  const getAccountBalance = (account) => {
    try {
      const net = allTxns.reduce((s, t) => {
        if (t.type === 'expense' && t.payment === account.name) return s - (t.amount || 0)
        if (t.type === 'income' && t.payment === account.name) return s + (t.amount || 0)
        if (t.type === 'transfer') {
          if (t.payment === account.name) return s - (t.amount || 0)
          if (t.toAccount === account.name) return s + (t.amount || 0)
        }
        // 카드 대금: 결제수단이 카드 이름인 경우 → 연동 계좌에서 차감
        if (t.cardBilling && t.payment !== account.name) {
          const linkedCard = cards.find(c => c.name === t.payment && c.linkedAccount === account.name)
          if (linkedCard) return s - (t.amount || 0)
        }
        return s
      }, 0)
      return account.balance + net
    } catch { return account.balance }
  }
  const getBalanceAtMonthEnd = (account, year, month) => {
    const lastDayStr = `${year}-${String(month).padStart(2,'0')}-${String(new Date(year, month, 0).getDate()).padStart(2,'0')}`
    try {
        const net = allTxns.reduce((s, t) => {
            if (!t.date || t.date > lastDayStr) return s
            if (t.type === 'expense' && t.payment === account.name) return s - (t.amount || 0)
            if (t.type === 'income' && t.payment === account.name) return s + (t.amount || 0)
            if (t.type === 'transfer') {
                if (t.payment === account.name) return s - (t.amount || 0)
                if (t.toAccount === account.name) return s + (t.amount || 0)
            }
            if (t.cardBilling && t.payment !== account.name) {
                const linkedCard = cards.find(c => c.name === t.payment && c.linkedAccount === account.name)
                if (linkedCard) return s - (t.amount || 0)
            }
            return s
        }, 0)
        return account.balance + net
    } catch { return account.balance }
  }
  const getCashBalance = () => {
    try {
        const net = allTxns.reduce((s, t) => {
            if (t.type === 'expense' && t.payment === '현금') return s - (t.amount || 0)
            if (t.type === 'income' && t.payment === '현금') return s + (t.amount || 0)
            if (t.type === 'transfer') {
                if (t.payment === '현금') return s - (t.amount || 0)
                if (t.toAccount === '현금') return s + (t.amount || 0)
            }
            return s
        }, 0)
        return Number(cash || 0) + net
    } catch { return Number(cash || 0) }
  }
  const getCardUsed = (card) => {
    try {
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const allTxns = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('moa_txns_')) {
                const txns = JSON.parse(localStorage.getItem(key) || '[]')
                allTxns.push(...txns)
            }
        }
        return allTxns
            .filter(t => t.payment === card.name && t.type === 'expense' && !t.creditCardBilling && (t.month || t.date?.slice(0, 7)) === currentMonth)
            .reduce((s, t) => s + (t.amount || 0), 0)
    } catch { return card.used || 0 }
  }
  const totalCardUsed = cards.reduce((s, card) => s + getCardUsed(card), 0)
  const totalAsset = accounts.reduce((s, a) => s + getAccountBalance(a), 0) + getCashBalance()

  const smallBtn = (onClick, label, bg, color) => (
    <button onClick={onClick} style={{ background: bg, border: 'none', borderRadius: 12, padding: '7px 16px', color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
  )

  const settingsChevron = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9CDD2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  const settingsPageTitle = { root: '설정', home: '홈', ledger: '가계부', analysis: '분석', my: 'MY', categories: '카테고리 관리', theme: '테마', export: '데이터 내보내기', updates: '업데이트 내용', 'delete-account': '계정 탈퇴' }[settingsPage] || '설정'
  const updatesList = [
    { version: 'v1.5.0', date: '2026.06.22', changes: ['[ MY - 설정 ] 설정 통합 및 계정 관리 기능 개선', '[ MY - 카드 ] 신용카드 추적 방식 로직 수정', '[ MY - 카드 ] 변경사항 자동 반영'] },
    { version: 'v1.4.0', date: '2026.06.09', changes: ['[ 가계부 ] 대출 / 상환 기능 추가', '[ 가계부 ] 내역 버그 수정', '[ MY - 카드 정보 ] 실시간 사용 금액 연동 오류 수정', '[ MY - 계좌 ] 기준 잔액 → 현재 잔액으로 수정 + 변경 가능', '[ MY - 계좌 ] 가계부 내역과 자동 연동 → 자동 잔액 수정 기능 추가'] },
    { version: 'v1.3.0', date: '2026.06.06', changes: ['[ 가계부 ] 계좌 간 이체 기능 추가', '[ 분석 ] AI 분석 오류 수정', '[ MY - 카드 정보 ] 계좌 연동 선택 → 필수항목에서 배제'] },
    { version: 'v1.2.0', date: '2026.06.05', changes: ['[ 홈, 분석 ] 카테고리 원형 그래프 수정', '[ 홈 ] 최근 내역 버그 수정', '[ 캘린더 ] 고정지출, 카드대금, 내역 버그 수정', '[ 가계부 ] 카드대금 내역 디자인 수정', '[ 분석 ] 결제수단별 지출 → 카드 / 이체 및 결제 수단 세분화', '[ MY - 계좌 ] 자동 잔액 수정 기능 추가'] },
    { version: 'v1.1.0', date: '2026.06.04', changes: ['공과금 탭 설정 연동성 오류 수정', '[ 가계부 ] 공과금 목록 텍스트 자동 인식 → 분석 자동 입력 기능 추가', '[ MY - 카드 정보 ] 혜택 입력창 고정 + 내역 연/월 설정 기능 추가', '[ MY - 설정 ] 이용 방법, 업데이트 사항, 피드백 탭 추가', '[ 분석 ] 막대 그래프 수정', '[ 분석 - 공과금 ] 세부사항 수정 + 삭제 기능 추가', '[ MY ] 카드 정보 UI 수정', '[ MY ] 버그 수정'] },
    { version: 'v1.0.0', date: '2026.06.03', changes: ['모아 가계부 출시 🎉'] },
  ]

  return (
    <div style={{ background: t.bg, minHeight: '100vh', paddingBottom: 80 }} className={themeName === 'pastel' ? 'theme-pastel-bg' : ''}>

      {/* 헤더 */}
      <div style={{ background: t.primary, padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div onClick={() => fileRef.current.click()} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)' }}>
                {profileImg ? <img src={profileImg} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff' }}>{nickname[0] || '?'}</span>}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImg} />
            <div style={{ flex: 1 }}>
              {editingNick ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={nickname} onChange={e => setNickname(e.target.value)}
                    style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', flex: 1, padding: '8px 12px' }} />
                  <button onClick={handleNicknameSave} style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>저장</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{nickname}</p>
                  <button onClick={() => setEditingNick(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 9999, padding: '3px 8px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>수정</button>
                </div>
              )}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user?.email}</p>
            </div>
          </div>

          {/* 설정 아이콘 */}
          {!editingNick && (
            <button onClick={() => setSettingsPage('root')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, width: 36, height: 36, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 24px' }}>

        {/* 총 자산 */}
        <div style={{ background: t.card, borderRadius: 20, padding: '16px', marginBottom: 16, border: `1.5px solid ${t.primary}33`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 13, color: '#8B95A1', fontWeight: 700, marginBottom: 8 }}>총 자산</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: t.text || '#191F28', marginBottom: 12 }}>{fmt(totalAsset)}원</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.primary, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#8B95A1' }}>계좌</span>
              <span style={{ fontSize: 12, color: accounts.reduce((s,a) => s + getAccountBalance(a), 0) < 0 ? '#FF5A5F' : '#8B95A1', fontWeight: 500 }}>{fmt(accounts.reduce((s,a) => s + getAccountBalance(a), 0))}원</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ECC71', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#8B95A1' }}>현금</span>
              <span style={{ fontSize: 12, color: '#8B95A1', fontWeight: 500 }}>{fmt(getCashBalance())}원</span>
            </div>
          </div>
        </div>

        {/* 카드 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <p style={{ fontSize: 18, fontWeight: 700, color: t.text || '#111' }}>카드</p>
              {cards.length > 0 && <span style={{ fontSize: 12, color: t.primary, background: `${t.primary}15`, borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>{cards.length}개</span>}
            </div>
            {smallBtn(() => setShowAddCard(true), '+ 추가', t.primary, '#fff')}
          </div>
          {cards.map(card => {
            const cardUsed = getCardUsed(card)
            const pct = Math.min((cardUsed / (card.limit || 1)) * 100, 100)
            const achieved = card.limit > 0 && cardUsed >= card.limit

            // 일반 카드 아이템
            return (
              <div key={card.id} style={{ marginBottom: 10, background: t.card || '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                {/* 카드 본문 – 탭하면 상세 모달 */}
                <div style={{ padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedCard(card)
                    setCardDetailTab('benefits')
                    const q2 = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('payment', '==', card.name))
                    setCardHistoryMonth(null)
                    getDocs(q2).then(snap => setCardTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: t.text || '#111' }}>{card.name}</span>
                      <span style={{ fontSize: 10, background: card.cardType === 'credit' ? '#fee2e2' : '#e0f2fe', color: card.cardType === 'credit' ? '#ef4444' : '#0284c7', borderRadius: 9999, padding: '2px 7px', fontWeight: 600 }}>
                        {card.cardType === 'credit' ? '신용' : '체크'}
                      </span>
                      {achieved && <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', borderRadius: 9999, padding: '2px 7px', fontWeight: 600 }}>✓ 달성</span>}
                    </div>
                    <button onClick={e => {
                      e.stopPropagation()
                      setExpandedCardId(expandedCardId === card.id ? null : card.id)
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: expandedCardId === card.id ? t.primary : '#bbb', padding: 4, lineHeight: 0, flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                  {(card.billingDay || card.cardNumber) && (
                    <p style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>
                      {card.billingDay ? `결제일 매월 ${card.billingDay}일` : ''}
                      {card.billingDay && card.cardNumber ? ' · ' : ''}
                      {card.cardNumber ? `**** ${card.cardNumber}` : ''}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>이번 달 사용</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: t.text || '#111', marginBottom: 6 }}>{fmt(cardUsed)}원</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#aaa' }}>목표 {fmt(card.limit || 0)}원</span>
                    {card.limit > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: achieved ? '#22c55e' : t.primary }}>
                        {achieved ? '✓ 달성' : `${Math.round(pct)}%`}
                      </span>
                    )}
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: achieved ? '#22c55e' : t.primary, width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
                {/* 수정/삭제 펼침 행 */}
                {expandedCardId === card.id && (
                  <div style={{ display: 'flex', borderTop: '1px solid #F2F4F6' }}>
                    <button onClick={() => {
                      setEditingCardId(card.id)
                      setEditCardData({
                        cardType: card.cardType || 'debit',
                        name: card.name,
                        cardNumber: card.cardNumber || '',
                        expiry: card.expiry || '',
                        linkedAccount: card.linkedAccount || '',
                        limit: String(card.limit || ''),
                        billingDay: card.billingDay ? String(card.billingDay) : '',
                        creditTracking: card.creditTracking || '',
                      })
                      setExpandedCardId(null)
                    }} style={{ flex: 1, padding: '14px', border: 'none', background: t.card || '#fff', color: '#8B95A1', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      수정
                    </button>
                    <div style={{ width: 1, background: '#F2F4F6' }} />
                    <button onClick={e => { e.stopPropagation(); handleDeleteCard(card.id) }}
                      style={{ flex: 1, padding: '14px', border: 'none', background: t.card || '#fff', color: '#FF5A5F', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {(showAddCard || !!editingCardId) && (() => {
            const isEdit = !!editingCardId
            const data = isEdit ? editCardData : newCard
            const setData = isEdit ? setEditCardData : setNewCard
            const isCredit = data.cardType === 'credit'
            const isValid = !!data.name && !!data.cardType && (!isCredit || !!data.creditTracking)
            const showValidationMsg = isCredit && !!data.name && !data.creditTracking

            const TRACKING_OPTS = [
              {
                val: 'spend',
                titleNode: (sel, primary) => (
                  <span>신용카드 <span style={{ color: primary, fontWeight: 800 }}>지출</span>이 중요해요</span>
                ),
                desc: '카드를 사용하는 순간마다 가계부 지출로 기록합니다. 소비 습관 관리를 원하는 사용자에게 적합합니다.',
                tags: ['결제 내역 → 지출 포함', '결제 대금 : 지출 미포함', '소비 패턴 분석'],
                icon: (color) => (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                ),
              },
              {
                val: 'billing',
                titleNode: (sel, primary) => (
                  <span>신용카드 <span style={{ color: primary, fontWeight: 800 }}>대금</span>이 중요해요</span>
                ),
                desc: '매월 카드 대금 청구 시점에 지출을 기록합니다. 카드값 관리 중심 사용자에게 적합합니다.',
                tags: ['청구일 기준 기록', '카드값 관리', '결제 내역 : 지출 미포함'],
                icon: (color) => (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                ),
              },
            ]

            const CARD_FIELDS = [
              { label: '카드 이름', req: true, placeholder: '예: 신한카드', key: 'name', type: 'text', extra: {} },
              { label: '카드번호 끝 4자리', req: false, placeholder: '예: 1234', key: 'cardNumber', type: 'text', extra: { maxLength: 4 } },
              { label: '유효기간', req: false, placeholder: 'MM/YY', key: 'expiry', type: 'text', extra: {} },
              { label: '실적 목표 금액', req: false, placeholder: '예: 300000', key: 'limit', type: 'number', extra: {} },
              { label: '결제일', req: false, placeholder: '예: 15', key: 'billingDay', type: 'number', extra: { min: '1', max: '31' } },
            ]

            return (
              <div style={{ position: 'fixed', inset: 0, background: '#F7F8FA', zIndex: 500, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 16px', background: '#fff', borderBottom: '1px solid #F2F4F6', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => { if (isEdit) setEditingCardId(null); else { setShowAddCard(false); setNewCard(EMPTY_CARD) } }}
                      style={{ width: 36, height: 36, borderRadius: 10, background: '#F2F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191F28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </button>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{isEdit ? '카드 수정' : '카드 추가'}</p>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 40px', WebkitOverflowScrolling: 'touch' }}>

                  {/* ── 1. 카드 종류 Segmented Control ── */}
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>카드 종류</p>
                    <div style={{ display: 'flex', background: '#ECEEF0', borderRadius: 16, padding: 4, gap: 4 }}>
                      {[{ val: 'debit', label: '체크카드' }, { val: 'credit', label: '신용카드' }].map(opt => {
                        const sel = data.cardType === opt.val
                        return (
                          <button key={opt.val}
                            onClick={() => setData(c => ({ ...c, cardType: opt.val, creditTracking: opt.val === 'debit' ? '' : c.creditTracking }))}
                            style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15,
                              fontWeight: sel ? 700 : 500,
                              background: sel ? t.primary : 'transparent',
                              color: sel ? '#fff' : '#8B95A1',
                              boxShadow: sel ? `0 2px 10px ${t.primary}44` : 'none',
                              transition: 'all 180ms ease-out' }}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── 2. 신용카드 지출 추적 방식 (animated) ── */}
                  {/* 바깥 wrapper: clip 없이 opacity+height만 제어 */}
                  <div style={{
                    maxHeight: isCredit ? '800px' : '0px',
                    opacity: isCredit ? 1 : 0,
                    pointerEvents: isCredit ? 'auto' : 'none',
                    transition: isCredit
                      ? 'max-height 250ms ease-out, opacity 200ms ease-out'
                      : 'max-height 200ms ease-in, opacity 150ms ease-in',
                    marginBottom: isCredit ? 24 : 0,
                    overflow: 'visible',   /* scale()이 잘리지 않도록 */
                  }}>
                    {/* 안쪽 wrapper로 overflow:hidden 분리 → 높이 collapse 담당 */}
                    <div style={{ overflow: 'hidden', paddingBottom: 2 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>지출 추적 방식</p>
                    <p style={{ fontSize: 13, color: '#B0B8C1', marginBottom: 14 }}>신용카드를 어떻게 관리할지 선택해주세요</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {TRACKING_OPTS.map(opt => {
                        const sel = data.creditTracking === opt.val
                        return (
                          <button key={opt.val}
                            onClick={() => setData(c => ({ ...c, creditTracking: opt.val }))}
                            style={{ width: '100%', textAlign: 'left', padding: '18px 16px', borderRadius: 22,
                              border: `2px solid ${sel ? t.primary : '#E5E8EB'}`,
                              background: sel ? `${t.primary}0D` : '#fff',
                              cursor: 'pointer',
                              transition: 'border-color 150ms ease-out, background 150ms ease-out, box-shadow 150ms ease-out',
                              boxShadow: sel ? `0 4px 20px ${t.primary}28` : '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                              {/* 아이콘 */}
                              <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, marginTop: 2,
                                background: sel ? `${t.primary}18` : '#F2F4F6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 150ms' }}>
                                {opt.icon(sel ? t.primary : '#8B95A1')}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* 제목 + 라디오 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <p style={{ fontSize: 15, fontWeight: 700, color: sel ? t.primary : '#191F28', transition: 'color 150ms', lineHeight: 1.4 }}>{opt.titleNode(sel, t.primary)}</p>
                                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginLeft: 10,
                                    border: `2px solid ${sel ? t.primary : '#D1D6DB'}`,
                                    background: sel ? t.primary : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 150ms' }}>
                                    {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                                  </div>
                                </div>
                                <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.55, marginBottom: 12 }}>{opt.desc}</p>
                                {/* 태그 칩 */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {opt.tags.map(tag => (
                                    <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999,
                                      background: sel ? `${t.primary}15` : '#F2F4F6',
                                      color: sel ? t.primary : '#8B95A1',
                                      fontWeight: sel ? 600 : 400,
                                      border: `1px solid ${sel ? `${t.primary}30` : 'transparent'}`,
                                      transition: 'all 150ms', whiteSpace: 'nowrap' }}>{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    </div>
                  </div>

                  {/* ── 3. 카드 정보 ── */}
                  <div style={{ background: '#fff', borderRadius: 22, padding: '20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 16, letterSpacing: 0.5, textTransform: 'uppercase' }}>카드 정보</p>
                    {CARD_FIELDS.map(({ label, req, placeholder, key, type, extra }, i, arr) => (
                      <div key={key} style={{ marginBottom: i < arr.length - 1 ? 18 : 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>
                          {label}{req && <span style={{ color: '#FF5A5F' }}> *</span>}
                        </p>
                        <input style={{ ...inputStyle }} type={type} placeholder={placeholder}
                          value={data[key] || ''} onChange={e => setData(c => ({ ...c, [key]: e.target.value }))} {...extra} />
                      </div>
                    ))}
                  </div>

                  {/* ── 4. 연동 계좌 ── */}
                  <div style={{ background: '#fff', borderRadius: 22, padding: '20px', marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      연동 계좌 <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 12 }}>(선택)</span>
                    </p>
                    <p style={{ fontSize: 13, color: '#B0B8C1', marginBottom: 14 }}>카드 대금이 출금되는 계좌를 선택하세요</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[{ id: '__none', name: '없음' }, ...accounts].map(a => {
                        const sel = a.id === '__none' ? data.linkedAccount === '' : data.linkedAccount === a.name
                        return (
                          <button key={a.id} onClick={() => setData(c => ({ ...c, linkedAccount: a.id === '__none' ? '' : a.name }))}
                            style={{ padding: '9px 16px', borderRadius: 9999, cursor: 'pointer', fontSize: 13,
                              border: `1.5px solid ${sel ? t.primary : '#E5E8EB'}`,
                              background: sel ? `${t.primary}10` : '#F7F8FA',
                              color: sel ? t.primary : '#8B95A1', fontWeight: sel ? 600 : 400,
                              transition: 'all 150ms' }}>{a.name}</button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', background: '#fff', borderTop: '1px solid #F2F4F6', flexShrink: 0 }}>
                  {showValidationMsg && (
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#FF5A5F', textAlign: 'center', marginBottom: 8 }}>
                      지출 추적 방식을 선택해주세요
                    </p>
                  )}
                  <button onClick={isEdit ? handleSaveCard : handleAddCard}
                    disabled={!isValid}
                    style={{ width: '100%', height: 56, borderRadius: 16,
                      background: isValid ? t.primary : '#E5E8EB',
                      color: isValid ? '#fff' : '#B0B8C1',
                      border: 'none', fontSize: 16, fontWeight: 700,
                      cursor: isValid ? 'pointer' : 'not-allowed',
                      transition: 'background 200ms, color 200ms' }}>
                    {isEdit ? '저장하기' : '추가하기'}
                  </button>
                </div>
              </div>
            )
          })()}
        </div>

        {/* 계좌 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="22" x2="21" y2="22"/><rect x="3" y="10" width="4" height="12"/><rect x="10" y="10" width="4" height="12"/><rect x="17" y="10" width="4" height="12"/><path d="M12 2L2 10h20z"/>
              </svg>
              <p style={{ fontSize: 18, fontWeight: 700, color: t.text || '#111' }}>계좌</p>
              {accounts.length > 0 && <span style={{ fontSize: 12, color: t.primary, background: `${t.primary}15`, borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>{accounts.length}개</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowAccountNumbers(!showAccountNumbers)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: showAccountNumbers ? t.primary : '#bbb', lineHeight: 0 }}>
                {showAccountNumbers ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
              {smallBtn(() => setShowAddAccount(true), '+ 추가', t.primary, '#fff')}
            </div>
          </div>
          {accounts.map(acc => (
            <div key={acc.id} style={{ marginBottom: 10, background: t.card || '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              {/* 클릭 시 내역/수정/삭제 토글 */}
              <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => setExpandedAccountEditId(expandedAccountEditId === acc.id ? null : acc.id)}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: `${t.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="22" x2="21" y2="22"/><rect x="3" y="10" width="4" height="12"/><rect x="10" y="10" width="4" height="12"/><rect x="17" y="10" width="4" height="12"/><path d="M12 2L2 10h20z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: t.text || '#191F28' }}>{acc.name}</p>
                  {acc.number && <p style={{ fontSize: 12, color: '#C9CDD4', marginTop: 2 }}>{showAccountNumbers ? acc.number : maskAccountNumber(acc.number)}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: getAccountBalance(acc) < 0 ? '#FF5A5F' : t.text || '#191F28' }}>{fmt(getAccountBalance(acc))}원</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9CDD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
              {/* 내역/수정/삭제 펼침 행 */}
              {expandedAccountEditId === acc.id && (
                <div style={{ display: 'flex', borderTop: '1px solid #F2F4F6' }}>
                  <button onClick={e => {
                    e.stopPropagation()
                    setSelectedAccount(acc)
                    setAccountHistoryMonth(null)
                    setExpandedAccountEditId(null)
                  }} style={{ flex: 1, padding: '11px', border: 'none', background: t.card || '#fff', color: t.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    내역
                  </button>
                  <div style={{ width: 1, background: '#F2F4F6' }} />
                  <button onClick={() => {
                    handleEditAccount(acc)
                    setExpandedAccountEditId(null)
                  }} style={{ flex: 1, padding: '11px', border: 'none', background: t.card || '#fff', color: '#8B95A1', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    수정
                  </button>
                  <div style={{ width: 1, background: '#F2F4F6' }} />
                  <button onClick={e => { e.stopPropagation(); handleDeleteAccount(acc.id) }}
                    style={{ flex: 1, padding: '11px', border: 'none', background: t.card || '#fff', color: '#FF5A5F', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
          {/* 계좌 합계 */}
          {accounts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px 0', marginTop: 4, borderTop: '1px solid #F2F4F6' }}>
              <span style={{ fontSize: 13, color: '#8B95A1', fontWeight: 500 }}>계좌 합계</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: accounts.reduce((s,a) => s + getAccountBalance(a), 0) < 0 ? '#FF5A5F' : t.text || '#191F28' }}>
                {fmt(accounts.reduce((s,a) => s + getAccountBalance(a), 0))}원
              </span>
            </div>
          )}

          {/* 계좌 수정 bottom sheet */}
          {editingAccountId && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
              onClick={() => setEditingAccountId(null)}>
              <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E8EB', margin: '0 auto 20px' }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 20 }}>계좌 수정</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌 이름 <span style={{ color: '#FF5A5F' }}>*</span></p>
                    <input style={{ ...inputStyle }} placeholder="예: 국민은행" value={editAccountData.name} onChange={e => setEditAccountData(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>현재 잔액</p>
                    <input style={{ ...inputStyle }} type="number" placeholder="예: 1500000" value={editAccountData.balance} onChange={e => setEditAccountData(d => ({ ...d, balance: e.target.value }))} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌번호 <span style={{ fontSize: 12, color: '#C9CDD4', fontWeight: 400 }}>(선택)</span></p>
                    <input style={{ ...inputStyle }} placeholder="예: 1234-56-789012" value={editAccountData.number} onChange={e => setEditAccountData(d => ({ ...d, number: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button onClick={() => setEditingAccountId(null)}
                    style={{ flex: 1, height: 56, borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', color: '#8B95A1', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>취소</button>
                  <button onClick={handleSaveAccount}
                    style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: t.primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>저장</button>
                </div>
              </div>
            </div>
          )}
          {/* 계좌 추가 bottom sheet */}
          {showAddAccount && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
              onClick={() => { setShowAddAccount(false); setNewAccount({ name: '', balance: '', number: '' }) }}>
              <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E8EB', margin: '0 auto 20px' }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28', marginBottom: 20 }}>계좌 추가</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌 이름 <span style={{ color: '#FF5A5F' }}>*</span></p>
                    <input style={{ ...inputStyle }} placeholder="예: 국민은행" value={newAccount.name} onChange={e => setNewAccount(a => ({ ...a, name: e.target.value }))} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>잔액</p>
                    <input style={{ ...inputStyle }} type="number" placeholder="예: 1500000" value={newAccount.balance} onChange={e => setNewAccount(a => ({ ...a, balance: e.target.value }))} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>계좌번호 <span style={{ fontSize: 12, color: '#C9CDD4', fontWeight: 400 }}>(선택)</span></p>
                    <input style={{ ...inputStyle }} placeholder="예: 1234-56-789012" value={newAccount.number} onChange={e => setNewAccount(a => ({ ...a, number: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button onClick={() => { setShowAddAccount(false); setNewAccount({ name: '', balance: '', number: '' }) }}
                    style={{ flex: 1, height: 56, borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', color: '#8B95A1', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>취소</button>
                  <button onClick={handleAddAccount}
                    style={{ flex: 2, height: 56, borderRadius: 16, border: 'none', background: t.primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>추가</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 현금 */}
        <div style={{ background: `${t.primary}08`, borderRadius: 20, padding: '16px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <circle cx="12" cy="12" r="2"/>
                <path d="M6 12h.01M18 12h.01"/>
              </svg>
              <p style={{ fontSize: 18, fontWeight: 700, color: t.text || '#191F28' }}>현금</p>
            </div>
            {!editingCash && smallBtn(() => { setEditingCash(true); setCashInput(String(cash || '')) }, '수정', t.primary, '#fff')}
          </div>
          <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 10 }}>직접 보유한 현금 자산</p>
          {editingCash ? (
            <div>
              <input type="number" value={cashInput} onChange={e => setCashInput(e.target.value)} style={{ ...inputStyle, background: '#fff' }} placeholder="현금 잔액 입력" autoFocus />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setEditingCash(false)} style={{ flex: 1, padding: '10px', borderRadius: 16, border: '1.5px solid #E5E8EB', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#8B95A1' }}>취소</button>
                <button onClick={handleCashSave} style={{ flex: 1, padding: '10px', borderRadius: 16, border: 'none', background: t.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>저장</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 36, fontWeight: 700, color: t.text || '#191F28' }}>{fmt(getCashBalance())}원</p>
          )}
        </div>

      </div>

      {/* ── 설정 – 계층형 네비게이션 ── */}
      {settingsPage && (
          <div style={{ position: 'fixed', inset: 0, background: '#F7F8FA', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
            {/* 공통 헤더 */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 14px', background: '#fff', borderBottom: '1px solid #F2F4F6', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => settingsPage === 'root' ? setSettingsPage(null) : setSettingsPage('root')}
                  style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#191F28', padding: 0, lineHeight: 1 }}>‹</button>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{settingsPageTitle}</p>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 env(safe-area-inset-bottom, 20px)' }}>

              {/* ── ROOT ── */}
              {settingsPage === 'root' && (
                <div style={{ padding: '0 16px' }}>
                  {/* 기능 */}
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '20px 4px 8px', letterSpacing: 0.3 }}>기능</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
                    {[
                      { label: '홈', desc: '표시 옵션', page: 'home', bg: t.primary, icon: <SI><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SI> },
                      { label: '가계부', desc: '주 시작 요일, 정렬 순서, 표시 옵션', page: 'ledger', bg: t.primary, icon: <SI><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></SI> },
                      { label: '분석', desc: '탭 구성 옵션', page: 'analysis', bg: t.primary, icon: <SI><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SI> },
                      { label: 'MY', desc: '기능 관리', page: 'my', bg: t.primary, icon: <SI><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SI> },
                    ].map((item, i, arr) => (
                      <button key={item.page} onClick={() => setSettingsPage(item.page)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F2F4F6' : 'none' }}>
                        <SIcon bg={item.bg}>{item.icon}</SIcon>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>{item.label}</p>
                          <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>{item.desc}</p>
                        </div>
                        {settingsChevron}
                      </button>
                    ))}
                  </div>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
                    <button onClick={() => setSettingsPage('categories')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                      <SIcon bg={t.primary}><SI><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></SI></SIcon>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>카테고리 관리</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>지출 · 수입 카테고리 편집</p>
                      </div>
                      {settingsChevron}
                    </button>
                  </div>

                  {/* 디스플레이 */}
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>디스플레이</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
                    <button onClick={() => setSettingsPage('theme')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                      <SIcon bg={t.primary}><SI><circle cx="13.5" cy="6.5" r="1.5" fill="#fff" stroke="none"/><circle cx="17.5" cy="10.5" r="1.5" fill="#fff" stroke="none"/><circle cx="8.5" cy="7.5" r="1.5" fill="#fff" stroke="none"/><circle cx="6.5" cy="12.5" r="1.5" fill="#fff" stroke="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" stroke="#fff" fill="none"/></SI></SIcon>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>테마</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>앱 색상 테마 변경</p>
                      </div>
                      {settingsChevron}
                    </button>
                  </div>

                  {/* 데이터 */}
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>데이터</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
                    <button onClick={() => setSettingsPage('export')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                      <SIcon bg={t.primary}><SI><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></SI></SIcon>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>데이터 내보내기</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>엑셀 · PDF 파일로 저장</p>
                      </div>
                      {settingsChevron}
                    </button>
                  </div>

                  {/* 앱 정보 */}
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>앱 정보</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
                    <button onClick={() => window.open('https://gratis-corn-b7d.notion.site/moa-374125b81f2380b18331dce2355b06d3?source=copy_link', '_blank')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #F2F4F6' }}>
                      <SIcon bg={t.primary}><SI><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></SI></SIcon>
                      <p style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#191F28', textAlign: 'left' }}>이용 방법</p>
                      {settingsChevron}
                    </button>
                    <button onClick={() => setSettingsPage('updates')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #F2F4F6' }}>
                      <SIcon bg={t.primary}><SI><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></SI></SIcon>
                      <p style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#191F28', textAlign: 'left' }}>업데이트 내용</p>
                      <span style={{ fontSize: 12, color: '#8B95A1', marginRight: 6 }}>v1.5.0</span>
                      {settingsChevron}
                    </button>
                    <button onClick={() => window.location.href = 'mailto:0o0moa030@gmail.com?subject=모아 앱 피드백'}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                      <SIcon bg={t.primary}><SI><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SI></SIcon>
                      <p style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#191F28', textAlign: 'left' }}>피드백 보내기</p>
                      {settingsChevron}
                    </button>
                  </div>

                  {/* 계정 */}
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>계정</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>
                    <button onClick={() => signOut(auth).then(() => { localStorage.removeItem('moa_logged_in'); setSettingsPage(null); navigate('/', { replace: true }) })}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #F2F4F6' }}>
                      <SIcon bg="#6B7280"><SI><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></SI></SIcon>
                      <p style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#191F28', textAlign: 'left' }}>로그아웃</p>
                    </button>
                    <button onClick={() => { setDeleteChecked(false); setSettingsPage('delete-account') }}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                      <SIcon bg="#EF4444"><SI><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SI></SIcon>
                      <p style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#FF3B30', textAlign: 'left' }}>계정 탈퇴</p>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* ── 홈 설정 ── */}
              {settingsPage === 'home' && (
                <div style={{ padding: '8px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>표시 옵션</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>잔여 예산 이월</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>남은 예산을 다음 달로 이월해요</p>
                      </div>
                      <SToggle on={rolloverBudget} onChange={setRolloverBudget} primary={t.primary} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 가계부 설정 ── */}
              {settingsPage === 'ledger' && (
                <div style={{ padding: '8px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>주 시작 요일</p>
                  <div style={{ display: 'flex', background: '#E5E8EB', borderRadius: 16, padding: 4, marginBottom: 20 }}>
                    {[{ label: '월요일부터', val: 1 }, { label: '일요일부터', val: 0 }].map(opt => (
                      <button key={opt.val} onClick={() => setWeekStartDay(opt.val)}
                        style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: weekStartDay === opt.val ? 700 : 500, background: weekStartDay === opt.val ? t.primary : 'transparent', color: weekStartDay === opt.val ? '#fff' : '#8B95A1', transition: 'all 0.2s' }}>{opt.label}</button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '0 4px 8px', letterSpacing: 0.3 }}>정렬 순서</p>
                  <div style={{ display: 'flex', background: '#E5E8EB', borderRadius: 16, padding: 4, marginBottom: 20 }}>
                    {[{ label: '↓ 최신순', val: 'desc' }, { label: '↑ 오래된순', val: 'asc' }].map(opt => (
                      <button key={opt.val} onClick={() => setSortOrder(opt.val)}
                        style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: sortOrder === opt.val ? 700 : 500, background: sortOrder === opt.val ? t.primary : 'transparent', color: sortOrder === opt.val ? '#fff' : '#8B95A1', transition: 'all 0.2s' }}>{opt.label}</button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '0 4px 8px', letterSpacing: 0.3 }}>표시 옵션</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>체크카드 소액 신용 대금 표시</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>회색 표시, 지출 합계에서 제외</p>
                      </div>
                      <SToggle on={showCardBilling} onChange={setShowCardBilling} primary={t.primary} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 분석 설정 ── */}
              {settingsPage === 'analysis' && (
                <div style={{ padding: '8px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>탭 구성</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>공과금 탭 표시</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>분석 화면에 공과금 탭을 추가해요</p>
                      </div>
                      <SToggle on={showUtilities} onChange={(val) => {
                        setShowUtilities(val)
                        localStorage.setItem('moa_showUtilities', String(val))
                        if (user) setDoc(doc(db, 'users', user.uid), { showUtilities: val }, { merge: true })
                      }} primary={t.primary} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── MY 설정 ── */}
              {settingsPage === 'my' && (
                <div style={{ padding: '8px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '12px 4px 8px', letterSpacing: 0.3 }}>기능 관리</p>
                  <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: '#191F28' }}>대출 기능 사용</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>가계부에서 대출 / 상환 항목을 관리해요</p>
                      </div>
                      <SToggle on={showLoan} onChange={setShowLoan} primary={t.primary} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 카테고리 관리 ── */}
              {settingsPage === 'categories' && (
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ display: 'flex', background: '#E5E8EB', borderRadius: 16, padding: 4, margin: '12px 0 20px' }}>
                    {[{ label: '지출', val: 'expense' }, { label: '수입', val: 'income' }].map(opt => (
                      <button key={opt.val} onClick={() => setSettingsCatTab(opt.val)}
                        style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: settingsCatTab === opt.val ? 700 : 500, background: settingsCatTab === opt.val ? t.primary : 'transparent', color: settingsCatTab === opt.val ? '#fff' : '#8B95A1', transition: 'all 0.2s' }}>{opt.label}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {(categories[settingsCatTab] || []).map(cat => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 9999, padding: '7px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                        <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{cat}</span>
                        <button onClick={() => {
                          const updated = { ...categories, [settingsCatTab]: categories[settingsCatTab].filter(c => c !== cat) }
                          setCategories(updated)
                        }} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 17, padding: '0 2px', lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={settingsNewCatName} onChange={e => setSettingsNewCatName(e.target.value)}
                      placeholder="새 카테고리 이름"
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 16, border: '1.5px solid #E5E8EB', fontSize: 14, outline: 'none', background: '#fff' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && settingsNewCatName.trim()) {
                          const updated = { ...categories, [settingsCatTab]: [...(categories[settingsCatTab] || []), settingsNewCatName.trim()] }
                          setCategories(updated)
                          setSettingsNewCatName('')
                        }
                      }} />
                    <button onClick={() => {
                      if (!settingsNewCatName.trim()) return
                      const updated = { ...categories, [settingsCatTab]: [...(categories[settingsCatTab] || []), settingsNewCatName.trim()] }
                      setCategories(updated)
                      setSettingsNewCatName('')
                    }} style={{ padding: '12px 18px', borderRadius: 16, border: 'none', background: t.primary, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>추가</button>
                  </div>
                </div>
              )}

              {/* ── 테마 ── */}
              {settingsPage === 'theme' && (
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                    {Object.entries(THEMES).map(([key, val]) => (
                      <button key={key} onClick={() => handleThemeChange(key)}
                        style={{ padding: '16px 8px', borderRadius: 20, cursor: 'pointer', textAlign: 'center', border: themeName === key ? `2px solid ${val.primary}` : '2px solid #f0f0f0', background: themeName === key ? val.primary + '18' : '#fff' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: val.primary, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {themeName === key && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: themeName === key ? val.primary : '#555' }}>{val.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 데이터 내보내기 ── */}
              {settingsPage === 'export' && (
                <div style={{ padding: '20px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button onClick={exportToExcel} disabled={exporting}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 20, border: 'none', background: '#fff', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>엑셀로 내보내기</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>전체 내역을 .xlsx 파일로 저장</p>
                      </div>
                      {settingsChevron}
                    </button>
                    <button onClick={exportToPDF} disabled={exporting}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 20, border: 'none', background: '#fff', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>PDF로 내보내기</p>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>전체 내역을 .pdf 파일로 저장</p>
                      </div>
                      {settingsChevron}
                    </button>
                  </div>
                  {exporting && <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 16 }}>내보내는 중...</p>}
                </div>
              )}

              {/* ── 업데이트 내용 ── */}
              {settingsPage === 'updates' && (
                <div style={{ padding: '12px 16px 40px' }}>
                  {updatesList.map((v, i) => {
                    const isOpen = expandedVersion === v.version
                    return (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <button onClick={() => setExpandedVersion(isOpen ? null : v.version)}
                          style={{ width: '100%', background: isOpen ? '#f8f8f8' : '#fff', border: '1px solid #f0f0f0', borderRadius: isOpen ? '16px 16px 0 0' : 16, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{v.version}</span>
                            <span style={{ fontSize: 12, color: '#aaa' }}>{v.date}</span>
                          </div>
                          <span style={{ fontSize: 13, color: '#bbb', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                        </button>
                        {isOpen && (
                          <div style={{ background: '#f8f8f8', border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '12px 16px 16px' }}>
                            {v.changes.map((c, j) => (
                              <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: '#bbb', flexShrink: 0 }}>•</span>
                                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.5 }}>{c}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── 계정 탈퇴 STEP 1 ── */}
              {settingsPage === 'delete-account' && (
                <div style={{ padding: '20px 16px' }}>
                  <div style={{ background: '#FFF1F0', borderRadius: 20, padding: '20px', marginBottom: 20, border: '1px solid #FFE0DD' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#FF3B30', marginBottom: 12 }}>⚠️ 탈퇴 전 확인해 주세요</p>
                    {[
                      '모든 가계부 내역이 영구 삭제됩니다',
                      '예산, 고정지출 등 설정이 모두 삭제됩니다',
                      '카드, 계좌 등 MY 정보가 삭제됩니다',
                      '삭제된 데이터는 복구할 수 없습니다',
                    ].map((item, i, arr) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < arr.length - 1 ? 8 : 0 }}>
                        <span style={{ color: '#FF3B30', flexShrink: 0 }}>•</span>
                        <p style={{ fontSize: 14, color: '#FF3B30', lineHeight: 1.5 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setDeleteChecked(!deleteChecked)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 32 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${deleteChecked ? '#FF3B30' : '#C9CDD2'}`, background: deleteChecked ? '#FF3B30' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {deleteChecked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <p style={{ fontSize: 14, color: '#191F28', textAlign: 'left' }}>위 내용을 확인했으며, 탈퇴에 동의합니다</p>
                  </button>
                  <button onClick={() => deleteChecked && setShowDeleteModal(true)} disabled={!deleteChecked}
                    style={{ width: '100%', padding: '16px', borderRadius: 18, border: 'none', background: deleteChecked ? '#FF3B30' : '#F2F4F6', color: deleteChecked ? '#fff' : '#C9CDD2', fontSize: 16, fontWeight: 700, cursor: deleteChecked ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                    다음 단계로
                  </button>
                </div>
              )}

            </div>
          </div>
      )}

      {/* 계정 탈퇴 최종 확인 바텀시트 */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: '#fff', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 430, padding: '28px 24px calc(env(safe-area-inset-bottom, 0px) + 28px)' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8, textAlign: 'center' }}>정말 탈퇴할까요?</p>
            <p style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>모든 데이터가 영구적으로 삭제되며<br/>복구할 수 없습니다.</p>
            <button onClick={() => setShowDeleteModal(false)}
              style={{ width: '100%', padding: '16px', borderRadius: 18, border: 'none', background: t.primary, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
              계속 사용할게요
            </button>
            <button onClick={handleWithdrawAccount} disabled={deletingAccount}
              style={{ width: '100%', padding: '12px', border: 'none', background: 'none', color: deletingAccount ? '#C9CDD2' : '#FF3B30', fontSize: 14, fontWeight: 500, cursor: deletingAccount ? 'not-allowed' : 'pointer' }}>
              {deletingAccount ? '처리 중...' : '탈퇴하기'}
            </button>
          </div>
        </div>
      )}

      {/* 카드 상세 모달 */}
      {selectedCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 430, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* 카드 헤더 */}
                <div style={{ background: t.primary, padding: '24px 20px 20px', borderRadius: '28px 28px 0 0', color: '#fff', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <p style={{ fontSize: 18, fontWeight: 700 }}>{selectedCard.name}</p>
                        <button onClick={() => setSelectedCard(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                    <p style={{ fontSize: 18, letterSpacing: 4, marginBottom: 14, opacity: 0.9 }}>
                        **** **** **** {selectedCard.cardNumber || '****'}
                    </p>
                    <div style={{ display: 'flex', gap: 24 }}>
                        <div>
                            <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>유효기간</p>
                            <p style={{ fontSize: 13 }}>{selectedCard.expiry || '--/--'}</p>
                        </div>
                        {selectedCard.linkedAccount && (
                            <div>
                                <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>연동 계좌</p>
                                <p style={{ fontSize: 13 }}>{selectedCard.linkedAccount}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 혜택/내역 탭 */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                    {[{ key: 'benefits', label: '혜택' }, { key: 'history', label: '내역' }].map(tab => (
                        <button key={tab.key} onClick={() => setCardDetailTab(tab.key)}
                            style={{ flex: 1, padding: '14px', border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: 14, fontWeight: cardDetailTab === tab.key ? 600 : 400,
                                color: cardDetailTab === tab.key ? t.primary : '#888',
                                borderBottom: cardDetailTab === tab.key ? `2px solid ${t.primary}` : '2px solid transparent' }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 스크롤 콘텐츠 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {cardDetailTab === 'benefits' ? (
                        <div>
                            {(selectedCard.benefits || []).length === 0 && (
                                <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>혜택을 추가해보세요</p>
                            )}
                            {(selectedCard.benefits || []).map((b, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8f8f8' }}>
                                    <p style={{ fontSize: 14, color: '#333' }}>• {b}</p>
                                    <button onClick={() => {
                                        const updated = cards.map(c => c.id === selectedCard.id
                                            ? { ...c, benefits: c.benefits.filter((_, j) => j !== i) } : c)
                                        setCards(updated); saveToFirestore({ cards: updated })
                                        setSelectedCard(prev => ({ ...prev, benefits: prev.benefits.filter((_, j) => j !== i) }))
                                    }} style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 16 }}>✕</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            {/* 연/월 스크롤 선택 */}
                            {cardTransactions.length > 0 && (() => {
                                const availableMonths = [...new Set(
                                    cardTransactions.map(tx => tx.month || tx.date?.slice(0, 7) || '')
                                )].filter(Boolean).sort((a, b) => b.localeCompare(a))
                                return (
                                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
                                        <button onClick={() => setCardHistoryMonth(null)}
                                            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                                                background: cardHistoryMonth === null ? t.primary : '#f0f0f0',
                                                color: cardHistoryMonth === null ? '#fff' : '#666', fontSize: 12 }}>전체</button>
                                        {availableMonths.map(m => (
                                            <button key={m} onClick={() => setCardHistoryMonth(m)}
                                                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                                                    background: cardHistoryMonth === m ? t.primary : '#f0f0f0',
                                                    color: cardHistoryMonth === m ? '#fff' : '#666', fontSize: 12 }}>
                                                {m.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                                            </button>
                                        ))}
                                    </div>
                                )
                            })()}

                            {/* 내역 목록 */}
                            {cardTransactions.length === 0 ? (
                                <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>이 카드로 결제한 내역이 없어요</p>
                            ) : (() => {
                                const filtered = cardHistoryMonth
                                    ? cardTransactions.filter(tx => (tx.month || tx.date?.slice(0, 7)) === cardHistoryMonth)
                                    : cardTransactions
                                const byMonth = filtered.reduce((acc, tx) => {
                                    const m = tx.month || tx.date?.slice(0, 7) || '기타'
                                    if (!acc[m]) acc[m] = []
                                    acc[m].push(tx)
                                    return acc
                                }, {})
                                return filtered.length === 0 ? (
                                    <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>내역이 없어요</p>
                                ) : Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(month => (
                                    <div key={month}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: t.primary, whiteSpace: 'nowrap' }}>
                                                {month.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                                            </span>
                                            <div style={{ flex: 1, height: 0.5, background: '#e8e8e8' }} />
                                            <span style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>
                                                -{byMonth[month].filter(tx => tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0).toLocaleString()}원
                                            </span>
                                        </div>
                                        {byMonth[month].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(tx => (
                                            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
                                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                                                    <p style={{ fontSize: 14, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                                                    <p style={{ fontSize: 11, color: '#bbb' }}>{tx.date} · {tx.category}</p>
                                                </div>
                                                <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', color: tx.type === 'expense' ? '#ef4444' : '#22c55e' }}>
                                                    {tx.type === 'expense' ? '-' : '+'}{(tx.amount || 0).toLocaleString()}원
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            })()}
                        </div>
                    )}
                </div>

                {/* 혜택 입력 — 하단 고정 */}
                {cardDetailTab === 'benefits' && (
                    <div style={{ padding: '12px 20px 36px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input id="benefitInput" placeholder="혜택 입력 (예: 스타벅스 10% 할인)"
                                style={{ flex: 1, padding: '11px 14px', borderRadius: 16, border: '1.5px solid #e8e8e8', fontSize: 13, outline: 'none', background: '#fafafa' }} />
                            <button onClick={() => {
                                const val = document.getElementById('benefitInput').value.trim()
                                if (!val) return
                                const updated = cards.map(c => c.id === selectedCard.id
                                    ? { ...c, benefits: [...(c.benefits || []), val] } : c)
                                setCards(updated); saveToFirestore({ cards: updated })
                                setSelectedCard(prev => ({ ...prev, benefits: [...(prev.benefits || []), val] }))
                                document.getElementById('benefitInput').value = ''
                            }} style={{ padding: '11px 16px', borderRadius: 16, border: 'none', background: t.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>추가</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
      )}

      {/* 계좌 내역 바텀시트 */}
      {selectedAccount && (() => {
        const accTxns = allTxns.filter(tx => tx.payment === selectedAccount.name || tx.toAccount === selectedAccount.name)
        const availableMonths = [...new Set(
          accTxns.map(tx => tx.month || tx.date?.slice(0, 7) || '')
        )].filter(Boolean).sort((a, b) => b.localeCompare(a))
        const filtered = accountHistoryMonth
          ? accTxns.filter(tx => (tx.month || tx.date?.slice(0, 7)) === accountHistoryMonth)
          : accTxns
        const byMonth = filtered.reduce((acc, tx) => {
          const m = tx.month || tx.date?.slice(0, 7) || '기타'
          if (!acc[m]) acc[m] = []
          acc[m].push(tx)
          return acc
        }, {})
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setSelectedAccount(null)}>
            <div style={{ width: '100%', background: t.card || '#fff', borderRadius: '28px 28px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>
              {/* 헤더 */}
              <div style={{ background: t.primary, padding: '20px 20px 18px', borderRadius: '28px 28px 0 0', color: '#fff', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ fontSize: 17, fontWeight: 700 }}>{selectedAccount.name}</p>
                  <button onClick={() => setSelectedAccount(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
                {selectedAccount.number && (
                  <p style={{ fontSize: 13, opacity: 0.85, letterSpacing: 1 }}>{maskAccountNumber(selectedAccount.number)}</p>
                )}
              </div>

              {/* 월 필터 */}
              <div style={{ padding: '12px 16px 0', flexShrink: 0, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                  <button onClick={() => setAccountHistoryMonth(null)}
                    style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                      background: accountHistoryMonth === null ? t.primary : '#f0f0f0',
                      color: accountHistoryMonth === null ? '#fff' : '#666', fontSize: 12 }}>전체</button>
                  {availableMonths.map(m => (
                    <button key={m} onClick={() => setAccountHistoryMonth(m)}
                      style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                        background: accountHistoryMonth === m ? t.primary : '#f0f0f0',
                        color: accountHistoryMonth === m ? '#fff' : '#666', fontSize: 12 }}>
                      {m.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 내역 목록 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 36px' }}>
                {accTxns.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '24px 0' }}>이 계좌와 연동된 내역이 없어요</p>
                ) : filtered.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#bbb', textAlign: 'center', padding: '24px 0' }}>내역이 없어요</p>
                ) : Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(month => (
                  <div key={month}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: t.primary, whiteSpace: 'nowrap' }}>
                        {month.replace(/^(\d{4})-0?(\d+)$/, '$1년 $2월')}
                      </span>
                      <div style={{ flex: 1, height: 0.5, background: '#e8e8e8' }} />
                      <span style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>
                        -{byMonth[month].filter(tx => tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0).toLocaleString()}원
                      </span>
                    </div>
                    {byMonth[month].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', marginRight: 8 }}>
                          <p style={{ fontSize: 14, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                          <p style={{ fontSize: 11, color: '#bbb' }}>{tx.date} · {tx.category}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
                          color: tx.type === 'expense' ? '#ef4444' : tx.type === 'income' ? '#22c55e' : '#888' }}>
                          {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}{(tx.amount || 0).toLocaleString()}원
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      <BottomNav />
    </div>
  )
}