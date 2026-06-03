import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, googleProvider } from '../../firebase/config'

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(location.state?.mode || 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '1.5px solid #e8e8e8', fontSize: 15, color: '#111',
    outline: 'none', background: '#fafafa'
  }

  const handleEmail = async () => {
  setError('')
  if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
  if (mode === 'signup' && password !== confirm) return setError('비밀번호가 일치하지 않아요.')
  if (password.length < 6) return setError('비밀번호는 6자 이상이어야 해요.')

  setLoading(true)
  try {
    if (mode === 'signup') {
      await createUserWithEmailAndPassword(auth, email, password)
    } else {
      await signInWithEmailAndPassword(auth, email, password)
    }
    navigate('/home', { replace: true })
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') setError('이미 사용 중인 이메일이에요.')
    else if (e.code === 'auth/user-not-found') setError('등록되지 않은 이메일이에요.')
    else if (e.code === 'auth/wrong-password') setError('비밀번호가 틀렸어요.')
    else setError('오류가 발생했어요. 다시 시도해주세요.')
  }
  setLoading(false)
}

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/home', { replace: true })
    } catch (e) {
      setError('Google 로그인에 실패했어요.')
    }
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) return setResetError('이메일을 입력해주세요.')
    try {
        await sendPasswordResetEmail(auth, resetEmail)
        setResetSent(true)
        setResetError('')
    } catch (err) {
        if (err.code === 'auth/user-not-found') setResetError('등록되지 않은 이메일이에요.')
        else if (err.code === 'auth/invalid-email') setResetError('올바른 이메일 형식이 아니에요.')
        else setResetError('오류가 발생했어요. 다시 시도해주세요.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '48px 28px 32px', background: '#fff' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          {mode === 'signup' ? '시작해볼까요?' : '다시 만나서 반가워요 👋'}
        </h2>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
          {mode === 'signup' ? '계정을 만들어 데이터를 안전하게 저장하세요' : '계정에 로그인하세요'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
          <input style={inputStyle} type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} />
          {mode === 'signup' && (
            <input style={inputStyle} type="password" placeholder="비밀번호 확인" value={confirm} onChange={e => setConfirm(e.target.value)} />
          )}

          {mode === 'login' && (
            <button onClick={() => { setShowReset(true); setResetEmail(email) }}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', padding: '2px 0', textAlign: 'right', width: '100%' }}>
                비밀번호를 잊으셨나요?
            </button>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', marginTop: 10 }}>{error}</p>
        )}

        <button
          onClick={handleEmail}
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: loading ? '#a7cbfdff' : '#3182F6', color: '#fff',
            border: 'none', fontSize: 16, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop: 20
          }}>
          {loading ? '처리 중...' : mode === 'signup' ? '이메일로 가입' : '로그인'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
          <span style={{ fontSize: 12, color: '#bbb' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: 12,
            border: '1.5px solid #e8e8e8', background: '#fff',
            fontSize: 14, color: '#333', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Google로 계속
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#999' }}>
        {mode === 'signup' ? '이미 계정이 있나요? ' : '계정이 없나요? '}
        <span
          onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}
          style={{ color: '#3182F6', fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'signup' ? '로그인' : '회원가입'}
        </span>
      </p>

      {/* 비밀번호 찾기 모달 */}
      {showReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowReset(false); setResetSent(false); setResetError(''); setResetEmail('') }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 44px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e0e0e0', margin: '0 auto 20px' }} />
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>이메일을 보냈어요!</p>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: '#111' }}>{resetEmail}</span>으로<br/>
                  비밀번호 재설정 링크를 보냈어요.
                </p>
                <button onClick={() => { setShowReset(false); setResetSent(false); setResetEmail('') }}
                  style={{ marginTop: 24, width: '100%', padding: '14px', borderRadius: 12, background: '#111', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  확인
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 }}>비밀번호 찾기</p>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>가입한 이메일로 재설정 링크를 보내드려요.</p>
                <input type="email" placeholder="이메일 주소" value={resetEmail}
                  onChange={e => { setResetEmail(e.target.value); setResetError('') }}
                  style={{ ...inputStyle, marginBottom: 8 }} />
                {resetError && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>{resetError}</p>}
                <button onClick={handlePasswordReset}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#3182F6', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                  재설정 링크 보내기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}