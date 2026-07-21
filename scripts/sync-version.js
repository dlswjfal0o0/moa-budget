#!/usr/bin/env node
// package.json의 version을 소스 오브 트루스로 삼아 iOS
// project.pbxproj의 MARKETING_VERSION(마케팅 버전)과
// CURRENT_PROJECT_VERSION(빌드 번호)을 동기화한다.
// 빌드 번호는 git 커밋 개수를 쓴다 — 커밋할 때마다 자동으로 단조 증가하고,
// 별도 상태를 파일에 저장/추적할 필요가 없다.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'))
const marketingVersion = pkg.version
const buildNumber = execSync('git rev-list --count HEAD', { cwd: rootDir }).toString().trim()

const pbxprojPath = join(rootDir, 'ios/App/App.xcodeproj/project.pbxproj')
let pbxproj = readFileSync(pbxprojPath, 'utf-8')

pbxproj = pbxproj.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${marketingVersion};`)
pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`)

writeFileSync(pbxprojPath, pbxproj)

console.log(`Synced iOS version: MARKETING_VERSION=${marketingVersion}, CURRENT_PROJECT_VERSION=${buildNumber}`)
