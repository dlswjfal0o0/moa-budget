import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"

const firebaseConfig = {
  apiKey: "AIzaSyBSeLYCOH2bL3KXKQby2-ty_y3E9n9msys",
  authDomain: "moa-budget.firebaseapp.com",
  projectId: "moa-budget",
  storageBucket: "moa-budget.firebasestorage.app",
  messagingSenderId: "327190499292",
  appId: "1:327190499292:web:1363d5cf3d6c84bc47c919"
}

// reCAPTCHA v3 사이트 키 — App Check 전용이며 공개돼도 안전한 값(시크릿 아님).
// Firestore/Auth 요청이 진짜 이 앱(웹/Capacitor iOS)에서 왔는지 검증하는 용도.
const RECAPTCHA_SITE_KEY = "6LfnU1MtAAAAAHLnmznyzJH1mcRbs43Uvw1T_onM"

const app = initializeApp(firebaseConfig)

// 로컬 개발(vite dev)에서는 실제 reCAPTCHA 검증이 통과하지 않으므로 디버그 토큰을 쓴다.
// 최초 실행 시 콘솔에 찍히는 토큰을 Firebase 콘솔 > App Check > 디버그 토큰에 등록해두면
// 이후로는 로컬에서도 정상적으로 App Check 토큰이 발급된다.
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

// Firestore/Auth가 아직 App Check를 "Unenforced"로 두고 있는 동안은 토큰 발급이
// 실패해도 요청 자체는 그대로 통과하므로, 초기화 실패가 앱을 막지 않도록 방어한다.
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  })
} catch (err) {
  console.error('[AppCheck] 초기화 실패:', err)
}

export const auth = getAuth(app)
;(async () => {
    await setPersistence(auth, browserLocalPersistence).catch(() => {})
})()
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()