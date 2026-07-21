import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const { version: appVersion } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

export default defineConfig({
  plugins: [react()],
  base: './',
  // package.json을 직접 import하면(특히 lazy-load되는 청크에서) 정적/동적 import가
  // 섞여 dev 서버가 해당 청크의 React 인스턴스를 중복 생성하는 문제가 있었다
  // (MyPage에서 "Invalid hook call"로 재현됨). 빌드 시점 상수로 대체해 이 문제를 피한다.
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
})
