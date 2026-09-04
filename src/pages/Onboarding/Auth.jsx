import { useState } from 'react'
import { injectDemoData } from '../../utils/demoData'
import FixedPortal from '../../components/FixedPortal'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { auth, db } from '../../firebase/config'
import { doc, setDoc } from 'firebase/firestore'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'
import { Sentry } from '../../utils/sentry'

const isNative = () => {
  try { return window.Capacitor?.isNativePlatform?.() ?? false } catch { return false }
}

// 신규 가입 시 1개월 무료체험 시작 기록 + 전체화면 안내 팝업 1회 노출 플래그.
// Pro 게이팅은 네이티브 앱에서만 적용되므로(웹은 항상 무료), 웹 가입에서는 건너뛴다.
const startFreeTrial = async (uid) => {
  if (!isNative()) return
  await setDoc(doc(db, 'users', uid), { trialStartedAt: new Date().toISOString() }, { merge: true })
  localStorage.setItem('moa_show_trial_popup', 'true')
}

// App Store 심사용 데모 계정.
// 이 이메일로 로그인하면 데모 데이터가 자동으로 로드됩니다(심사자 전용).
// Firebase Authentication 콘솔에서 이 이메일 + 비밀번호로 계정을 미리 만들어 두세요.
// 원하는 주소로 바꿔도 되며, 심사 메모(App Review Information)에 아이디/비번을 적어주면 됩니다.
const DEMO_ACCOUNT_EMAIL = 'appreview@moa-budget.com'

