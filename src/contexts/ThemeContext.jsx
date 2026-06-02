import { createContext, useContext, useState } from 'react'
import { THEMES } from '../styles/theme'

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

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, themeData }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)