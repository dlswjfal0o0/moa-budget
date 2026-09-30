import { useTheme } from '../contexts/ThemeContext'
import { getColoredShadow } from '../utils/neuColors'

// Pro 전용 기능 옆에 붙는 마크. 테마 색을 따라가도록 primary 배경을 쓴다.
export function ProBadge({ style }) {
  const { themeData: t } = useTheme() || {}
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: '#fff', background: t?.primary || '#3182F6',
      padding: '2px 6px', borderRadius: 6, letterSpacing: 0.3, lineHeight: 1.3, flexShrink: 0, ...style,
    }}>PRO</span>
  )
}

// 닉네임 옆에 붙는 구독 등급 마크. 유료 구독 중엔 Pro, 아니면(무료체험 포함) 일반으로 표시.
// 테마색 헤더 배너 위에 올라가므로 흰색 반투명 톤을 쓴다.
// onPress를 넘기면 버튼으로 동작한다 (MY에서 누르면 구독 안내가 열림).
export function SubscriptionBadge({ isSubscribed, onPress, style }) {
  const Tag = onPress ? 'button' : 'span'
  return (
    <Tag onClick={onPress} aria-label={onPress ? (isSubscribed ? 'Pro 구독 관리' : 'Pro 구독 안내 보기') : undefined} style={{
      border: 'none', cursor: onPress ? 'pointer' : undefined, fontFamily: 'inherit', lineHeight: 'normal',
      fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap',
      color: isSubscribed ? '#fff' : 'rgba(255,255,255,0.85)',
      background: isSubscribed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
      ...style,
    }}>{isSubscribed ? '✨ Pro' : '일반'}</Tag>
  )
}

function LockIcon({ color = '#191F28', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// 무료 유저에게 잠긴 기능 자리를 대체해 보여주는 공용 컴포넌트.
// variant='card': 섹션 전체 대체용, variant='compact': 한 줄짜리 인라인 잠금 표시용
export default function LockedFeature({ title, description, onPress, variant = 'card' }) {
  const { themeData: t, neumorphism } = useTheme() || {}
  const primary = t?.primary || '#3182F6'
  const coloredShadow = neumorphism ? getColoredShadow(primary) : null

  if (variant === 'compact') {
    return (
      <button onClick={onPress} className={neumorphism ? 'neu-card' : undefined} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderRadius: 12, border: 'none',
        background: neumorphism ? undefined : (t?.primaryLight || '#E8F3FF'), cursor: 'pointer', textAlign: 'left',
      }}>
        <LockIcon color={primary} size={16} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: primary }}>
          {title || 'Pro에서 확인할 수 있어요'}
        </span>
        <ProBadge />
      </button>
    )
  }

  return (
    <button onClick={onPress} className={neumorphism ? 'neu-card' : undefined} style={{
      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '32px 20px', borderRadius: 20,
      border: neumorphism ? 'none' : `1.5px dashed ${primary}66`,
      background: neumorphism ? undefined : (t?.card || '#fff'), cursor: 'pointer', textAlign: 'center',
    }}>
      <LockIcon color={primary} size={26} />
      <p style={{ fontSize: 15, fontWeight: 700, color: t?.text || '#191F28' }}>✨ {title}</p>
      {description && (
        <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{description}</p>
      )}
      <span style={{
        marginTop: 4, padding: '9px 18px', borderRadius: 999,
        background: primary, color: '#fff', fontSize: 13, fontWeight: 700,
        boxShadow: neumorphism ? coloredShadow.raisedSm : undefined,
      }}>Pro 구독하고 확인하기</span>
    </button>
  )
}
