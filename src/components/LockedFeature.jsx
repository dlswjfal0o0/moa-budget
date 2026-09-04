import { useTheme } from '../contexts/ThemeContext'

export function ProBadge({ style }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: '#fff', background: '#191F28',
      padding: '2px 6px', borderRadius: 6, letterSpacing: 0.3, flexShrink: 0, ...style,
    }}>✨ PRO</span>
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
  const { themeData: t } = useTheme() || {}
  const primary = t?.primary || '#3182F6'

  if (variant === 'compact') {
    return (
      <button onClick={onPress} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderRadius: 12, border: 'none',
        background: t?.primaryLight || '#E8F3FF', cursor: 'pointer', textAlign: 'left',
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
    <button onClick={onPress} style={{
      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '32px 20px', borderRadius: 20, border: `1.5px dashed ${primary}66`,
      background: t?.card || '#fff', cursor: 'pointer', textAlign: 'center',
    }}>
      <LockIcon color={primary} size={26} />
      <p style={{ fontSize: 15, fontWeight: 700, color: t?.text || '#191F28' }}>✨ {title}</p>
      {description && (
        <p style={{ fontSize: 13, color: '#8B95A1', lineHeight: 1.5 }}>{description}</p>
      )}
      <span style={{
        marginTop: 4, padding: '9px 18px', borderRadius: 999,
        background: primary, color: '#fff', fontSize: 13, fontWeight: 700,
      }}>Pro 구독하고 확인하기</span>
    </button>
  )
}
