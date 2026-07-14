import { initializeApp } from "firebase/app"
import { initializeAuth, GoogleAuthProvider, browserSessionPersistence } from "firebase/auth"
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

// getAuth(app) 대신 initializeAuth를 직접 써서 두 가지를 명시적으로 제어한다:
//
// 1. persistence: browserSessionPersistence(sessionStorage)만 사용 — 기본값인
//    browserLocalPersistence는 내부적으로 IndexedDB를 쓰는데, 이 앱의 Capacitor iOS
//    WKWebView(https://localhost 커스텀 스킴)에서 IndexedDB 호출이 응답 없이 멈춰버려서
//    (Promise가 영원히 pending) 로그인 자체가 끝나지 않는 문제가 있었다. 앱을 완전히
//    종료(kill)하면 재로그인이 필요해지는 트레이드오프가 있지만, 로그인이 아예 안 되는
//    것보다는 낫다.
// 2. popupRedirectResolver: undefined — getAuth(app)는 이걸 자동으로 채워서 초기화
//    시점에 iframe/gapi.js를 미리 로드하려고 시도한다(네트워크 탭에 계속 보였던
//    cb=gapi.loaded_*, apis.google.com/api.js가 이것). 이 자동 초기화 자체가 행잉의
//    또 다른 원인일 수 있어 명시적으로 꺼둔다. 대가로 signInWithPopup(Google 로그인)은
//    이 웹뷰에서 동작하지 않을 가능성이 높다 — Apple 로그인은 별도 네이티브 플러그인이라
//    무관하고, Google도 필요하면 나중에 네이티브 Google Sign-In 플러그인으로 옮겨야 한다.
export const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
  popupRedirectResolver: undefined,
})
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()