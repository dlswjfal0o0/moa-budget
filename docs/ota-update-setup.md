# OTA(무선) 업데이트 연동 가이드

내부 운영자용 문서입니다. 앱에 노출되지 않습니다. `@capgo/capacitor-updater`(Capgo)를 이용해 App Store 심사 없이 JS/웹 번들만 원격으로 즉시 배포하기 위한 나머지 설정 절차입니다. 클라이언트 코드(`src/main.jsx`, `capacitor.config.json`)는 이미 연동돼 있고, 여기 있는 단계는 Capgo 계정이 필요해 사람이 직접 해야 합니다.

## 사전 준비

1. https://capgo.app 에서 계정을 만든다 (무료 티어로 시작 가능).
2. CLI 로그인:
   ```
   npx @capgo/cli login <API_KEY>
   ```
   API 키는 capgo.app 대시보드 → Account → API Keys에서 발급.

## 앱 등록

```
npx @capgo/cli app add
```
`capacitor.config.json`의 `appId`(`com.moa.budget`)를 그대로 쓰면 된다.

## 첫 번들 업로드

```
npm run build
npx @capgo/cli bundle upload --channel production
```
- `--channel`은 배포 채널 이름. 베타 테스트용으로 별도 채널(`beta` 등)을 만들어 `build:beta` 산출물을 올릴 수도 있음.
- 업로드 후 대시보드에서 채널에 배포(Deploy)해야 실제 기기에 반영된다.

## 확인

- 앱을 재시작하면 `src/main.jsx`의 `CapacitorUpdater.notifyAppReady()` 호출로 새 번들이 "정상 부팅"으로 표시된다. 이 호출이 없으면 Capgo가 새 번들을 부팅 실패로 간주해 자동으로 이전 번들로 롤백한다.
- 네이티브 코드(Xcode/Info.plist/entitlements 등)나 Capacitor 플러그인을 바꾼 경우는 OTA로 배포할 수 없다 — 그건 반드시 App Store 심사를 거쳐야 한다. OTA는 JS/CSS/이미지 등 웹 번들 변경에만 쓸 수 있다.

## 주의

- Apple 심사 가이드라인(4.7 등)상 앱의 핵심 기능을 OTA로 바꾸는 건 제한적으로만 허용된다. 버그 수정/UI 조정 위주로 쓰고, 새 기능 추가는 정식 심사를 거치는 걸 권장.
