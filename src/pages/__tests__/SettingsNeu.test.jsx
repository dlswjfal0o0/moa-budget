import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const purchasesState = vi.hoisted(() => ({ isPro: false }))
vi.mock('../../contexts/PurchasesContext', () => ({
  usePurchases: () => ({ isPro: purchasesState.isPro, isSubscribed: false, isTrialActive: false, trialDaysLeft: 0 }),
  useIsPro: () => purchasesState.isPro,
}))
// SettingsNeu.jsx가 로그아웃/설정 저장에 실제 Firebase auth/db 인스턴스를 쓰므로,
// 렌더 시점에 진짜 Firebase 앱을 초기화하지 않도록 모킹한다.
vi.mock('../../firebase/config', () => ({ auth: {}, db: {} }))

import SettingsNeu from '../SettingsNeu'

const baseProps = {
  themeData: { primary: '#3182F6', text: '#191F28', card: '#fff', bg: '#F2F4F6' },
  themeName: 'toss', THEMES: {}, handleThemeChange: vi.fn(),
  settingsPage: 'export', setSettingsPage: vi.fn(), settingsDirection: 'push', settingsPageTitle: '데이터 내보내기',
  user: { uid: 'u1' },
  neumorphism: true, setNeumorphism: vi.fn(),
  setShowPaywall: vi.fn(),
  rolloverBudget: false, setRolloverBudget: vi.fn(),
  weekStartDay: 1, setWeekStartDay: vi.fn(), sortOrder: 'desc', setSortOrder: vi.fn(),
  showCardBilling: false, setShowCardBilling: vi.fn(),
  showUtilities: false, setShowUtilities: vi.fn(),
  showLoan: true, setShowLoan: vi.fn(),
  aiAnalysisStyle: 2, setAiAnalysisStyle: vi.fn(), aiShowAdvice: true, setAiShowAdvice: vi.fn(),
  notifyPaymentEnabled: false, setNotifyPaymentEnabled: vi.fn(),
  notifyPaymentTime: '09:00', setNotifyPaymentTime: vi.fn(),
  notifyNightConsent: false, setNotifyNightConsent: vi.fn(),
  notifyPermissionError: '', setNotifyPermissionError: vi.fn(),
  categories: { expense: [], income: [] }, setCategories: vi.fn(),
  settingsCatTab: 'expense', setSettingsCatTab: vi.fn(),
  settingsNewCatName: '', setSettingsNewCatName: vi.fn(),
  fontScale: 1, setFontScale: vi.fn(),
  exportToExcel: vi.fn(), exportToPDF: vi.fn(), exporting: false,
  updatesList: [], expandedVersion: null, setExpandedVersion: vi.fn(), APP_VERSION: '1.0.0',
  deleteChecked: false, setDeleteChecked: vi.fn(), setShowDeleteModal: vi.fn(),
}

describe('SettingsNeu — 엑셀/PDF 내보내기 Pro 게이팅', () => {
  it('isPro=false면 ProBadge가 뜨고 클릭해도 내보내기가 실행되지 않는다', () => {
    purchasesState.isPro = false
    const props = baseProps
    render(<SettingsNeu {...props} />)
    expect(screen.getAllByText('✨ PRO')).toHaveLength(2)

    fireEvent.click(screen.getByText('엑셀로 내보내기'))
    expect(props.exportToExcel).not.toHaveBeenCalled()
    expect(props.setShowPaywall).toHaveBeenCalledWith(true)
  })

  it('isPro=true면 ProBadge 없이 클릭 시 실제 내보내기 함수가 호출된다', () => {
    purchasesState.isPro = true
    const props = { ...baseProps, exportToExcel: vi.fn(), exportToPDF: vi.fn(), setShowPaywall: vi.fn() }
    render(<SettingsNeu {...props} />)
    expect(screen.queryByText('✨ PRO')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('PDF로 내보내기'))
    expect(props.exportToPDF).toHaveBeenCalled()
    expect(props.setShowPaywall).not.toHaveBeenCalled()
  })
})
