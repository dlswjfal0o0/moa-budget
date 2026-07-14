import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, browserSessionPersistence, setPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// App Check(reCAPTCHA v3)는 시도했다가 되돌렸다 — Capacitor iOS의 WKWebView 안에서
// reCAPTCHA 챌린지/토큰 교환이 네트워크 단에서 실패했고(auth/network-request-failed),
// 그 실패가 실제 로그인 요청까지 끌고 내려가 이메일/비밀번호 로그인을 막았다.
// reCAPTCHA v3는 애초에 일반 웹페이지용이라 임베디드 웹뷰에서 이런 문제가 흔함 — 다시
// 붙이려면 iOS 네이티브 App Attest/DeviceCheck 프로바이더로 가야 하고, 별도로 충분히
// 검증한 뒤 도입해야 한다.

const firebaseConfig = {
  apiKey: "AIzaSyBSeLYCOH2bL3KXKQby2-ty_y3E9n9msys",
  authDomain: "moa-budget.firebaseapp.com",
  projectId: "moa-budget",
  storageBucket: "moa-budget.firebasestorage.app",
  messagingSenderId: "327190499292",
  appId: "1:327190499292:web:1363d5cf3d6c84bc47c919"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// browserLocalPersistence(기본값)는 내부적으로 IndexedDB를 쓰는데, 이 앱의 Capacitor
// iOS WKWebView(https://localhost 커스텀 스킴)에서 IndexedDB 호출이 응답 없이
// 멈춰버려서(Promise가 영원히 pending) 로그인 자체가 끝나지 않는 문제가 있었다.
// sessionStorage만 쓰는 browserSessionPersistence로 우회 — 앱을 완전히 종료(kill)하면
// 재로그인이 필요해지는 트레이드오프가 있지만, 로그인이 아예 안 되는 것보다는 낫다.
;(async () => {
    await setPersistence(auth, browserSessionPersistence).catch(() => {})
})()
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()