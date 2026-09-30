import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const purchasesState = vi.hoisted(() => ({ isPro: false, isSubscribed: false, isTrialActive: false, trialDaysLeft: 0 }))
vi.mock('../../contexts/PurchasesContext', () => ({
  usePurchases: () => ({ ...purchasesState }),
  useIsPro: () => purchasesState.isPro,
}))
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    themeData: { primary: '#3182F6', text: '#191F28', card: '#fff', bg: '#F2F4F6', primaryLight: '#E8F3FF' },
    neumorphism: true,
  }),
}))

import MyPageNeu from '../MyPageNeu'

const baseProps = {
  themeData: { primary: '#3182F6', text: '#191F28', card: '#fff', bg: '#F2F4F6' },
  loadError: null, fileRef: { current: null },
  setShowPaywall: vi.fn(),
  profileImg: null, handleProfileImg: vi.fn(),
  nickname: '모아', setNickname: vi.fn(), editingNick: false, setEditingNick: vi.fn(), handleNicknameSave: vi.fn(),
  user: { email: 'test@example.com' }, setSettingsPage: vi.fn(),
  fmt: (n) => Number(n).toLocaleString('ko-KR'), totalAsset: 0, accounts: [], getAccountBalance: () => 0, getCashBalance: () => 0,
  cards: [], setCards: vi.fn(), saveToFirestore: vi.fn(),
  showAddCard: false, setShowAddCard: vi.fn(),
  cardExitId: null, newCardId: null, highlightCardId: null,
  expandedCardId: null, setExpandedCardId: vi.fn(), getCardUsed: () => 0,
  setSelectedCard: vi.fn(), handleCardClick: vi.fn(),
  setEditingCardId: vi.fn(), setEditCardData: vi.fn(), handleDeleteCard: vi.fn(),
  editingCardId: null, editCardData: {},
  newCard: {}, setNewCard: vi.fn(), EMPTY_CARD: {},
  cardSaveState: null, handleAddCard: vi.fn(), handleSaveCard: vi.fn(),
  showAccountNumbers: false, setShowAccountNumbers: vi.fn(),
  setShowAddAccount: vi.fn(), expandedAccountEditId: null, setExpandedAccountEditId: vi.fn(),
  maskAccountNumber: (n) => n, setSelectedAccount: vi.fn(), setAccountHistoryMonth: vi.fn(),
  handleEditAccount: vi.fn(), handleDeleteAccount: vi.fn(),
  editingAccountId: null, setEditingAccountId: vi.fn(), editAccountData: {}, setEditAccountData: vi.fn(),
  handleSaveAccount: vi.fn(), showAddAccount: false, newAccount: {}, setNewAccount: vi.fn(), handleAddAccount: vi.fn(),
  editingCash: false, setEditingCash: vi.fn(), cashInput: '', setCashInput: vi.fn(), cash: 0, handleCashSave: vi.fn(),
  showLoan: true,
  loans: [
    { id: 'l1', name: '전세자금대출', principal: 120000000, remainingPrincipal: 98000000, rate: null, rateType: 'simple' },
  ],
  calcMonthlyInterest: () => 0,
  setSelectedLoan: vi.fn(), setLoanDetailSort: vi.fn(),
  expandedLoanId: null, setExpandedLoanId: vi.fn(),
  setLoanForm: vi.fn(), setEditingLoan: vi.fn(), handleDeleteLoan: vi.fn(), EMPTY_LOAN: {},
  showAddLoan: false, setShowAddLoan: vi.fn(), editingLoan: null, loanForm: {},
  handleAddLoan: vi.fn(), handleSaveLoan: vi.fn(),
  selectedCard: null, displayCard: {}, cardDetailTab: 'benefits', setCardDetailTab: vi.fn(),
  cardHistoryMonth: null, setCardHistoryMonth: vi.fn(), cardTransactions: [],
  selectedAccount: null, displayAccount: {}, accountHistoryMonth: null, allTxns: [],
  selectedLoan: null, displayLoan: null, loanDetailSort: 'desc', loanRepaymentTxns: [], loadingRepayments: false,
  deleteConfirmCard: null, setDeleteConfirmCard: vi.fn(), confirmDeleteCard: vi.fn(),
  undoSnackbar: false, handleUndo: vi.fn(),
}

describe('MyPageNeu — 대출 Pro 게이팅', () => {
  it('isPro=false면 잠금 화면을 보여주고 실제 대출 목록은 숨긴다', () => {
    purchasesState.isPro = false
    render(<MyPageNeu {...baseProps} />)
    expect(screen.getByText('✨ 대출 / 상환 관리')).toBeInTheDocument()
    expect(screen.getByText('Pro 구독하고 확인하기')).toBeInTheDocument()
    expect(screen.queryByText('전세자금대출')).not.toBeInTheDocument()
  })

  it('isPro=true면 실제 대출 목록을 보여주고 잠금 화면은 숨긴다', () => {
    purchasesState.isPro = true
    render(<MyPageNeu {...baseProps} />)
    expect(screen.getByText('전세자금대출')).toBeInTheDocument()
    expect(screen.queryByText('Pro 구독하고 확인하기')).not.toBeInTheDocument()
  })

  it('isSubscribed=true면 닉네임 옆에 Pro 구독자 배지가 뜬다', () => {
    purchasesState.isPro = true
    purchasesState.isSubscribed = true
    render(<MyPageNeu {...baseProps} />)
    expect(screen.getByText('✨ Pro 구독자')).toBeInTheDocument()
    purchasesState.isSubscribed = false
  })
})
