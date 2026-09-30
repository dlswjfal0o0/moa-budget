import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// isPro를 테스트별로 바꿔가며 렌더하기 위해 컨텍스트 모듈 자체를 모킹한다
// (실제 Firebase/RevenueCat 초기화 없이 순수 프레젠테이션 컴포넌트만 검증).
const purchasesState = vi.hoisted(() => ({ isPro: false }))
vi.mock('../../contexts/PurchasesContext', () => ({
  usePurchases: () => ({ isPro: purchasesState.isPro, isSubscribed: false, isTrialActive: false, trialDaysLeft: 0 }),
  useIsPro: () => purchasesState.isPro,
}))
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    themeData: { primary: '#3182F6', text: '#191F28', card: '#fff', bg: '#F2F4F6', primaryLight: '#E8F3FF' },
    neumorphism: true,
  }),
}))

import HomeNeu from '../HomeNeu'

const baseProps = {
  loadError: null,
  themeData: { primary: '#3182F6', text: '#191F28', card: '#fff', bg: '#F2F4F6' },
  setShowPaywall: vi.fn(),
  now: new Date('2026-09-05'),
  fmt: (n) => Number(n).toLocaleString('ko-KR'),
  totalIncome: 0,
  totalExpense: 0,
  budgets: [],
  budgetsWithStats: [],
  showAddBudget: false, setShowAddBudget: vi.fn(),
  newBudget: { label: '', startDate: '', endDate: '', amount: '', categories: [] }, setNewBudget: vi.fn(),
  allExpenseCategories: [],
  handleAddBudget: vi.fn(),
  editingBudgetId: null, setEditingBudgetId: vi.fn(),
  editBudgetData: {}, setEditBudgetData: vi.fn(),
  handleSaveBudget: vi.fn(),
  expandedBudgetEditId: null, setExpandedBudgetEditId: vi.fn(),
  expandedTipIds: {}, setExpandedTipIds: vi.fn(),
  loadingInsightId: null, getAiInsight: vi.fn(),
  saveBudgets: vi.fn(),
  upcomingPayments: [
    { id: 'f1', title: '월세', amount: 550000, daysLeft: 0, dueDay: 5 },
  ],
  categoryData: [],
  colorMap: {},
  transactions: [],
  navigate: vi.fn(),
}

describe('HomeNeu — 다가오는 결제 Pro 게이팅', () => {
  it('isPro=false면 잠금 화면을 보여주고 실제 결제 목록은 숨긴다', () => {
    purchasesState.isPro = false
    render(<HomeNeu {...baseProps} />)
    expect(screen.getByText('다가오는 결제')).toBeInTheDocument()
    expect(screen.getByText('Pro 구독하고 확인하기')).toBeInTheDocument()
    expect(screen.queryByText('월세')).not.toBeInTheDocument()
  })

  it('isPro=true면 실제 결제 목록을 보여주고 잠금 화면은 숨긴다', () => {
    purchasesState.isPro = true
    render(<HomeNeu {...baseProps} />)
    expect(screen.getByText('월세')).toBeInTheDocument()
    expect(screen.queryByText('Pro 구독하고 확인하기')).not.toBeInTheDocument()
  })
})
