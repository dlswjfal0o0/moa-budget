import { Component } from 'react'

// 화면 렌더링 중 예외가 하나라도 터지면 앱 전체가 흰 화면으로 멈추는 걸 막는 최후의 안전망.
// App.jsx에서 라우트가 바뀔 때마다 key로 리마운트되므로, 다른 탭으로 이동하면 에러 상태가 자동으로 풀린다.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  handleGoHome = () => {
    window.location.href = '/home'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: '#fffbf5',
        }}
      >
        <div style={{ fontSize: 40 }}>😵</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>
          문제가 생겼어요
        </p>
        <p style={{ fontSize: 14, color: '#8B95A1' }}>
          잠시 후 다시 시도해 주세요. 문제가 계속되면 앱을 다시 실행해 주세요.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: '#4F46E5',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            다시 시도
          </button>
          <button
            onClick={this.handleGoHome}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: '1.5px solid #e8e8e8',
              background: '#fff',
              color: '#111',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            처음으로
          </button>
        </div>
      </div>
    )
  }
}
