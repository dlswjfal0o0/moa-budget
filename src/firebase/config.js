import { initializeApp } from "firebase/app"
import { initializeAuth } from "firebase/auth"
import { initializeFirestore } from "firebase/firestore"
import { Sentry } from "../utils/sentry"

// App Check(reCAPTCHA v3)는 시도했다가 되돌렸다 — Capacitor iOS의 WKWebView 안에서
// reCAPTCHA 챌린지/토큰 교환이 네트워크 단에서 실패했고(auth/network-request-failed),
// 그 실패가 실제 로그인 요청까지 끌고 내려가 이메일/비밀번호 로그인을 막았다.
// reCAPTCHA v3는 애초에 일반 웹페이지용이라 임베디드 웹뷰에서 이런 문제가 흔함 — 다시
// 붙이려면 iOS 네이티브 App Attest/DeviceCheck 프로바이더로 가야 하고, 별도로 충분히
// 검증한 뒤 도입해야 한다.

// 환경변수(.env / .env.development)에서 읽되, 값이 없으면 기존 하드코딩 값으로 폴백한다
// (환경변수 파일이 아직 없는 로컬 체크아웃에서도 동작이 끊기지 않게 하기 위함).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBSeLYCOH2bL3KXKQby2-ty_y3E9n9msys",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "moa-budget.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "moa-budget",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "moa-budget.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "327190499292",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:327190499292:web:1363d5cf3d6c84bc47c919"
}

const app = initializeApp(firebaseConfig)

// Firebase가 기본 제공하는 LOCAL persistence(browserLocalPersistence)는 IndexedDB를
// 쓰는데, 이 앱의 Capacitor iOS WKWebView(https://localhost 커스텀 스킴)에서 IndexedDB
// 호출이 응답 없이 멈춰버려서(Promise가 영원히 pending) 로그인 자체가 끝나지 않는
// 문제가 있었다. 반면 plain localStorage는 같은 환경에서 문제없이 동작한다(디버깅 내내
// 확인됨). Firebase Auth의 Persistence 인터페이스(_isAvailable/_set/_get/_remove/
// _addListener/_removeListener)를 직접 구현해서 IndexedDB를 완전히 우회하면서도
// localStorage 특성상 앱을 완전히 종료해도 세션이 유지된다(sessionStorage와 달리).
// 탭이 여러 개인 일반 브라우저가 아니라 웹뷰 하나뿐이라 addListener/removeListener는
// 다른 탭과의 동기화가 필요 없어 no-op으로 둬도 된다.
// Firebase 내부적으로 persistence 객체가 "클래스 정의"일 것을 기대해서(plain object
// literal을 넘기면 "INTERNAL ASSERTION FAILED: Expected a class definition" 에러 발생),
// object literal이 아니라 class로 정의한다.
class LocalStorageAuthPersistence {
  type = 'LOCAL'
  async _isAvailable() {
    try {
      const key = '__firebase_auth_persistence_test__'
      localStorage.setItem(key, '1')
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
  async _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      // 쓰기 실패(쿼터 초과 등)를 삼키지 않고 남겨두되, 절대 던지지는 않는다 — 여기서
      // 던지면 Firebase Auth 내부 상태 전이 도중이라 로그인 세션이 깨질 수 있다.
      Sentry.captureException(err)
    }
  }
  async _get(key) {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (err) {
      // 과거 비정상 종료 등으로 저장된 값이 깨져 있으면 JSON.parse가 예외를 던진다.
      // 이 예외를 그대로 흘려보내면 Firebase의 세션 복원 경로가 실패해서 실제로는
      // 로그인 상태인 유저가 "복원할 세션 없음"으로 취급돼 로그아웃 화면으로 튕기는
      // 오류로 이어질 수 있다 — 그래서 여기서 잡아 null로 폴백한다.
      Sentry.captureException(err)
      return null
    }
  }
  async _remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      Sentry.captureException(err)
    }
  }
  _addListener() {}
  _removeListener() {}
}

// getAuth(app) 대신 initializeAuth를 직접 써서 popupRedirectResolver를 명시적으로
// undefined로 둔다 — getAuth(app)는 이걸 자동으로 채워서 초기화 시점에 iframe/gapi.js를
// 미리 로드하려고 시도한다(네트워크 탭에 계속 보였던 cb=gapi.loaded_*,
// apis.google.com/api.js가 이것). 이 자동 초기화 자체가 행잉의 또 다른 원인일 수 있어
// 명시적으로 꺼둔다. 대가로 signInWithPopup(Google 로그인)은 이 웹뷰에서 동작하지
// 않는다 — Google 로그인은 @capacitor-firebase/authentication으로 네이티브 처리한다
// (Auth.jsx의 handleGoogle 참고).
// SDK가 내부적으로 `new`를 호출해 인스턴스화하므로 인스턴스가 아니라 클래스 자체를
// 넘긴다 — 인스턴스를 넘기면 "INTERNAL ASSERTION FAILED: Expected a class definition"
// 에러가 난다.
export const auth = initializeAuth(app, {
  persistence: LocalStorageAuthPersistence,
  popupRedirectResolver: undefined,
})

// Firestore의 기본 연결 방식(WebChannel 스트리밍)이 이 앱의 Capacitor iOS WKWebView에서
// 안정적으로 유지되지 않고 "channel" 요청이 계속 끊겼다 재연결되기를 반복해서(실시간
// 리스너를 하나도 안 쓰는데도) 화면 데이터 로딩이 눈에 띄게 느려지는 문제가 있었다.
// long-polling으로 강제 전환하면 이 스트리밍 연결 자체를 안 쓰게 되어 우회된다.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
})