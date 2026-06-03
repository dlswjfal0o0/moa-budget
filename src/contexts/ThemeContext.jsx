import { useState, useEffect, createContext, useContext } from 'react'
import { THEMES } from '../styles/theme'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const snap = await getDoc(doc(db, 'users', user.uid))
            if (snap.exists() && snap.data().theme) {
                setThemeName(snap.data().theme)
                localStorage.setItem('theme', snap.data().theme)
            }
        }
    })
    return unsub
  }, [])

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, themeData }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)