# iOS 릴리스 CI(Fastlane + TestFlight) 연동 가이드

내부 운영자용 문서입니다. 앱에 노출되지 않습니다. `.github/workflows/release.yml`에서 `workflow_dispatch`(수동 실행)로 Fastlane(`ios/App/fastlane`)을 돌려 iOS 앱을 빌드·서명해 TestFlight에 업로드합니다. 클라이언트/CI 코드는 이미 다 만들어져 있고, 여기 있는 단계는 Apple 계정 크리덴셜이 필요해 사람이 직접 해야 합니다.

`fastlane match`(인증서를 별도 저장소에 보관하는 방식)는 쓰지 않습니다 — 대신 로컬에서 직접 export한 인증서/프로파일을 GitHub Secrets에 등록해두고 CI가 그때그때 임시 키체인에 불러와 씁니다.

## 1. 배포용 인증서(.p12) 만들기

1. Xcode → Settings → Accounts에서 Apple ID 로그인 확인.
2. Keychain Access 앱 → 인증서 지원 → 인증기관에서 인증서 요청(CSR) 생성.
3. [developer.apple.com](https://developer.apple.com) → Certificates → **Apple Distribution** 타입으로 새 인증서 생성, 위 CSR 업로드 후 다운로드.
4. 다운로드한 `.cer` 파일을 더블클릭해서 Keychain Access에 설치.
5. Keychain Access에서 방금 설치한 인증서(개인키 포함, 화살표로 펼치면 보임)를 선택 → 우클릭 → **내보내기(Export)** → `.p12` 형식으로 저장, 이때 지정하는 비밀번호를 기억해둘 것 (`IOS_DIST_CERTIFICATE_PASSWORD`로 씀).

## 2. 배포용 프로비저닝 프로파일 만들기

1. developer.apple.com → Identifiers에서 `com.moa.budget` App ID 확인 — **Associated Domains**, **Sign in with Apple** capability가 켜져 있는지 확인 (안 켜져 있으면 여기서 켜기).
2. Profiles → 새 프로파일 생성 → 배포 유형 **App Store**(또는 App Store Connect) 선택 → App ID `com.moa.budget` 선택 → 1번에서 만든 배포용 인증서 선택 → 다운로드(`.mobileprovision`).

## 3. App Store Connect API 키 발급

1. [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → **통합(Integrations)** → App Store Connect API.
2. 새 키 생성 (역할: App Manager 이상). **`.p8` 파일은 딱 한 번만 다운로드할 수 있으니 바로 안전한 곳에 백업**.
3. 발급된 **Key ID**, **Issuer ID**를 메모.

## 4. 값들을 base64로 인코딩

터미널에서 (macOS 기준):
```
base64 -i AuthKey_XXXXXXXXXX.p12 | pbcopy   # 클립보드에 복사됨
base64 -i AppStore_com.moa.budget.mobileprovision | pbcopy
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
```

## 5. GitHub Secrets 등록

**주의: 이 값들을 저(Claude)에게 붙여넣지 말고, 아래 GitHub 저장소 설정 화면에 직접 입력하세요.**

저장소 → Settings → Secrets and variables → Actions → New repository secret 에서 아래 7개를 각각 등록:

| Secret 이름 | 값 |
|---|---|
| `IOS_DIST_CERTIFICATE_BASE64` | 1번에서 만든 `.p12`를 base64 인코딩한 값 |
| `IOS_DIST_CERTIFICATE_PASSWORD` | `.p12` export 시 지정한 비밀번호 |
| `IOS_PROVISIONING_PROFILE_BASE64` | 2번 `.mobileprovision`을 base64 인코딩한 값 |
| `APP_STORE_CONNECT_API_KEY_ID` | 3번 Key ID |
| `APP_STORE_CONNECT_API_ISSUER_ID` | 3번 Issuer ID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | 3번 `.p8`를 base64 인코딩한 값 |
| `IOS_CI_KEYCHAIN_PASSWORD` | 아무 문자열 (CI가 매 실행마다 만드는 임시 키체인용 비밀번호, 기억할 필요 없음) |

## 6. 실행

GitHub 저장소 → Actions 탭 → **Release (TestFlight)** 워크플로 선택 → **Run workflow** 버튼으로 수동 실행. `main` 브랜치 기준으로 빌드 → `scripts/sync-version.js`로 버전/빌드번호 동기화 → 서명 → TestFlight 업로드까지 자동 진행된다.

## 주의

- 여기서 쓰는 서명은 CI 전용이다 — 로컬 Xcode 개발 환경은 그대로 `CODE_SIGN_STYLE = Automatic`을 쓰고, `xcargs`로 빌드 시점에만 수동 서명값을 오버라이드하므로 로컬 개발에는 영향 없다.
- 인증서는 보통 1년, 프로비저닝 프로파일도 만료가 있다 — 갱신 시 1~5번을 다시 밟아 Secrets 값을 교체해야 한다.
- 이 워크플로는 App Store 심사 제출까지는 안 하고 **TestFlight 업로드까지만** 한다. 심사 제출은 App Store Connect에서 직접.
