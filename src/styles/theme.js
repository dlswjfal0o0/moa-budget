// 색상 팔레트
export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  danger: '#ef4444',
  dangerLight: '#FFF0F0',
  success: '#22c55e',
  successLight: '#F0FFF4',
  warning: '#f59e0b',
  text: '#111111',
  textSecondary: '#888888',
  textMuted: '#bbbbbb',
  bgPage: '#f8f8f8',
  bgCard: '#ffffff',
  bgInput: '#fafafa',
  bgSurface: '#f0f0f0',
  border: '#e8e8e8',
  borderLight: '#f0f0f0',
}

export const THEMES = {
  toss: {
    name: '기본',
    desc: '심플하고 직관적인 화이트&블루',
    bg: '#F2F4F6', primary: '#3182F6', primaryLight: '#E8F3FF',
    card: '#FFFFFF', text: '#191F28', bgClass: '',
  },
  pastelBlue: {
    name: '오션 블루',
    desc: '상쾌하고 시원한 블루 감성',
    bg: '#FFFFFF', primary: '#3A8BC7', primaryLight: '#C8E4F8',
    card: '#F0F8FF', text: '#1A3A5C', bgClass: 'theme-pastel-blue-bg',
  },
  pastelPink: {
    name: '빈티지 핑크',
    desc: '사랑스럽고 달콤한 핑크 감성',
    bg: '#FFFFFF', primary: '#C05070', primaryLight: '#FFD0DF',
    card: '#FFF0F5', text: '#5C1A30', bgClass: 'theme-pastel-pink-bg',
  },
  pastelPurple: {
    name: '퍼플',
    desc: '신비롭고 우아한 퍼플 감성',
    bg: '#FFFFFF', primary: '#7050B0', primaryLight: '#E0D0F8',
    card: '#F8F0FF', text: '#2A1050', bgClass: 'theme-pastel-purple-bg',
  },
  analog: {
    name: '스프링 그린',
    desc: '싱그러운 자연 그린 감성',
    bg: '#F3F7E8', primary: '#6E9E2E', primaryLight: '#D0E8A0',
    card: '#EDF5DC', text: '#364020', bgClass: '',
  },
  pinterest: {
    name: '핀터레스트',
    desc: '빈티지 엽서와 코지한 감성',
    bg: '#FBF9F6', primary: '#C88A82', primaryLight: '#F9EDEC',
    card: '#F2EFE9', text: '#5D534A', bgClass: '',
  },
}

export const CATEGORY_COLORS = {
  '식비': '#FF6B6B', '교통': '#4ECDC4', '쇼핑': '#45B7D1',
  '문화': '#96CEB4', '의료': '#FFD93D', '주거': '#C9B1FF',
  '통신': '#98D8C8', '기타': '#B0B0B0'
}

const EXTRA_COLORS = ['#FF8C69','#A8E6CF','#FFD3A5','#DEB8EA','#87CEEB','#F4A460','#98FB98','#F0E68C','#87CEFA','#DDA0DD']

export const getCategoryColor = (name) => {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name]
  const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return EXTRA_COLORS[hash % EXTRA_COLORS.length]
}

export const CATEGORY_ICONS = {
  식비: '🍽', 교통: '🚇', 쇼핑: '🛍', 문화: '🎬',
  의료: '💊', 주거: '🏠', 통신: '📱', 기타: '📦',
  급여: '💼', 부업: '💻', 용돈: '🎁', 투자: '📈'
}

// 기본 카테고리 목록
export const DEFAULT_CATEGORIES = {
  expense: ['식비', '교통', '쇼핑', '문화', '의료', '주거', '통신', '기타'],
  income: ['급여', '부업', '용돈', '투자', '기타']
}