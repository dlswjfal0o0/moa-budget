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

## 실전에서 겪은 문제들 (2026-07-22 첫 연동 기준)

- **같은 버전 번호로는 재업로드 안 됨**: Capgo는 채널별로 번들 버전을 자체 서버에서 추적하는데, 이게 `package.json`의 `version`과 완전히 별개다 (`package.json`이 `0.0.0`에 그대로 있어도 Capgo 쪽 버전은 독립적으로 `0.0.1`, `0.0.2`로 올라감). 이미 쓴 버전 번호로 다시 업로드하면 `❌ Version X already exists`로 거부되고 CLI가 다음 후보(patch/minor/커스텀)를 물어본다 — 다음 순번(patch bump)을 고르면 된다. 즉 재배포할 때마다 버전 번호를 반드시 바꿔야 기기가 "새 버전"으로 인식해서 실제로 받아간다. 버전이 같으면 업로드 자체는 성공해도 기기는 이미 최신이라고 판단해 다운로드를 안 한다.
- **`autoUpdate: "atBackground"`는 콜드 스타트에 안 먹는다**: 앱을 완전히 종료했다가 새로 켜는 것(cold start)만으로는 업데이트가 안 붙는다. 반드시 앱이 실행된 상태에서 **백그라운드로 보냈다가 다시 포그라운드로 복귀**해야 그 시점에 새 번들을 체크하고 적용한다. 네이티브 로그인 팝업(Google/Apple 로그인)처럼 순간적으로 앱을 백그라운드로 보내는 동작도 이 트리거가 될 수 있다. 테스트할 때 "분명 새 코드 반영했는데 왜 안 바뀌지?" 싶으면 먼저 이 타이밍부터 의심할 것.
- **`init` 흐름 중 "로그 감시(Monitor logs)"/"글로벌 복제 진행상황 보기" 프롬프트는 위험하다**: 실제로 이 폴링 루프가 5.8시간 넘게 멈추지 않고 돌다가 `JavaScript heap out of memory`로 Node 프로세스가 강제 종료된 사례가 있었다. 둘 다 **No**로 답하고, 실제 적용 여부는 대시보드(채널의 "마지막 버전")와 기기에서 직접 확인하는 걸 권장. ("이 설정 기억하기" 프롬프트도 Yes로 해서 다음부터 안 물어보게 해두면 편하다.)
- **`init`이 만드는 `.capgo_key_v2`(암호화 개인키)는 반드시 `.gitignore`에 추가**: "보안이 중요한 앱인가요?" 질문에 Yes(암호화 사용)로 답하면 로컬에 개인키/공개키 쌍이 생성된다. `.capgo_key_v2.pub`(공개키)는 커밋해도 되지만 `.capgo_key_v2`(개인키, 확장자 없는 쪽)는 유출되면 번들 위변조가 가능해지므로 **생성 직후 바로 `.gitignore`에 추가**하고 `git status`로 추적 안 되는지 확인할 것.
- **`npx cap run ios` 같은 명령어는 프로젝트 폴더 안에서 실행해야 함**: 엉뚱한 위치(프로젝트 루트가 아닌 곳)에서 실행하면 npx가 로컬에 설치된 `@capacitor/cli`의 `cap` 바이너리 대신 npm 레지스트리의 동명의 다른 패키지를 받으려다 `could not determine executable to run` 에러가 난다.
