import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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

import CalendarNeu from '../CalendarNeu'

const baseProps = {
  themeData: { primary: '#3182F6', text: '#191F28', card: '#fff', bg: '#F2F4F6' },
  loadError: null,
  setShowPaywall: vi.fn(),
  viewYear: 2026, setViewYear: vi.fn(), viewMonth: 8, setViewMonth: vi.fn(),
  showYMPicker: false, setShowYMPicker: vi.fn(),
  days: [null, null, 1, 2, 3, 4, 5],
  firstDay: 2,
  byDate: {},
  todayStr: '2026-09-05',
  selectedDate: null, setSelectedDate: vi.fn(),
  fixedDueDays: [5],
  selectedTxs: [], isCreditExcluded: () => false, showLoan: false,
  weekExpense: 0, weekIncome: 0, totalExpense: 0, totalIncome: 0,
  fmt: (n) => Number(n).toLocaleString('ko-KR'),
  fixedExpenses: [
    { id: 'x1', title: '월세', amount: 550000, dueDate: '2026-09-05', doneMonths: [] },
  ],
  fixedTotal: 550000,
  sortedFixed: [
    { id: 'x1', title: '월세', amount: 550000, dueDate: '2026-09-05', doneMonths: [] },
  ],
  currentMonthKey: '2026-09',
  setShowAddFixed: vi.fn(),
  expandedFixedId: null, setExpandedFixedId: vi.fn(),
  handleToggleFixed: vi.fn(), handleDeleteFixed: vi.fn(),
  setEditingFixedId: vi.fn(), setEditFixedData: vi.fn(),
  editingFixedId: null, editFixedData: {}, handleSaveFixed: vi.fn(),
  showAddFixed: false, newFixed: {}, setNewFixed: vi.fn(), EMPTY_FIXED: {}, handleAddFixed: vi.fn(),
  categories: [], accNames: [], userCards: [],
  showCardSelector: false, setShowCardSelector: vi.fn(),
  showAccountSelector: false, setShowAccountSelector: vi.fn(),
}

describe('CalendarNeu — 고정지출 Pro 게이팅', () => {
  it('isPro=false면 잠금 화면을 보여주고 실제 고정지출 목록은 숨긴다', () => {
    purchasesState.isPro = false
    render(<CalendarNeu {...baseProps} />)
    expect(screen.getByText('✨ 고정지출 & 다가오는 결제')).toBeInTheDocument()
    expect(screen.getByText('Pro 구독하고 확인하기')).toBeInTheDocument()
    expect(screen.queryByText('월세')).not.toBeInTheDocument()
  })

  it('isPro=true면 실제 고정지출 목록을 보여주고 잠금 화면은 숨긴다', () => {
    purchasesState.isPro = true
    render(<CalendarNeu {...baseProps} />)
    expect(screen.getByText('월세')).toBeInTheDocument()
    expect(screen.queryByText('Pro 구독하고 확인하기')).not.toBeInTheDocument()
  })
})
