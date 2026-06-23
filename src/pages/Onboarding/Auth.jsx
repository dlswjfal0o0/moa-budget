import { useState } from 'react'
import { injectDemoData } from '../../utils/demoData'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  OAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, googleProvider } from '../../firebase/config'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'

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

  // 추가 state
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [touchedConfirm, setTouchedConfirm] = useState(false)

  // 비밀번호 강도
  const getStrength = (pw) => {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']
  const strengthLabel = ['', '약함', '보통', '강함', '매우 강함']
  const pwStrength = getStrength(password)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const confirmMatch = password === confirm && confirm.length > 0

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '1.5px solid #e8e8e8', fontSize: 15, color: '#111',
    outline: 'none', background: '#fafafa', boxSizing: 'border-box'
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
      localStorage.setItem('moa_logged_in', 'true')
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

  const handleApple = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await SignInWithApple.authorize({
        clientId: 'com.moa.budget',
        redirectURI: 'https://moa-budget.firebaseapp.com/__/auth/handler',
        scopes: 'email name',
      })
      const { identityToken } = result.response
      const provider = new OAuthProvider('apple.com')
      const credential = provider.credential({ idToken: identityToken })
      await signInWithCredential(auth, credential)
      navigate('/home', { replace: true })
    } catch (e) {
      setError('Apple 로그인에 실패했어요.')
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 'calc(env(safe-area-inset-top, 0px) + 32px) 28px 32px', background: '#fff' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          {mode === 'signup' ? '시작해볼까요?' : '다시 만나서 반가워요'}
        </h2>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
          {mode === 'signup' ? '계정을 만들어 데이터를 안전하게 저장하세요' : '계정에 로그인하세요'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 이메일 — 실시간 유효성 표시 */}
          <div style={{ position: 'relative' }}>
            <input
              style={{
                ...inputStyle,
                borderColor: touchedEmail && email
                  ? emailValid ? '#10b981' : '#ef4444'
                  : '#e8e8e8'
              }}
              type="email" placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouchedEmail(true)}
            />
            {touchedEmail && email && (
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                {emailValid ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#10b981"/>
                    <polyline points="5 12 10 17 19 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#ef4444"/>
                    <line x1="7" y1="7" x2="17" y2="17" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="17" y1="7" x2="7" y2="17" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                )}
              </span>
            )}
          </div>
          {touchedEmail && email && !emailValid && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: -6 }}>올바른 이메일 형식을 입력해 주세요</p>
          )}

          {/* 비밀번호 — 로그인 시 위에 레이블 + 비밀번호 찾기 링크 */}
          <div>
            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>비밀번호</span>
                <button onClick={() => { setShowReset(true); setResetEmail(email) }}
                  style={{ background: 'none', border: 'none', color: '#3182F6', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 44 }}
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center' }}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* 비밀번호 강도 — 회원가입 시만 */}
            {mode === 'signup' && password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 99,
                      background: i <= pwStrength ? strengthColor[pwStrength] : '#e8e8e8',
                      transition: 'background 0.2s' }} />
                  ))}
                </div>
                <p style={{ fontSize: 12, color: strengthColor[pwStrength] }}>{strengthLabel[pwStrength]}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: 6 }}>
                  {[
                    { label: '8자 이상', ok: password.length >= 8 },
                    { label: '대문자 포함', ok: /[A-Z]/.test(password) },
                    { label: '숫자 포함', ok: /[0-9]/.test(password) },
                    { label: '특수문자 포함', ok: /[^A-Za-z0-9]/.test(password) },
                  ].map(({ label, ok }) => (
                    <span key={label} style={{ fontSize: 11, color: ok ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                      {ok ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="#10b981"/>
                          <polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 비밀번호 확인 — show/hide + 일치 여부 */}
          {mode === 'signup' && (
            <div>
              <div style={{ position: 'relative' }}>
                <input
                  style={{
                    ...inputStyle, paddingRight: 44,
                    borderColor: touchedConfirm && confirm
                      ? confirmMatch ? '#10b981' : '#ef4444'
                      : '#e8e8e8'
                  }}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="비밀번호 확인"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onBlur={() => setTouchedConfirm(true)}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center' }}>
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {touchedConfirm && confirm && !confirmMatch && (
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>비밀번호가 일치하지 않습니다</p>
              )}
              {touchedConfirm && confirmMatch && (
                <p style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>비밀번호가 일치합니다</p>
              )}
            </div>
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

        {/* 데모 체험 버튼 */}
        <button
          onClick={() => {
            injectDemoData()
            navigate('/home', { replace: true })
          }}
          style={{
            width: '100%', padding: '12px', borderRadius: 14,
            background: 'transparent', color: '#aaa',
            border: '1.5px dashed #ddd', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', marginTop: 8
          }}>
          🛠 개발 로그인 (시뮬레이터 전용)
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

        <button
          onClick={handleApple}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: 12, marginTop: 10,
            border: '1.5px solid #e8e8e8', background: '#fff',
            fontSize: 14, color: '#333', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M12.97 9.36c-.02-2.01 1.64-2.98 1.71-3.02-.93-1.36-2.38-1.55-2.9-1.57-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.3 2-.14.24-1.3 2.28-.04 5.65.43 1.24.99 2.63 1.74 2.62.72-.01 1-.46 1.88-.46.87 0 1.12.46 1.89.44.76-.01 1.23-1.23 1.7-2.48.54-1.43.76-2.82.74-2.22z" fill="#000"/>
            <path d="M11.27 4.26c.64-.78 1.07-1.86.95-2.94-.92.04-2.03.61-2.69 1.38-.59.68-1.1 1.77-.97 2.82 1.03.08 2.07-.52 2.71-1.26z" fill="#000"/>
          </svg>
          Apple로 계속
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
