import { auth, db } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import BottomSheet from '../components/BottomSheet'
import SToggle from '../components/SToggle'
import AIStyleSlider from '../components/AIStyleSlider'
import { requestPaymentNotificationPermission } from '../utils/paymentNotifications'
import { getColoredShadow } from '../utils/neuColors'

function NeuSIcon({ bg, children }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, boxShadow: getColoredShadow(bg).raisedSm, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {children}
    </div>
  )
}
function NeuSI({ color, ...props }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} />
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '20px 4px 8px', letterSpacing: 0.3 }}>{children}</p>
}

function SegTabs({ options, value, onChange, primary }) {
  return (
    <div className="neu-inset" style={{ display: 'flex', borderRadius: 16, padding: 4, marginBottom: 20 }}>
      {options.map(opt => {
        const sel = value === opt.val
        return (
          <button key={opt.val} onClick={() => onChange(opt.val)} className={sel ? 'neu-btn' : ''}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14,
              fontWeight: sel ? 700 : 500, color: sel ? primary : '#8B95A1', background: sel ? undefined : 'transparent' }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleRow({ title, desc, on, onChange, primary, borderBottom }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: borderBottom ? '1px solid rgba(163,177,198,0.25)' : 'none' }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>{title}</p>
        {desc && <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2, lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <SToggle on={on} onChange={onChange} primary={primary} />
    </div>
  )
}

const settingsChevron = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>

export default function SettingsNeu(props) {
  const {
    themeData, themeName, THEMES, handleThemeChange,
    settingsPage, setSettingsPage, settingsDirection, settingsPageTitle,
    user,
    neumorphism, setNeumorphism,
    rolloverBudget, setRolloverBudget,
    weekStartDay, setWeekStartDay, sortOrder, setSortOrder,
    showCardBilling, setShowCardBilling,
    showUtilities, setShowUtilities,
    showLoan, setShowLoan,
    aiAnalysisStyle, setAiAnalysisStyle, aiShowAdvice, setAiShowAdvice,
    notifyPaymentEnabled, setNotifyPaymentEnabled,
    notifyPaymentTime, setNotifyPaymentTime,
    notifyNightConsent, setNotifyNightConsent,
    notifyPermissionError, setNotifyPermissionError,
    categories, setCategories,
    settingsCatTab, setSettingsCatTab,
    settingsNewCatName, setSettingsNewCatName,
    fontScale, setFontScale,
    exportToExcel, exportToPDF, exporting,
    updatesList, expandedVersion, setExpandedVersion, APP_VERSION,
    deleteChecked, setDeleteChecked, setShowDeleteModal,
  } = props

  const primary = themeData.primary

  return (
    <BottomSheet variant="full" showHandle={false} background="var(--neu-bg)"
      open={!!settingsPage} onClose={() => setSettingsPage(null)}>
      <div className="neu-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => settingsPage === 'root' ? setSettingsPage(null) : setSettingsPage('root')} aria-label={settingsPage === 'root' ? '닫기' : '뒤로가기'} className="pressable"
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#191F28', padding: 0, lineHeight: 1 }}>‹</button>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>{settingsPageTitle}</p>
          </div>
        </div>

        <div key={settingsPage} style={{ flex: 1, overflowY: 'auto', padding: '0 0 env(safe-area-inset-bottom, 20px)',
          animation: `${settingsDirection === 'pop' ? 'pageEnterFromLeft' : 'pageEnterFromRight'} 240ms cubic-bezier(0.22,1,0.36,1) forwards` }}>

          {/* ── ROOT ── */}
          {settingsPage === 'root' && (
            <div style={{ padding: '0 20px' }}>
              <SectionLabel>기능</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { label: '홈', desc: '표시 옵션', page: 'home', icon: <NeuSI color="#fff"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></NeuSI> },
                  { label: '가계부', desc: '주 시작 요일, 정렬 순서, 표시 옵션', page: 'ledger', icon: <NeuSI color="#fff"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></NeuSI> },
                  { label: '분석', desc: '탭 구성 옵션', page: 'analysis', icon: <NeuSI color="#fff"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></NeuSI> },
                  { label: 'MY', desc: '기능 관리', page: 'my', icon: <NeuSI color="#fff"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></NeuSI> },
                  { label: 'AI 분석', desc: '분석 스타일, 조언 표시', page: 'ai', icon: <NeuSI color="#fff"><path d="M12 2a5 5 0 0 0-5 5c0 1.6.8 3 2 3.87V13a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.13c1.2-.87 2-2.27 2-3.87a5 5 0 0 0-5-5z" /><line x1="9" y1="19" x2="15" y2="19" /><line x1="10" y1="22" x2="14" y2="22" /></NeuSI> },
                  { label: '알림', desc: '다가오는 결제 알림', page: 'notifications', icon: <NeuSI color="#fff"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></NeuSI> },
                ].map((item, i, arr) => (
                  <button key={item.page} onClick={() => setSettingsPage(item.page)}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(163,177,198,0.25)' : 'none' }}>
                    <NeuSIcon bg={primary}>{item.icon}</NeuSIcon>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>{item.label}</p>
                      <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>{item.desc}</p>
                    </div>
                    {settingsChevron}
                  </button>
                ))}
              </div>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
                <button onClick={() => setSettingsPage('categories')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></NeuSI></NeuSIcon>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>카테고리 관리</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>지출 · 수입 카테고리 편집</p>
                  </div>
                  {settingsChevron}
                </button>
              </div>

              <SectionLabel>디스플레이</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
                <button onClick={() => setSettingsPage('theme')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(163,177,198,0.25)' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><circle cx="13.5" cy="6.5" r="1.5" fill="#fff" stroke="none" /><circle cx="17.5" cy="10.5" r="1.5" fill="#fff" stroke="none" /><circle cx="8.5" cy="7.5" r="1.5" fill="#fff" stroke="none" /><circle cx="6.5" cy="12.5" r="1.5" fill="#fff" stroke="none" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></NeuSI></NeuSIcon>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>테마</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>앱 색상 테마 변경</p>
                  </div>
                  {settingsChevron}
                </button>
                <button onClick={() => setSettingsPage('font-size')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></NeuSI></NeuSIcon>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>글자 크기</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>앱 전체 글자 크기 조절</p>
                  </div>
                  {settingsChevron}
                </button>
              </div>

              <SectionLabel>데이터</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
                <button onClick={() => setSettingsPage('export')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></NeuSI></NeuSIcon>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>데이터 내보내기</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 1 }}>엑셀 · PDF 파일로 저장</p>
                  </div>
                  {settingsChevron}
                </button>
              </div>

              <SectionLabel>앱 정보</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
                <button onClick={() => window.open('https://gratis-corn-b7d.notion.site/moa-374125b81f2380b18331dce2355b06d3?source=copy_link', '_blank')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(163,177,198,0.25)' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></NeuSI></NeuSIcon>
                  <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#191F28', textAlign: 'left' }}>이용 방법</p>
                  {settingsChevron}
                </button>
                <button onClick={() => setSettingsPage('updates')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(163,177,198,0.25)' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></NeuSI></NeuSIcon>
                  <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#191F28', textAlign: 'left' }}>업데이트 내용</p>
                  <span style={{ fontSize: 12, color: '#8B95A1', marginRight: 6 }}>v{APP_VERSION}</span>
                  {settingsChevron}
                </button>
                <button onClick={() => window.location.href = 'mailto:moa.studio030@gmail.com?subject=모아 앱 피드백'}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></NeuSI></NeuSIcon>
                  <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#191F28', textAlign: 'left' }}>피드백 보내기</p>
                  {settingsChevron}
                </button>
                <div style={{ height: 1, background: 'rgba(163,177,198,0.25)', margin: '0 16px' }} />
                <button onClick={() => window.open('https://moa-budget.vercel.app/terms.html', '_blank')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(163,177,198,0.25)' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></NeuSI></NeuSIcon>
                  <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#191F28', textAlign: 'left' }}>이용약관</p>
                  {settingsChevron}
                </button>
                <button onClick={() => window.open('https://moa-budget.vercel.app/privacy.html', '_blank')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <NeuSIcon bg={primary}><NeuSI color="#fff"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></NeuSI></NeuSIcon>
                  <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#191F28', textAlign: 'left' }}>개인정보 처리방침</p>
                  {settingsChevron}
                </button>
              </div>

              <SectionLabel>계정</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>
                <button onClick={() => {
                  Object.keys(localStorage).filter(k => k.startsWith('moa_')).forEach(k => localStorage.removeItem(k))
                  signOut(auth).finally(() => { window.location.href = '/' })
                }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(163,177,198,0.25)' }}>
                  <NeuSIcon bg="#6B7280"><NeuSI color="#fff"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></NeuSI></NeuSIcon>
                  <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#191F28', textAlign: 'left' }}>로그아웃</p>
                </button>
                <button onClick={() => { setDeleteChecked(false); setSettingsPage('delete-account') }}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <NeuSIcon bg="#EF4444"><NeuSI color="#fff"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></NeuSI></NeuSIcon>
                  <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#FF3B30', textAlign: 'left' }}>계정 탈퇴</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── 홈 설정 ── */}
          {settingsPage === 'home' && (
            <div style={{ padding: '0 20px' }}>
              <SectionLabel>표시 옵션</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <ToggleRow title="잔여 예산 이월" desc="남은 예산을 다음 달로 이월" on={rolloverBudget} onChange={setRolloverBudget} primary={primary} />
              </div>
            </div>
          )}

          {/* ── 가계부 설정 ── */}
          {settingsPage === 'ledger' && (
            <div style={{ padding: '0 20px' }}>
              <SectionLabel>주 시작 요일</SectionLabel>
              <SegTabs options={[{ label: '월요일부터', val: 1 }, { label: '일요일부터', val: 0 }]} value={weekStartDay} onChange={setWeekStartDay} primary={primary} />
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '0 4px 8px', letterSpacing: 0.3 }}>정렬 순서</p>
              <SegTabs options={[{ label: '↓ 최신순', val: 'desc' }, { label: '↑ 오래된순', val: 'asc' }]} value={sortOrder} onChange={setSortOrder} primary={primary} />
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '0 4px 8px', letterSpacing: 0.3 }}>표시 옵션</p>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <ToggleRow title="체크카드 소액 신용 대금 표시" desc="회색 표시, 지출 합계에서 제외" on={showCardBilling} onChange={setShowCardBilling} primary={primary} />
              </div>
            </div>
          )}

          {/* ── 분석 설정 ── */}
          {settingsPage === 'analysis' && (
            <div style={{ padding: '0 20px' }}>
              <SectionLabel>탭 구성</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <ToggleRow title="공과금 탭 표시" desc="분석 화면에 공과금 탭을 추가"
                  on={showUtilities} onChange={val => {
                    setShowUtilities(val)
                    localStorage.setItem('moa_showUtilities', String(val))
                    if (user) setDoc(doc(db, 'users', user.uid), { showUtilities: val }, { merge: true })
                  }} primary={primary} />
              </div>
            </div>
          )}

          {/* ── MY 설정 ── */}
          {settingsPage === 'my' && (
            <div style={{ padding: '0 20px' }}>
              <SectionLabel>기능 관리</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <ToggleRow title="대출 기능 사용" desc="가계부 및 MY에서 대출 / 상환 항목 관리" on={showLoan} onChange={setShowLoan} primary={primary} />
              </div>
            </div>
          )}

          {/* ── AI 분석 설정 ── */}
          {settingsPage === 'ai' && (
            <div style={{ padding: '0 20px' }}>
              <SectionLabel>분석 스타일</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 20 }}>
                <AIStyleSlider value={aiAnalysisStyle} onChange={setAiAnalysisStyle} primary={primary} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '0 4px 8px', letterSpacing: 0.3 }}>조언 표시</p>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <ToggleRow title="조언" desc="분석 결과와 함께 실천 방법을 제안" on={aiShowAdvice} onChange={setAiShowAdvice} primary={primary} />
              </div>
            </div>
          )}

          {/* ── 알림 설정 ── */}
          {settingsPage === 'notifications' && (
            <div style={{ padding: '0 20px' }}>
              <SectionLabel>다가오는 결제 알림</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
                <ToggleRow title="결제 알림 받기" desc="고정지출 결제일 전날 알림을 보내드려요"
                  on={notifyPaymentEnabled} onChange={async (val) => {
                    setNotifyPermissionError('')
                    if (val) {
                      const granted = await requestPaymentNotificationPermission()
                      if (!granted) { setNotifyPermissionError('기기 설정에서 알림 권한을 허용해주세요.'); return }
                    }
                    setNotifyPaymentEnabled(val)
                  }} primary={primary} borderBottom />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', opacity: notifyPaymentEnabled ? 1 : 0.4 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>알림 시각</p>
                  <input type="time" className="neu-inset" value={notifyPaymentTime} disabled={!notifyPaymentEnabled}
                    onChange={e => setNotifyPaymentTime(e.target.value)}
                    style={{ border: 'none', borderRadius: 10, padding: '8px 10px', fontSize: 14, color: '#191F28' }} />
                </div>
              </div>
              {notifyPermissionError && (
                <p style={{ fontSize: 12, color: '#ef4444', padding: '0 4px 12px' }}>{notifyPermissionError}</p>
              )}
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', padding: '0 4px 8px', letterSpacing: 0.3 }}>심야시간 알림 동의</p>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <ToggleRow title="심야시간(21시~08시) 알림 수신 동의"
                  desc={<>정보통신망법에 따라 심야시간 알림 발송에는 별도 동의가 필요해요.<br />동의하지 않으면 다음날 오전 8시에 보내드려요.</>}
                  on={notifyNightConsent} onChange={setNotifyNightConsent} primary={primary} />
              </div>
            </div>
          )}

          {/* ── 카테고리 관리 ── */}
          {settingsPage === 'categories' && (
            <div style={{ padding: '0 20px', '--neu-focus': primary + '59' }}>
              <SegTabs options={[{ label: '지출', val: 'expense' }, { label: '수입', val: 'income' }]} value={settingsCatTab} onChange={setSettingsCatTab} primary={primary} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(categories[settingsCatTab] || []).map(cat => (
                  <div key={cat} className="neu-card" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 9999, padding: '7px 10px' }}>
                    <span style={{ fontSize: 13, color: '#191F28', fontWeight: 500 }}>{cat}</span>
                    <button onClick={() => {
                      const updated = { ...categories, [settingsCatTab]: categories[settingsCatTab].filter(c => c !== cat) }
                      setCategories(updated)
                    }} aria-label={`${cat} 삭제`} style={{ background: 'none', border: 'none', color: '#8B95A1', cursor: 'pointer', fontSize: 17, padding: '0 2px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="neu-inset" value={settingsNewCatName} onChange={e => setSettingsNewCatName(e.target.value)}
                  placeholder="새 카테고리 이름"
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 16, border: 'none', fontSize: 14, outline: 'none', color: '#191F28' }}
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
                }} className="neu-btn" style={{ padding: '12px 18px', borderRadius: 16, color: primary, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>추가</button>
              </div>
            </div>
          )}

          {/* ── 테마 ── */}
          {settingsPage === 'theme' && (
            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                {Object.entries(THEMES).map(([key, val]) => {
                  const sel = themeName === key
                  return (
                    <button key={key} onClick={() => handleThemeChange(key)} className={sel ? 'neu-inset' : 'neu-card'}
                      style={{ padding: '16px 8px', borderRadius: 20, cursor: 'pointer', textAlign: 'center', border: 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: val.primary, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: sel ? val.primary : '#8B95A1' }}>{val.name}</p>
                    </button>
                  )
                })}
              </div>

              <SectionLabel>화면 스타일</SectionLabel>
              <div className="neu-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <ToggleRow title="뉴모피즘 (베타)" desc="앱 전체와 하단바를 소프트 UI(음각/양각) 스타일로 표시"
                  on={neumorphism} onChange={val => {
                    setNeumorphism(val)
                    if (user) setDoc(doc(db, 'users', user.uid), { neumorphism: val, navNeumorphism: val }, { merge: true })
                  }} primary={primary} />
              </div>
            </div>
          )}

          {/* ── 글자 크기 ── */}
          {settingsPage === 'font-size' && (
            <div style={{ padding: '0 20px' }}>
              <p style={{ fontSize: 12, color: '#8B95A1', padding: '20px 4px 12px' }}>화면 확대는 앱 특성상 지원하지 않아, 대신 글자 크기를 조절할 수 있어요.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '작게', value: 0.9 },
                  { label: '보통', value: 1 },
                  { label: '크게', value: 1.15 },
                  { label: '아주 크게', value: 1.3 },
                ].map((opt) => {
                  const sel = fontScale === opt.value
                  return (
                    <button key={opt.value} onClick={() => setFontScale(opt.value)} className={sel ? 'neu-inset' : 'neu-card'}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, cursor: 'pointer', border: 'none' }}>
                      <span style={{ fontSize: 15 * opt.value, fontWeight: 600, color: sel ? primary : '#191F28' }}>{opt.label}</span>
                      {sel && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 데이터 내보내기 ── */}
          {settingsPage === 'export' && (
            <div style={{ padding: '20px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={exportToExcel} disabled={exporting} className="neu-card"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, border: 'none', cursor: 'pointer' }}>
                  <div className="neu-inset" style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>엑셀로 내보내기</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>전체 내역을 .xlsx 파일로 저장</p>
                  </div>
                  {settingsChevron}
                </button>
                <button onClick={exportToPDF} disabled={exporting} className="neu-card"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, border: 'none', cursor: 'pointer' }}>
                  <div className="neu-inset" style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>PDF로 내보내기</p>
                    <p style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>전체 내역을 .pdf 파일로 저장</p>
                  </div>
                  {settingsChevron}
                </button>
              </div>
              {exporting && <p style={{ textAlign: 'center', color: '#8B95A1', fontSize: 13, marginTop: 16 }}>내보내는 중...</p>}
            </div>
          )}

          {/* ── 업데이트 내용 ── */}
          {settingsPage === 'updates' && (
            <div style={{ padding: '12px 16px 40px' }}>
              {updatesList.map((v, i) => {
                const isOpen = expandedVersion === v.version
                return (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <button onClick={() => setExpandedVersion(isOpen ? null : v.version)} className="neu-card"
                      style={{ width: '100%', border: 'none', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>{v.version}</span>
                        <span style={{ fontSize: 12, color: '#8B95A1' }}>{v.date}</span>
                      </div>
                      <span style={{ fontSize: 13, color: '#8B95A1', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                    </button>
                    {isOpen && (
                      <div className="neu-inset" style={{ borderRadius: 16, padding: '12px 16px 16px', marginTop: 8 }}>
                        {v.changes.map((c, j) => (
                          <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: '#8B95A1', flexShrink: 0 }}>•</span>
                            <p style={{ fontSize: 14, color: '#191F28', lineHeight: 1.5 }}>{c}</p>
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
              <div className="neu-inset" style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}>
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
                <div className={deleteChecked ? 'neu-btn' : 'neu-inset'} style={{ width: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {deleteChecked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <p style={{ fontSize: 14, color: '#191F28', textAlign: 'left' }}>위 내용을 확인했으며, 탈퇴에 동의합니다</p>
              </button>
              <button onClick={() => deleteChecked && setShowDeleteModal(true)} disabled={!deleteChecked} className={deleteChecked ? 'neu-btn' : 'neu-inset'}
                style={{ width: '100%', padding: 16, borderRadius: 18, color: deleteChecked ? '#FF3B30' : '#8B95A1', fontSize: 16, fontWeight: 700, cursor: deleteChecked ? 'pointer' : 'not-allowed' }}>
                다음 단계로
              </button>
            </div>
          )}

        </div>
      </div>
    </BottomSheet>
  )
}
