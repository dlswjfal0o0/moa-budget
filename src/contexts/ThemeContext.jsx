import { useState, useEffect, createContext, useContext } from 'react'
import { THEMES } from '../styles/theme'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getNeuPalette } from '../utils/neuColors'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState(
    () => localStorage.getItem('moa-theme') || 'toss'
  )

  const setThemeName = (name) => {
    setThemeNameState(name)
    localStorage.setItem('moa-theme', name)
  }

  const themeData = THEMES[themeName] || THEMES.toss

  const [showUtilities, setShowUtilities] = useState(() =>
    localStorage.getItem('moa_showUtilities') === 'true'
  )

  // 하단바 눌린 탭 표시 스타일: 기본은 아이콘에 딱 맞는 플랫 하이라이트,
  // 켜면 기존의 오목한 뉴모피즘 pill 스타일로 바뀐다.
  const [navNeumorphism, setNavNeumorphism] = useState(() =>
    localStorage.getItem('moa_navNeumorphism') === 'true'
  )

  // 앱 전체 뉴모피즘 테마(베타): 켜면 지원된 화면이 소프트 UI 스타일의
  // 별도 버전으로 표시된다. 아직 지원하지 않는 화면은 기존 디자인을 그대로 유지.
  // 하단바 뉴모피즘(navNeumorphism)은 이 토글에 종속되어 함께 켜지고 꺼진다.
  const [neumorphism, setNeumorphismState] = useState(() =>
    localStorage.getItem('moa_neumorphism') === 'true'
  )
  const setNeumorphism = (val) => {
    setNeumorphismState(val)
    localStorage.setItem('moa_neumorphism', String(val))
    setNavNeumorphism(val)
    localStorage.setItem('moa_navNeumorphism', String(val))
  }

  // 뉴모피즘 배경/그림자 색상을 선택된 테마 색상에 맞춰 :root에 반영한다.
  // document.documentElement에 설정해야 BottomSheet 등 portal로 렌더링되는
  // 요소들도 DOM 트리 위치와 무관하게 동일한 값을 상속받는다.
  useEffect(() => {
    const palette = getNeuPalette(themeData.primary)
    const root = document.documentElement
    root.style.setProperty('--neu-bg', palette.bg)
    root.style.setProperty('--neu-dark', palette.dark)
    root.style.setProperty('--neu-light', palette.light)
  }, [themeData.primary])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const snap = await getDoc(doc(db, 'users', user.uid))
            if (snap.exists() && snap.data().theme) {
                setThemeName(snap.data().theme)
                localStorage.setItem('theme', snap.data().theme)
            }

            if (snap.data().showUtilities !== undefined) {
                setShowUtilities(snap.data().showUtilities)
                localStorage.setItem('moa_showUtilities', String(snap.data().showUtilities))
            }

            if (snap.data().navNeumorphism !== undefined) {
                setNavNeumorphism(snap.data().navNeumorphism)
                localStorage.setItem('moa_navNeumorphism', String(snap.data().navNeumorphism))
            }

            if (snap.data().neumorphism !== undefined) {
                setNeumorphismState(snap.data().neumorphism)
                localStorage.setItem('moa_neumorphism', String(snap.data().neumorphism))
            }
        }
    })
    return unsub
  }, [])

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, themeData, showUtilities, setShowUtilities, navNeumorphism, setNavNeumorphism, neumorphism, setNeumorphism }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext)