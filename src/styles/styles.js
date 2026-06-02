import { COLORS } from './theme'

// 공통 인풋 스타일
export const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
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
  padding: '48px 20px 16px',
  borderBottom: `1px solid ${COLORS.borderLight}`,
}

// 카드
export const cardStyle = {
  background: COLORS.bgCard,
  borderRadius: 16,
  padding: '16px',
  marginBottom: 16,
}

// 메인 버튼 (전체 너비)
export const primaryBtnStyle = {
  width: '100%',
  padding: '15px',
  borderRadius: 14,
  background: COLORS.primary,
  color: '#fff',
  border: 'none',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
}

// 아웃라인 버튼
export const outlineBtnStyle = {
  width: '100%',
  padding: '15px',
  borderRadius: 14,
  background: COLORS.bgCard,
  color: COLORS.text,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 16,
  fontWeight: 500,
  cursor: 'pointer',
}

// 필 버튼 (탭, 카테고리 선택 등)
export const pillBtn = (active, color = COLORS.primary) => ({
  padding: '6px 14px',
  borderRadius: 9999,
  border: 'none',
  cursor: 'pointer',
  background: active ? color : COLORS.bgSurface,
  color: active ? '#fff' : COLORS.textSecondary,
  fontSize: 13,
  fontWeight: 500,
})

// 소형 배지 버튼 (수정, 설정 등)
export const badgeBtnStyle = (color = COLORS.primary) => ({
  background: color + '1A',
  border: 'none',
  borderRadius: 8,
  padding: '5px 12px',
  color: color,
  fontSize: 12,
  cursor: 'pointer',
})

// 구분선
export const divider = {
  height: 1,
  background: COLORS.borderLight,
  margin: '0',
}

// 합계 요약 카드 (지출/수입)
export const summaryCard = (color) => ({
  flex: 1,
  background: color + '18',
  borderRadius: 12,
  padding: '12px',
})

// 네비게이션 배너 (주간/월간 이동)
export const navBanner = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: COLORS.bgPage,
  borderRadius: 10,
  padding: '8px 12px',
  marginBottom: 10,
}

export const navBannerBtn = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: COLORS.textSecondary,
  padding: '0 8px',
}

export const navBannerText = {
  fontSize: 14,
  fontWeight: 500,
  color: COLORS.text,
}

// 모달 바텀시트
export const bottomSheet = {
  background: COLORS.bgCard,
  borderRadius: '20px 20px 0 0',
  padding: '24px 20px 40px',
  width: '100%',
  maxWidth: 430,
  maxHeight: '85vh',
  overflowY: 'auto',
}

// 모달 오버레이
export const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 300,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
}

// 전체화면 폼
export const fullscreenForm = {
  position: 'fixed',
  inset: 0,
  background: COLORS.bgCard,
  zIndex: 200,
  overflowY: 'auto',
}

// 전체화면 폼 헤더
export const fullscreenHeader = {
  display: 'flex',
  alignItems: 'center',
  padding: '48px 20px 16px',
  borderBottom: `1px solid ${COLORS.borderLight}`,
  background: COLORS.bgCard,
  position: 'sticky',
  top: 0,
  zIndex: 10,
}

// 토글 스위치 트랙
export const toggleTrack = (on) => ({
  width: 44,
  height: 26,
  borderRadius: 13,
  background: on ? COLORS.primary : '#ddd',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background 0.2s',
  flexShrink: 0,
})

// 토글 스위치 썸
export const toggleThumb = (on) => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: '#fff',
  position: 'absolute',
  top: 3,
  left: on ? 21 : 3,
  transition: 'left 0.2s',
})

// FAB (플로팅 추가 버튼)
export const fabStyle = {
  position: 'fixed',
  bottom: 90,
  right: 'calc(50% - 215px + 16px)',
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: COLORS.primary,
  border: 'none',
  color: '#fff',
  fontSize: 28,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
  zIndex: 50,
}