// 약관/연령 동의용 커스텀 체크박스. 네이티브 accentColor는 브라우저마다
// 렌더링이 달라 보여서, 체크마크 드로잉 + 스프링 팝 애니메이션을 직접 그린다.
function CheckBox({ checked, onChange, children, style }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', ...style }}>
      <span className="checkbox-box">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="checkbox-visual" aria-hidden="true">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      <span style={{ fontSize: 13, color: '#666', lineHeight: 1.4, marginTop: 1 }}>{children}</span>
    </label>
  )
}

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
  const [resetLoading, setResetLoading] = useState(false)

  // 추가 state
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [touchedConfirm, setTouchedConfirm] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [termsConfirmed, setTermsConfirmed] = useState(false)

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
    outline: 'none', background: '#fafafa', boxSizing: 'border-box',
    transition: 'border-color 180ms ease, box-shadow 180ms ease'
  }

  // 화면 진입 및 로그인↔가입 전환 시 요소들이 순서대로 톡톡 떠오르는 캐스케이드 모션.
  // 렌더될 때마다 0으로 리셋되고, 실제로 그려지는 요소만 카운트가 올라가 순서가 어긋나지 않는다.
  let staggerIndex = 0
  const stagger = () => ({
    animation: 'fadeSlideUp 420ms cubic-bezier(0.22,1,0.36,1) both',
    animationDelay: `${staggerIndex++ * 45}ms`,
  })

  const handleEmail = async () => {
    setError('')
    if (mode === 'signup' && !ageConfirmed) return setError('만 14세 이상만 가입할 수 있어요.')
    if (mode === 'signup' && !termsConfirmed) return setError('이용약관 및 개인정보 처리방침에 동의해주세요.')
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
      const isDemoAccount = email.trim().toLowerCase() === DEMO_ACCOUNT_EMAIL
      // 심사용 데모 계정이면 데모 데이터 로드, 그 외 일반 유저는 데모 모드 해제
      if (isDemoAccount) {
        injectDemoData()
      } else {
        localStorage.removeItem('moa_demo_mode')
      }
      // 신규 가입자는 AI 분석 스타일 온보딩으로, 기존 로그인은 바로 홈으로
      if (mode === 'signup' && !isDemoAccount) {
        await startFreeTrial(auth.currentUser.uid)
        navigate('/onboarding/ai-style', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    } catch (e) {
      console.error('[Auth] 이메일 로그인/가입 실패:', e.code, e.message)
      Sentry.captureException(e)
      if (e.code === 'auth/email-already-in-use') setError('이미 사용 중인 이메일이에요.')
      else if (e.code === 'auth/user-not-found') setError('등록되지 않은 이메일이에요.')
      else if (e.code === 'auth/wrong-password') setError('비밀번호가 틀렸어요.')
      else setError('오류가 발생했어요. 다시 시도해주세요.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError('')
    if (mode === 'signup' && !ageConfirmed) return setError('만 14세 이상만 가입할 수 있어요.')
    if (mode === 'signup' && !termsConfirmed) return setError('이용약관 및 개인정보 처리방침에 동의해주세요.')
    setLoading(true)
    try {
      // signInWithPopup은 이 웹뷰에서 동작하지 않아(popupRedirectResolver를 꺼둔 상태 —
      // firebase/config.js 참고) 네이티브 Google 로그인 UI로 자격증명만 받아오고,
      // skipNativeAuth: true 설정 덕에 네이티브 SDK 자체는 로그인 상태를 커밋하지 않는다.
      // 실제 로그인 상태는 signInWithCredential로 웹 SDK(=Firestore가 쓰는 그 auth)에만
      // 반영해서, 인증 상태의 진실 소스를 웹 SDK 하나로 유지한다.
      const { credential } = await FirebaseAuthentication.signInWithGoogle()
      if (!credential?.idToken) throw new Error('Google 인증 토큰을 받지 못했어요.')
      const authCredential = GoogleAuthProvider.credential(credential.idToken)
      const result = await signInWithCredential(auth, authCredential)
      localStorage.removeItem('moa_demo_mode')
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser
      if (isNewUser) await startFreeTrial(result.user.uid)
      navigate(isNewUser ? '/onboarding/ai-style' : '/home', { replace: true })
    } catch (e) {
      console.error('[Auth] Google 로그인 실패:', e.code, e.message)
      Sentry.captureException(e)
      setError('Google 로그인에 실패했어요.')
    }
    setLoading(false)
  }

  const handleApple = async () => {
    setError('')
    if (mode === 'signup' && !ageConfirmed) return setError('만 14세 이상만 가입할 수 있어요.')
    if (mode === 'signup' && !termsConfirmed) return setError('이용약관 및 개인정보 처리방침에 동의해주세요.')
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
      const signInResult = await signInWithCredential(auth, credential)
      localStorage.removeItem('moa_demo_mode')
      const isNewUser = getAdditionalUserInfo(signInResult)?.isNewUser
      if (isNewUser) await startFreeTrial(signInResult.user.uid)
      navigate(isNewUser ? '/onboarding/ai-style' : '/home', { replace: true })
    } catch (e) {
      console.error('[Auth] Apple 로그인 실패:', e.code || e.message, e)
      Sentry.captureException(e)
      setError('Apple 로그인에 실패했어요.')
    }
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) return setResetError('이메일을 입력해주세요.')
    // 전송 중 연타로 인한 중복 요청 방지
    if (resetLoading) return
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetSent(true)
      setResetError('')
    } catch (err) {
      if (err.code === 'auth/user-not-found') setResetError('등록되지 않은 이메일이에요.')
      else if (err.code === 'auth/invalid-email') setResetError('올바른 이메일 형식이 아니에요.')
      else setResetError('오류가 발생했어요. 다시 시도해주세요.')
    }
    setResetLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 'calc(env(safe-area-inset-top, 0px) + 32px) 28px 32px', background: '#fff' }}>
      {/* key={mode}: 로그인↔가입 전환 시 카드 내용을 통째로 다시 마운트시켜
          아래 stagger() 캐스케이드 모션이 매번 처음부터 다시 재생되게 한다 */}
      <div key={mode} style={{ flex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6, ...stagger() }}>
          {mode === 'signup' ? '시작해볼까요?' : '다시 만나서 반가워요'}
        </h2>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 32, ...stagger() }}>
          {mode === 'signup' ? '계정을 만들어 데이터를 안전하게 저장하세요' : '계정에 로그인하세요'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 이메일 */}
          <div style={{ position: 'relative', ...stagger() }}>
            <input
              style={{
                ...inputStyle,
                paddingRight: email ? 44 : undefined,
                borderColor: touchedEmail && email && !emailValid ? '#ef4444' : '#e8e8e8'
              }}
              type="email" placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouchedEmail(true)}
            />
            {email && (
              <button
                type="button"
                onClick={() => setEmail('')}
                aria-label="이메일 지우기"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#D1D5DB"/>
                  <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="15.5" y1="8.5" x2="8.5" y2="15.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          {touchedEmail && email && !emailValid && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: -6 }}>올바른 이메일 형식을 입력해 주세요</p>
          )}

          {/* 비밀번호 — 로그인 시 위에 레이블 + 비밀번호 찾기 링크 */}
          <div style={stagger()}>
            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>비밀번호</span>
                <button className="pressable-subtle" onClick={() => { setShowReset(true); setResetEmail(email) }}
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
              <button className="pressable-subtle" type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
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
                        <svg key="ok" width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: 'iconPop 280ms cubic-bezier(0.34,1.56,0.64,1)' }}>
                          <circle cx="12" cy="12" r="10" fill="#10b981"/>
                          <polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg key="pending" width="12" height="12" viewBox="0 0 24 24" fill="none">
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
            <div style={stagger()}>
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
                <button className="pressable-subtle" type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 표시'}
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
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4, animation: 'fadeSlideUp 200ms ease' }}>비밀번호가 일치하지 않습니다</p>
              )}
              {touchedConfirm && confirmMatch && (
                <p style={{ fontSize: 12, color: '#10b981', marginTop: 4, animation: 'fadeSlideUp 200ms ease' }}>비밀번호가 일치합니다</p>
              )}
            </div>
          )}

          {/* 연령 확인 — 회원가입 시만, 이메일/Google/Apple 가입 공통 게이트 */}
          {mode === 'signup' && (
            <CheckBox checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} style={stagger()}>
              만 14세 이상입니다
            </CheckBox>
          )}

          {/* 약관 동의 — 회원가입 시만, 이메일/Google/Apple 가입 공통 게이트 */}
          {mode === 'signup' && (
            <CheckBox checked={termsConfirmed} onChange={e => setTermsConfirmed(e.target.checked)} style={stagger()}>
              <span
                onClick={(e) => { e.preventDefault(); window.open('https://moa-budget.vercel.app/terms.html', '_blank') }}
                style={{ color: '#3182F6', textDecoration: 'underline' }}
              >이용약관</span>
              {' '}및{' '}
              <span
                onClick={(e) => { e.preventDefault(); window.open('https://moa-budget.vercel.app/privacy.html', '_blank') }}
                style={{ color: '#3182F6', textDecoration: 'underline' }}
              >개인정보 처리방침</span>
              에 동의합니다
            </CheckBox>
          )}

        </div>

        {error && (
          <p key={error} style={{ fontSize: 13, color: '#ef4444', marginTop: 10, animation: 'shakeX 400ms cubic-bezier(0.36,0.07,0.19,0.97)' }}>{error}</p>
        )}

        <button
          className="pressable"
          onClick={handleEmail}
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: loading ? '#a7cbfdff' : 'linear-gradient(135deg, #4C93FF 0%, #3182F6 60%, #2A6FE0 100%)',
            color: '#fff', border: 'none', fontSize: 16, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop: 20,
            boxShadow: loading ? 'none' : '0 8px 20px rgba(49,130,246,0.28)',
            transition: 'background 200ms ease, box-shadow 200ms ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            ...stagger()
          }}>
          {loading && <span className="spin-loader" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />}
          {loading ? '처리 중' : mode === 'signup' ? '이메일로 가입' : '로그인'}
        </button>

        {/* 베타 테스트 로그인 — npm run build:beta(VITE_BETA=true)로 만든 TestFlight용 빌드와
            로컬 개발 서버에서만 노출된다. 앱스토어 심사/배포용 빌드(npm run build)에는 절대 포함되지 않음. */}
        {(import.meta.env.DEV || import.meta.env.VITE_BETA === 'true') && (
          <button
            className="pressable-subtle"
            onClick={() => {
              injectDemoData()
              navigate('/home', { replace: true })
            }}
            style={{
              width: '100%', padding: '12px', borderRadius: 14,
              background: 'transparent', color: '#aaa',
              border: '1.5px dashed #ddd', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', marginTop: 8,
              ...stagger()
            }}>
            🛠 베타 테스트 로그인
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', ...stagger() }}>
          <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
          <span style={{ fontSize: 12, color: '#bbb' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
        </div>

        <button
          className="pressable-subtle"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: 12,
            border: '1.5px solid #e8e8e8', background: '#fff',
            fontSize: 14, color: '#333', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            ...stagger()
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
          className="pressable-subtle"
          onClick={handleApple}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: 12, marginTop: 10,
            border: '1.5px solid #e8e8e8', background: '#fff',
            fontSize: 14, color: '#333', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            ...stagger()
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000"/>
          </svg>
          Apple로 계속
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#999' }}>
        <span key={mode} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, animation: 'fadeIn 260ms ease' }}>
          {mode === 'signup' ? '이미 계정이 있나요? ' : '계정이 없나요? '}
          <span
            className="pressable-subtle"
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}
            style={{ color: '#3182F6', fontWeight: 600, cursor: 'pointer' }}>
            {mode === 'signup' ? '로그인' : '회원가입'}
          </span>
        </span>
      </p>

      {/* 비밀번호 찾기 모달 */}
      {showReset && (
        <FixedPortal>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 220ms ease' }}
          onClick={() => { setShowReset(false); setResetSent(false); setResetError(''); setResetEmail(''); setResetLoading(false) }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 44px', animation: 'slideInUp 320ms cubic-bezier(0.22,1,0.36,1)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e0e0e0', margin: '0 auto 20px' }} />
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16, animation: 'iconPop 380ms cubic-bezier(0.34,1.56,0.64,1)' }}>📧</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>이메일을 보냈어요!</p>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: '#111' }}>{resetEmail}</span>으로<br/>
                  비밀번호 재설정 링크를 보냈어요.
                </p>
                <button className="pressable" onClick={() => { setShowReset(false); setResetSent(false); setResetEmail('') }}
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
                {resetError && <p key={resetError} style={{ fontSize: 13, color: '#ef4444', marginBottom: 8, animation: 'shakeX 400ms cubic-bezier(0.36,0.07,0.19,0.97)' }}>{resetError}</p>}
                <button className="pressable" onClick={handlePasswordReset} disabled={resetLoading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: resetLoading ? '#a7cbfdff' : '#3182F6', color: '#fff', border: 'none',
                    fontSize: 15, fontWeight: 600, cursor: resetLoading ? 'not-allowed' : 'pointer', marginTop: 8,
                    transition: 'background 200ms ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                  {resetLoading && <span className="spin-loader" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />}
                  {resetLoading ? '전송 중' : '재설정 링크 보내기'}
                </button>
              </>
            )}
          </div>
        </div>
        </FixedPortal>
      )}
    </div>
  )
}
