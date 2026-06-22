import { COLORS } from './theme'

// 공통 인풋 스타일
export const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 15,
  outline: 'none',
  background: COLORS.bgInput,
  color: COLORS.text,
  boxSizing: 'border-box',
}

// 페이지 래퍼
export const pageWrapper = {
  background: COLORS.bgPage,
  minHeight: '100vh',
  paddingBottom: 80,
}

// 헤더
export const headerStyle = {
  background: COLORS.bgCard,
  padding: '48px 24px 16px',
  borderBottom: `1px solid ${COLORS.borderLight}`,
}

// 카드 — radius 20px, padding 20px (Toss 기준)
export const cardStyle = {
  background: COLORS.bgCard,
  borderRadius: 20,
  padding: '20px',
  marginBottom: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
}

// 메인 버튼 (전체 너비) — height 56px, radius 16px
export const primaryBtnStyle = {
  width: '100%',
  height: 56,
  padding: '0 20px',
  borderRadius: 16,
  background: COLORS.primary,
  color: '#fff',
  border: 'none',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '-0.2px',
}

// 아웃라인 버튼
export const outlineBtnStyle = {
  width: '100%',
  height: 56,
  padding: '0 20px',
  borderRadius: 16,
  background: COLORS.bgCard,
  color: COLORS.text,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 16,
  fontWeight: 500,
  cursor: 'pointer',
}

// 필 버튼 (탭, 카테고리 선택 등)
export const pillBtn = (active, color = COLORS.primary) => ({
  padding: '7px 16px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  background: active ? color : COLORS.bgSurface,
  color: active ? '#fff' : COLORS.textSecondary,
  fontSize: 13,
  fontWeight: active ? 600 : 500,
})

// 소형 배지 버튼 (수정, 설정 등) — radius 최소 12px
export const badgeBtnStyle = (color = COLORS.primary) => ({
  background: color + '15',
  border: 'none',
  borderRadius: 12,
  padding: '6px 14px',
  color: color,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
})

// 구분선
export const divider = {
  height: 1,
  background: COLORS.borderLight,
  margin: '0',
}

// 합계 요약 카드 (지출/수입) — radius 20px
export const summaryCard = (color) => ({
  flex: 1,
  background: color + '12',
  borderRadius: 20,
  padding: '16px',
})

// 네비게이션 배너 (주간/월간 이동)
export const navBanner = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: COLORS.bgPage,
  borderRadius: 16,
  padding: '10px 16px',
  marginBottom: 12,
}

export const navBannerBtn = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  cursor: 'pointer',
  color: COLORS.textSecondary,
  padding: '0 8px',
}

export const navBannerText = {
  fontSize: 15,
  fontWeight: 600,
  color: COLORS.text,
}

// 모달 바텀시트 — radius 28px (Apple 기준)
export const bottomSheet = {
  background: COLORS.bgCard,
  borderRadius: '28px 28px 0 0',
  padding: '28px 24px 40px',
  width: '100%',
  maxWidth: 430,
  maxHeight: '88vh',
  overflowY: 'auto',
}

// 모달 오버레이
export const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 300,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
}

// 전체화면 폼
export const fullscreenForm = {
  position: 'fixed',
  inset: 0,
  background: COLORS.bgPage,
  zIndex: 200,
  overflowY: 'auto',
}

// 전체화면 폼 헤더
export const fullscreenHeader = {
  display: 'flex',
  alignItems: 'center',
  padding: '48px 24px 16px',
  borderBottom: `1px solid ${COLORS.borderLight}`,
  background: COLORS.bgCard,
  position: 'sticky',
  top: 0,
  zIndex: 10,
}

// 토글 스위치 트랙
export const toggleTrack = (on) => ({
  width: 48,
  height: 28,
  borderRadius: 14,
  background: on ? COLORS.primary : '#D1D5DB',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background 0.2s',
  flexShrink: 0,
})

// 토글 스위치 썸
export const toggleThumb = (on) => ({
  width: 22,
  height: 22,
  borderRadius: '50%',
  background: '#fff',
  position: 'absolute',
  top: 3,
  left: on ? 23 : 3,
  transition: 'left 0.2s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
})

// FAB (플로팅 추가 버튼) — radius 24px (floating element)
export const fabStyle = {
  position: 'fixed',
  bottom: 90,
  right: 'calc(50% - 215px + 20px)',
  width: 56,
  height: 56,
  borderRadius: 24,
  background: COLORS.primary,
  border: 'none',
  color: '#fff',
  fontSize: 28,
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(49,130,246,0.35)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}