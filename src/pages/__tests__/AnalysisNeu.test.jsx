import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const purchasesState = vi.hoisted(() => ({ isPro: false }))
vi.mock('../../contexts/PurchasesContext', () => ({
  usePurchases: () => ({ isPro: purchasesState.isPro, isSubscribed: false, isTrialActive: false, trialDaysLeft: 0 }),
  useIsPro: () => purchasesState.isPro,
}))

import AnalysisNeu from '../AnalysisNeu'

function makeProps(activeAnalysisTab) {
  return {
    showUtilities: true, loadError: null,
    setShowPaywall: vi.fn(),
    viewMonth: 8, viewYear: 2026, setViewYear: vi.fn(), setViewMonth: vi.fn(),
    monthSlideDir: null, triggerMonthSlide: vi.fn(),
    activeAnalysisTab, setActiveAnalysisTab: vi.fn(),
    primary: '#3182F6', primaryLight: '#E8F3FF', fmt: (n) => Number(n).toLocaleString('ko-KR'),
    totalExpense: 0, totalIncome: 0, lastTotalExpense: 0, lastTotalIncome: 0, expenseDiff: 0, incomeDiff: 0,
    dailyData: [], maxExpense: 0,
    categoryData: [], colorMap: {},
    aiFeedbackData: null, aiFeedbackRaw: '', loadingAi: false, getAiFeedback: vi.fn(),
    expenses: [],
    expandedPayments: {}, setExpandedPayments: vi.fn(),
    utilities: [
      { type: '관리비', amount: 89200, dueDate: '2026-09-20' },
    ],
    utilityTypes: ['관리비', '수도세', '전기세', '가스비'],
    currentMonthTotal: 89200, prevMonthTotal: 0, utilityTotalDiff: 89200,
    expandedUtilities: new Set(), toggleUtility: vi.fn(),
    utilityAI: null, loadingUtilityAI: false, getUtilityAI: vi.fn(),
    showAddUtility: false, setShowAddUtility: vi.fn(),
    editingUtility: null, setEditingUtility: vi.fn(),
    newUtility: {}, setNewUtility: vi.fn(), saveUtilities: vi.fn(),
  }
}

describe('AnalysisNeu — 공과금 탭 Pro 게이팅', () => {
  it('isPro=false면 공과금 탭에 ProBadge가 뜨고 클릭 시 탭이 전환되지 않는다', () => {
    purchasesState.isPro = false
    const props = makeProps('소비')
    render(<AnalysisNeu {...props} />)
    expect(screen.getByText('✨ PRO')).toBeInTheDocument()

    fireEvent.click(screen.getByText('공과금'))
    expect(props.setActiveAnalysisTab).not.toHaveBeenCalled()
    expect(props.setShowPaywall).toHaveBeenCalledWith(true)
  })

  it('isPro=false면 activeAnalysisTab이 이미 공과금이어도 공과금 콘텐츠는 렌더되지 않는다', () => {
    purchasesState.isPro = false
    render(<AnalysisNeu {...makeProps('공과금')} />)
    expect(screen.queryByText('이번 달 공과금 합계')).not.toBeInTheDocument()
  })

  it('isPro=true면 ProBadge 없이 공과금 탭 콘텐츠가 정상 렌더된다', () => {
    purchasesState.isPro = true
    render(<AnalysisNeu {...makeProps('공과금')} />)
    expect(screen.queryByText('✨ PRO')).not.toBeInTheDocument()
    expect(screen.getByText('이번 달 공과금 합계')).toBeInTheDocument()
  })
})
