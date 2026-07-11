// Firestore 초기 데이터 로딩 실패 시 보여주는 공통 배너.
// 실패해도 화면이 그냥 멈추거나 빈 상태로 보이지 않도록, 원인과 재시도 방법을 알려준다.
export default function LoadError({ message = '데이터를 불러오지 못했어요.', onRetry }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: '#FFF4F4',
        border: '1px solid #FFD9D9',
        borderRadius: 12,
        padding: '12px 16px',
        margin: '0 0 16px',
      }}
    >
      <span style={{ fontSize: 13, color: '#E23744' }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          flexShrink: 0,
          padding: '6px 14px',
          borderRadius: 8,
          border: 'none',
          background: '#E23744',
          color: '#fff',
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        다시 시도
      </button>
    </div>
  )
}
