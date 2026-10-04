import { GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'

// 네이티브 Google/Apple 로그인 UI로 Firebase 자격증명만 받아온다(로그인·탈퇴 전 재인증 공용).
// signInWithPopup은 이 웹뷰에서 동작하지 않아서(firebase/config.js 참고) 네이티브 UI를 쓰고,
// 실제 로그인 상태 반영은 호출부가 signInWithCredential / reauthenticateWithCredential로 한다.

export async function getGoogleCredential() {
  const { credential } = await FirebaseAuthentication.signInWithGoogle()
  if (!credential?.idToken) throw new Error('Google 인증 토큰을 받지 못했어요.')
  return GoogleAuthProvider.credential(credential.idToken)
}

// authorizationCode는 탈퇴 시 Apple 연결 해제(revokeAccessToken)에 쓴다
export async function getAppleCredential() {
  const result = await SignInWithApple.authorize({
    clientId: 'com.moa.budget',
    redirectURI: 'https://moa-budget.firebaseapp.com/__/auth/handler',
    scopes: 'email name',
  })
  const { identityToken, authorizationCode } = result.response
  const credential = new OAuthProvider('apple.com').credential({ idToken: identityToken })
  return { credential, authorizationCode }
}
